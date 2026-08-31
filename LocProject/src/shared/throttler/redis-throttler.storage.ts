import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import KeyvRedis from '@keyv/redis';

/**
 * Shared throttler storage trên Redis.
 *
 * Vì sao cần: ThrottlerGuard mặc định dùng in-memory storage — khi backend chạy
 * nhiều instance trên Railway, mỗi instance có counter riêng nên rate limit
 * thực tế = limit x số instance (đã xác nhận qua audit: X-RateLimit-Remaining
 * dao động 56-59 qua 20 request liên tiếp dù limit 60).
 * Redis dùng chung cho mọi instance -> rate limit hiệu quả thật.
 *
 * Fallback: nếu không cấu hình REDIS_URL/REDIS_HOST (dev không Redis) hoặc
 * Redis lỗi, trả về record "cho qua" (fail-open) để không làm sập API.
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  private keyvRedis: KeyvRedis<any> | null = null;

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
        return { totalHits: 1, timeToExpire: 0, isBlocked: false, timeToBlockExpire: 0 };
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
      // Fail-open: Redis lỗi thì không chặn request (tránh sập toàn bộ API)
      console.error('[RedisThrottlerStorage] increment failed, fail-open:', (err as Error)?.message);
      return { totalHits: 1, timeToExpire: 0, isBlocked: false, timeToBlockExpire: 0 };
    }
  }
}