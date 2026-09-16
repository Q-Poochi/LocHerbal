import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import KeyvRedis from '@keyv/redis';

interface MemoryThrottleRecord {
  totalHits: number;
  expiresAt: number;
  blockExpiresAt?: number;
}

/**
 * Shared throttler storage trên Redis với In-Memory Fallback.
 *
 * - Khi có Redis (Production / Multi-instance Railway): chia sẻ counter giữa các instance.
 * - Khi không có Redis hoặc Redis lỗi (Local Dev / Staging / Redis outage):
 *   Fallback sang In-Memory storage cục bộ thay vì fail-open, đảm bảo không bao giờ
 *   bị vô hiệu hóa rate limit (chống Brute-force & DoS).
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  private keyvRedis: KeyvRedis<any> | null = null;
  private memoryMap = new Map<string, MemoryThrottleRecord>();

  private cleanupMemoryMap(now: number) {
    if (this.memoryMap.size > 5000) {
      for (const [k, v] of this.memoryMap.entries()) {
        if (v.expiresAt <= now && (!v.blockExpiresAt || v.blockExpiresAt <= now)) {
          this.memoryMap.delete(k);
        }
      }
    }
  }

  private incrementInMemory(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): {
    totalHits: number;
    timeToExpire: number;
    isBlocked: boolean;
    timeToBlockExpire: number;
  } {
    const now = Date.now();
    this.cleanupMemoryMap(now);

    const k = `throttler:${throttlerName}:${key}`;
    let record = this.memoryMap.get(k);

    if (!record || record.expiresAt <= now) {
      record = { totalHits: 0, expiresAt: now + ttl };
    }

    let isBlocked = false;
    let timeToBlockExpire = 0;

    if (record.blockExpiresAt && record.blockExpiresAt > now) {
      isBlocked = true;
      timeToBlockExpire = Math.max(1, Math.ceil((record.blockExpiresAt - now) / 1000));
    }

    record.totalHits += 1;

    if (record.totalHits > limit) {
      if (!record.blockExpiresAt || record.blockExpiresAt <= now) {
        record.blockExpiresAt = now + blockDuration;
        timeToBlockExpire = Math.ceil(blockDuration / 1000);
      }
      isBlocked = true;
    }

    this.memoryMap.set(k, record);
    const timeToExpire = Math.max(1, Math.ceil((record.expiresAt - now) / 1000));

    return {
      totalHits: record.totalHits,
      timeToExpire,
      isBlocked,
      timeToBlockExpire,
    };
  }

  private async getClient(): Promise<any | null> {
    if (this.keyvRedis) {
      return this.keyvRedis.getClient();
    }
    const url = process.env.REDIS_URL;
    const host = process.env.REDIS_HOST;
    if (!url && !host) {
      return null;
    }
    this.keyvRedis = url
      ? new KeyvRedis(url)
      : new KeyvRedis({
          socket: {
            host,
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
          },
        });
    return this.keyvRedis.getClient();
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<{
    totalHits: number;
    timeToExpire: number;
    isBlocked: boolean;
    timeToBlockExpire: number;
  }> {
    try {
      const client = await this.getClient();
      if (!client) {
        return this.incrementInMemory(key, ttl, limit, blockDuration, throttlerName);
      }

      const k = `throttler:${throttlerName}:${key}`;
      const totalHits = await client.incr(k);
      if (totalHits === 1) {
        await client.pExpire(k, ttl);
      }
      const timeToExpire = Math.max(1, Math.ceil((await client.pTTL(k)) / 1000));

      let isBlocked = false;
      let timeToBlockExpire = 0;
      if (totalHits > limit) {
        const blockKey = `throttler-block:${throttlerName}:${key}`;
        const blockTtl = await client.pTTL(blockKey);
        if (blockTtl < 0) {
          await client.pSetEx(blockKey, blockDuration, '1');
          timeToBlockExpire = Math.ceil(blockDuration / 1000);
        } else {
          timeToBlockExpire = Math.max(1, Math.ceil(blockTtl / 1000));
        }
        isBlocked = true;
      }

      return { totalHits, timeToExpire, isBlocked, timeToBlockExpire };
    } catch (err) {
      // Fallback In-Memory khi Redis lỗi
      console.warn('[RedisThrottlerStorage] Redis failure, falling back to In-Memory rate limiting:', (err as Error)?.message);
      return this.incrementInMemory(key, ttl, limit, blockDuration, throttlerName);
    }
  }
}
