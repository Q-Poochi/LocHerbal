import { Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { PrismaService } from './prisma.service';

const logger = new Logger('TxWithRetry');

/**
 * Timeout tường minh cho interactive transaction.
 * Mặc định 5s của Prisma không đủ dưới tải cao (pool pgbouncer nghẽn) —
 * đã gây loạt 500 (P2028) ở checkout và lỗi "Transaction already closed"
 * ở allocate. 15s/10s vẫn nhỏ hơn request timeout của app.
 */
export const TX_OPTIONS = { timeout: 15000, maxWait: 10000 };

/**
 * Nhận diện lỗi transaction-expiry của Prisma (P2028).
 * LƯU Ý QUAN TRỌNG: đây là lỗi AMBIGUOUS — commit có thể ĐÃ thành công phía
 * DB dù Prisma báo timeout. Nếu muốn retry, phải đối soát trạng thái thật
 * (qua audit trail / re-query) trước khi chạy lại để tránh thao tác kép.
 */
export function isTxTimeoutError(err: any): boolean {
  return (
    err?.code === 'P2028' ||
    /Transaction API (error|timed out)|Transaction already closed/i.test(
      String(err?.message || ''),
    )
  );
}

/**
 * Chạy $transaction với timeout/maxWait tường minh + retry CHỈ cho lỗi
 * P2028 (3 lần thử, backoff 100/300ms). Không retry mù các lỗi khác để
 * không che giấu lỗi nghiệp vụ thật.
 *
 * Chỉ dùng cho transaction "thuần đọc/ghi an toàn tái thực hiện" (idempotent
 * theo nghiệp vụ, ví dụ tạo order — rollback sạch khi P2028). Với transaction
 * có tác dụng phụ khó hoàn tác (allocate/release/deduct), gọi ở tầng service
 * kèm đối soát audit trail trước khi retry — xem InventoryService.
 */
export async function withTxRetry<T>(
  prisma: PrismaService,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  opts: { timeout: number; maxWait: number } = TX_OPTIONS,
): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await prisma.$transaction(fn, opts);
    } catch (err: any) {
      if (!isTxTimeoutError(err) || attempt === 3) {
        throw err;
      }
      const delay = attempt === 1 ? 100 : 300;
      logger.warn(`Transaction P2028 (lần ${attempt}/3) — retry sau ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('unreachable'); // loop luôn return/throw bên trên
}
