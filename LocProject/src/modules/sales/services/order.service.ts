import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderCreatedEvent } from '../events/order-created.event';
import { OrderCancelledEvent } from '../events/order-cancelled.event';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';

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

    // 2. Xác minh quyền sở hữu địa chỉ giao hàng (chống IDOR)
    if (addressId) {
      const address = await this.prisma.customerAddress.findUnique({ where: { id: addressId } });
      if (!address || address.customerId !== customerId) {
        throw new BadRequestException('Địa chỉ giao hàng không hợp lệ');
      }
    }

    // 3. Truy vấn lại giá hiện tại từ ProductVariant để tránh price manipulation
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

    // Kiểm tra quyền sở hữu: customer chỉ hủy được đơn của mình
    if (order.customerId !== changedBy) {
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

  /**
   * Danh sách đơn hàng cho admin (toàn bộ hệ thống, không giới hạn owner).
   * Hỗ trợ lọc theo status, tìm kiếm orderCode/tên KH, và khoảng ngày tạo.
   */
  async findAllForAdmin(
    page = 1,
    limit = 20,
    status?: OrderStatus,
    search?: string,
    from?: string,
    to?: string,
  ) {
    const where: Prisma.OrderWhereInput = {};
    if (status) where.status = status;

    // Tìm kiếm theo mã đơn hoặc tên/sđt/email khách hàng
    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { orderCode: { contains: term, mode: 'insensitive' } },
        { customer: { is: { OR: [{ fullName: { contains: term, mode: 'insensitive' } }, { phone: { contains: term } }, { email: { contains: term, mode: 'insensitive' } }] } } },
      ];
    }

    // Khoảng ngày tạo đơn
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        // Bao gồm trọn vẹn ngày kết thúc (hết 23:59:59.999)
        const endOfDay = new Date(to);
        endOfDay.setHours(23, 59, 59, 999);
        where.createdAt.lte = endOfDay;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          customer: { select: { id: true, fullName: true, phone: true, email: true } },
          items: { select: { id: true, productVariantId: true, productNameSnapshot: true, skuSnapshot: true, qty: true, unitPrice: true, subtotal: true } },
          paymentTxns: {
            select: { id: true, provider: true, transactionCode: true, amount: true, status: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Chi tiết đơn hàng cho admin (không kiểm tra quyền sở hữu).
   */
  async findByIdForAdmin(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, fullName: true, phone: true, email: true, createdAt: true } },
        items: true,
        address: true,
        shipment: true,
        paymentTxns: {
          select: { id: true, provider: true, transactionCode: true, amount: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    return order;
  }

  /**
   * Cập nhật trạng thái đơn hàng từ admin. Ghi OrderStatusHistory + emit
   * order.cancelled khi chuyển sang CANCELLED (để warehouse giải phóng tồn kho).
   */
  async updateStatus(id: string, status: OrderStatus, changedBy: string, note?: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    if (order.status === status) {
      return order; // Idempotent
    }

    this.assertAllowedTransition(order.status, status);

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status,
          note: note || `Admin cập nhật trạng thái từ ${order.status} sang ${status}`,
          changedBy,
        },
      });

      return updated;
    });

    if (status === OrderStatus.CANCELLED) {
      const eventItems = order.items.map((item) => ({
        productVariantId: item.productVariantId,
        qty: item.qty,
      }));
      this.eventEmitter.emit('order.cancelled', new OrderCancelledEvent(id, eventItems));
    }

    return updatedOrder;
  }

  /**
   * Kiểm tra chuyển trạng thái hợp lệ. Flow chuẩn:
   * PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED,
   * CANCELLED từ PENDING/CONFIRMED, REFUNDED từ DELIVERED.
   */
  private assertAllowedTransition(from: OrderStatus, to: OrderStatus): void {
    const allowed: Record<OrderStatus, OrderStatus[]> = {
      PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      CONFIRMED: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      PROCESSING: [OrderStatus.SHIPPED],
      SHIPPED: [OrderStatus.DELIVERED],
      DELIVERED: [OrderStatus.REFUNDED],
      CANCELLED: [],
      REFUNDED: [],
    };

    if (!allowed[from].includes(to)) {
      throw new BadRequestException(`Không thể chuyển đơn hàng từ ${from} sang ${to}`);
    }
  }
}
