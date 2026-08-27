import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderCreatedEvent } from '../events/order-created.event';
import { EmailService } from '../../core/services/email.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';

/**
 * Gửi email xác nhận đã tiếp nhận đơn hàng NGAY sau khi checkout thành công
 * (cả COD lẫn VNPay — màn hình xác nhận storefront hứa "sẽ gửi email xác nhận",
 * nên listener này biến lời hứa đó thành thật).
 *
 * - Gửi MỘT LẦN tại order.created; hoàn tất thanh toán VNPay sau đó không gửi lại.
 * - Thất bại gửi email KHÔNG bao giờ làm hỏng checkout — chỉ log lỗi.
 */
@Injectable()
export class OrderConfirmationEmailListener {
  private readonly logger = new Logger(OrderConfirmationEmailListener.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('order.created')
  async handleOrderCreatedEvent(event: OrderCreatedEvent): Promise<void> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: event.orderId },
        select: {
          id: true,
          orderCode: true,
          totalAmount: true,
          customer: { select: { email: true, fullName: true } },
          items: {
            select: { productNameSnapshot: true, qty: true, subtotal: true },
            orderBy: { id: 'asc' },
          },
        },
      });

      if (!order) {
        this.logger.warn(`Không tìm thấy order ${event.orderId} để gửi email xác nhận`);
        return;
      }

      const to = order.customer?.email;
      if (!to) {
        this.logger.warn(`Order ${order.orderCode} không có email khách hàng — bỏ qua gửi email`);
        return;
      }

      await this.emailService.sendOrderConfirmationEmail(to, order.customer.fullName, {
        orderCode: order.orderCode,
        orderId: order.id,
        items: order.items.map((it) => ({
          name: it.productNameSnapshot,
          qty: it.qty,
          subtotal: Number(it.subtotal),
        })),
        totalAmount: Number(order.totalAmount),
      });

      this.logger.log(`Đã gửi email xác nhận đơn ${order.orderCode} tới ${to}`);
    } catch (error) {
      // Email thất bại không được phép làm ảnh hưởng luồng đặt hàng
      this.logger.error(
        `Gửi email xác nhận đơn ${event.orderId} thất bại: ${(error as Error).message}`,
      );
    }
  }
}
