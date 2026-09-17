import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderCancelledEvent } from '../events/order-cancelled.event';

@Injectable()
export class OrphanedOrderSweeperJob {
  private readonly logger = new Logger(OrphanedOrderSweeperJob.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  // Chạy mỗi 5 phút
  @Cron('*/5 * * * *')
  async sweepOrphanedOrders() {
    const staleThreshold = new Date(Date.now() - 15 * 60 * 1000); // 15 phút

    const orphanedOrders = await this.prisma.order.findMany({
      where: {
        status: 'PENDING',
        allocationStatus: 'PENDING',
        createdAt: { lt: staleThreshold },
      },
      include: {
        items: { select: { productVariantId: true, qty: true } },
      },
    });

    if (orphanedOrders.length === 0) return;

    this.logger.warn(
      `[SWEEPER] Tìm thấy ${orphanedOrders.length} đơn hàng treo (PENDING > 15 phút)`,
    );

    for (const order of orphanedOrders) {
      try {
        // Kiểm tra xem có payment_transaction PAID không
        // (trường hợp khách đã trả tiền nhưng đơn kẹt)
        const paidTransaction = await this.prisma.paymentTransaction.findFirst({
          where: { orderId: order.id, status: 'PAID' },
        });

        if (paidTransaction) {
          // CỰC KỲ QUAN TRỌNG: khách đã trả tiền, KHÔNG được tự hủy đơn
          // Phải escalate cho admin xử lý thủ công
          this.logger.error(
            `[SWEEPER][CRITICAL] Order ${order.id} đã PAID nhưng vẫn PENDING allocation. ` +
              `CẦN ADMIN CAN THIỆP NGAY — không tự động hủy.`,
          );
          // TODO: gửi alert (email/Slack) cho admin
          await this.flagForManualReview(order.id, 'paid_but_stuck');
          continue;
        }

        // Chưa thanh toán → an toàn để hủy tự động
        // Hủy bằng atomic UPDATE kèm re-check paymentStatus='UNPAID' ngay trong
        // transaction (chống TOCTOU với VNPay IPN: nếu IPN xác nhận PAID giữa
        // lúc quét và hủy, updateMany trả count=0 → bỏ qua, không hủy oan).
        const cancelled = await this.prisma.$transaction(async (tx) => {
          const res = await tx.order.updateMany({
            where: {
              id: order.id,
              status: 'PENDING',
              allocationStatus: 'PENDING',
              paymentStatus: 'UNPAID',
            },
            data: {
              status: 'CANCELLED',
              allocationStatus: 'FAILED',
            },
          });
          if (res.count === 0) return false;

          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              status: 'CANCELLED',
              note: 'Tự động hủy bởi Sweeper Job — đơn treo quá 15 phút, chưa thanh toán',
              changedBy: 'SYSTEM_SWEEPER',
            },
          });
          return true;
        });

        if (!cancelled) {
          this.logger.warn(
            `[SWEEPER] Bỏ qua order ${order.id} — trạng thái vừa thay đổi (có thể đã PAID qua IPN ngay trước khi hủy)`,
          );
          continue;
        }

        // Phát đúng event 'order.cancelled' như luồng hủy thủ công → Warehouse
        // listener RELEASE phần tồn kho đã reserve (tái dùng logic compensation
        // có sẵn, không viết logic giải phóng riêng).
        this.eventEmitter.emit(
          'order.cancelled',
          new OrderCancelledEvent(
            order.id,
            order.items.map((i) => ({
              productVariantId: i.productVariantId,
              qty: i.qty,
            })),
          ),
        );

        this.logger.log(
          `[SWEEPER] Đã hủy order ${order.id} (treo, chưa thanh toán) — đã phát order.cancelled trả tồn kho`,
        );
      } catch (error: any) {
        this.logger.error(
          `[SWEEPER] Không thể xử lý order ${order.id}: ${error?.message || error}`,
        );
        // Không throw — tiếp tục xử lý các order khác
      }
    }
  }

  private async flagForManualReview(orderId: string, reason: string) {
    // Ghi vào bảng riêng hoặc gắn note để admin dashboard hiển thị
    await this.prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: 'PENDING', // giữ nguyên status, chỉ thêm note cảnh báo
        note: `[CẦN ADMIN XỬ LÝ] Lý do: ${reason}. Đơn đã thanh toán nhưng kẹt allocation.`,
        changedBy: 'SYSTEM_SWEEPER',
      },
    });
  }
}
