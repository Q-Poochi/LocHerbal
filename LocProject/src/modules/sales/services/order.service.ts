import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderCreatedEvent } from '../events/order-created.event';
import { OrderCancelledEvent } from '../events/order-cancelled.event';
import { OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  /**
   * Tạo đơn hàng từ giỏ hàng (Checkout)
   */
  async checkout(cartId: string, customerId: string, addressId?: string, agentId?: string) {
    // 1. Lấy thông tin Cart và CartItems
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      throw new NotFoundException('Không tìm thấy giỏ hàng');
    }

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Giỏ hàng trống');
    }

    // 2. Truy vấn lại giá hiện tại từ ProductVariant để tránh price manipulation
    // Giá lấy từ ProductVariant tại thời điểm checkout, không tin giá từ CartItem để chống price manipulation.
    const variantIds = cart.items.map((item) => item.productVariantId);

    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: {
        id: true,
        price: true,
        sku: true,
        name: true,
        productId: true,
        product: { select: { name: true } },
      },
    });

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    const itemsWithCurrentPrice = cart.items.map((item) => {
      const variant = variantMap.get(item.productVariantId);
      if (!variant) {
        throw new NotFoundException(`Không tìm thấy biến thể sản phẩm với ID: ${item.productVariantId}`);
      }

      const unitPrice = variant.price;
      const subtotal = Number(unitPrice) * item.qty;

      return {
        productVariantId: variant.id,
        qty: item.qty,
        unitPrice,
        subtotal,
        productNameSnapshot: variant.product.name + (variant.name ? ` (${variant.name})` : ''),
        skuSnapshot: variant.sku,
      };
    });

    // 3. Tính toán tổng tiền
    const subtotal = itemsWithCurrentPrice.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = 0; // Tạm thời chưa áp coupon
    const shippingFee = 0; // Tạm thời miễn phí vận chuyển
    const totalAmount = subtotal - discountAmount + shippingFee;

    const orderCode = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 4. Lưu database trong transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Tạo Order
      const newOrder = await tx.order.create({
        data: {
          orderCode,
          customerId,
          addressId,
          agentId,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.UNPAID,
          subtotal,
          discountAmount,
          shippingFee,
          totalAmount,
        },
      });

      // Tạo OrderItems
      await tx.orderItem.createMany({
        data: itemsWithCurrentPrice.map((item) => ({
          orderId: newOrder.id,
          productVariantId: item.productVariantId,
          productNameSnapshot: item.productNameSnapshot,
          skuSnapshot: item.skuSnapshot,
          qty: item.qty,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        })),
      });

      // Tạo lịch sử trạng thái
      await tx.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          status: OrderStatus.PENDING,
          note: 'Khách hàng tạo đơn hàng',
          changedBy: customerId,
        },
      });

      // Xóa các sản phẩm trong giỏ
      await tx.cartItem.deleteMany({
        where: { cartId },
      });

      return newOrder;
    });

    // 5. Emit event báo cho Warehouse module xử lý allocate
    const eventItems = itemsWithCurrentPrice.map((item) => ({
      productVariantId: item.productVariantId,
      qty: item.qty,
    }));
    this.eventEmitter.emit('order.created', new OrderCreatedEvent(order.id, eventItems));

    return order;
  }

  /**
   * Hủy đơn hàng
   */
  async cancelOrder(orderId: string, changedBy: string, note?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    if (order.status === OrderStatus.CANCELLED) {
      return order; // Idempotent
    }

    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException('Không thể hủy đơn hàng ở trạng thái này');
    }

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.CANCELLED,
          note: note || 'Hủy đơn hàng',
          changedBy,
        },
      });

      return updated;
    });

    // Emit event báo cho Warehouse giải phóng tồn kho
    const eventItems = order.items.map((item) => ({
      productVariantId: item.productVariantId,
      qty: item.qty,
    }));
    this.eventEmitter.emit('order.cancelled', new OrderCancelledEvent(orderId, eventItems));

    return updatedOrder;
  }
}
