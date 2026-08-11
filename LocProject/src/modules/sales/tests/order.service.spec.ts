import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from '../services/order.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { CouponService } from '../../marketing/services/coupon.service';

describe('OrderService', () => {
  let service: OrderService;
  let eventEmitter: EventEmitter2;

  const mockPrisma = {
    cart: {
      findUnique: jest.fn(),
    },
    productVariant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    customerAddress: {
      findUnique: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
    emitAsync: jest.fn().mockResolvedValue([{ success: true }]),
  };

  const mockCouponService = {
    validateCode: jest.fn(),
    calculateDiscount: jest.fn(),
  };

  beforeEach(async () => {
    // Giả lập transaction
    mockPrisma.$transaction.mockImplementation(async (cb: any) => {
      // Mock một đối tượng transaction đơn giản có các phương thức create, createMany, deleteMany...
      const tx = {
        order: {
          create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'order-1', ...args.data })),
          update: jest.fn().mockImplementation((args) => Promise.resolve({ id: args.where.id, ...args.data })),
        },
        orderItem: {
          createMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        orderStatusHistory: {
          create: jest.fn().mockResolvedValue({ id: 'osh-1' }),
        },
        cartItem: {
          deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        couponUsage: {
          create: jest.fn().mockResolvedValue({ id: 'cu-1' }),
        },
        coupon: {
          update: jest.fn().mockResolvedValue({ id: 'coupon-1' }),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };
      return cb(tx);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: CouponService, useValue: mockCouponService },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkout', () => {
    it('should throw NotFoundException if cart not found', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(null);

      await expect(
        service.checkout('cart-1', 'customer-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if cart has no items', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue({ id: 'cart-1', items: [] });

      await expect(
        service.checkout('cart-1', 'customer-1'),
      ).rejects.toThrow(BadRequestException);
    });
    it('should throw BadRequestException if addressId does not belong to customer', async () => {
      const mockCart = {
        id: 'cart-1',
        items: [{ productVariantId: 'variant-1', qty: 2, priceSnapshot: 1000 }],
      };
      mockPrisma.cart.findUnique.mockResolvedValue(mockCart);
      mockPrisma.productVariant.findMany.mockResolvedValue([
        { id: 'variant-1', sku: 'SKU-001', name: 'Size L', price: 1500, productId: 'product-1', product: { name: 'Tra Herbal' } },
      ]);

      // Address tồn tại nhưng thuộc về customer KHÁC
      mockPrisma.customerAddress.findUnique.mockResolvedValue({
        id: 'address-999',
        customerId: 'someone-else',
      });

      await expect(
        service.checkout('cart-1', 'customer-1', 'address-999', 'agent-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if addressId does not exist', async () => {
      const mockCart = {
        id: 'cart-1',
        items: [{ productVariantId: 'variant-1', qty: 2, priceSnapshot: 1000 }],
      };
      mockPrisma.cart.findUnique.mockResolvedValue(mockCart);
      mockPrisma.productVariant.findMany.mockResolvedValue([
        { id: 'variant-1', sku: 'SKU-001', name: 'Size L', price: 1500, productId: 'product-1', product: { name: 'Tra Herbal' } },
      ]);
      mockPrisma.customerAddress.findUnique.mockResolvedValue(null);

      await expect(
        service.checkout('cart-1', 'customer-1', 'address-999', 'agent-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should checkout successfully, re-query prices and emit order.created', async () => {
      // Giả lập cart có item
      const mockCart = {
        id: 'cart-1',
        items: [
          {
            productVariantId: 'variant-1',
            qty: 2,
            priceSnapshot: 1000, // Giá trong cart (giả lập thao tác hack)
          },
        ],
      };
      mockPrisma.cart.findUnique.mockResolvedValue(mockCart);

      // Giả lập variant trong DB có giá THẬT sự là 1500 (chênh lệch với priceSnapshot)
      mockPrisma.productVariant.findMany.mockResolvedValue([
        {
          id: 'variant-1',
          sku: 'SKU-001',
          name: 'Size L',
          price: 1500,
          productId: 'product-1',
          product: {
            name: 'Tra Herbal',
          },
        },
      ]);

      mockPrisma.customerAddress.findUnique.mockResolvedValue({
        id: 'address-1',
        customerId: 'customer-1',
      });

      const order = await service.checkout('cart-1', 'customer-1', 'address-1', 'agent-1');

      // Verify tổng tiền tính theo giá thật (1500 * 2 = 3000)
      expect(order.subtotal).toBe(3000);
      expect(order.totalAmount).toBe(3000);
      expect(order.customerId).toBe('customer-1');

      // Verify event được emit
      expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
        'order.created',
        expect.objectContaining({
          orderId: 'order-1',
          items: [{ productVariantId: 'variant-1', qty: 2 }],
        }),
      );
    });

    it('should throw BadRequestException when inventory allocation fails', async () => {
      const mockCart = {
        id: 'cart-1',
        items: [{ productVariantId: 'variant-1', qty: 10, priceSnapshot: 1000 }],
      };
      mockPrisma.cart.findUnique.mockResolvedValue(mockCart);
      mockPrisma.productVariant.findMany.mockResolvedValue([
        {
          id: 'variant-1',
          sku: 'SKU-001',
          name: 'Size L',
          price: 1500,
          productId: 'product-1',
          product: { name: 'Tra Herbal' },
        },
      ]);
      mockPrisma.customerAddress.findUnique.mockResolvedValue({
        id: 'address-1',
        customerId: 'customer-1',
      });
      mockEventEmitter.emitAsync.mockResolvedValue([
        { success: false, reason: 'Không đủ tồn kho khả dụng' },
      ]);

      await expect(
        service.checkout('cart-1', 'customer-1', 'address-1', 'agent-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should not create order when allocation result is empty (no listener)', async () => {
      // emitAsync không có listener nào đăng ký -> trả [] — đơn không nên bị chặn oan
      const mockCart = {
        id: 'cart-1',
        items: [{ productVariantId: 'variant-1', qty: 1, priceSnapshot: 1000 }],
      };
      mockPrisma.cart.findUnique.mockResolvedValue(mockCart);
      mockPrisma.productVariant.findMany.mockResolvedValue([
        {
          id: 'variant-1',
          sku: 'SKU-001',
          name: 'Size L',
          price: 1500,
          productId: 'product-1',
          product: { name: 'Tra Herbal' },
        },
      ]);
      mockPrisma.customerAddress.findUnique.mockResolvedValue({
        id: 'address-1',
        customerId: 'customer-1',
      });
      mockEventEmitter.emitAsync.mockResolvedValue([]);

      const order = await service.checkout('cart-1', 'customer-1', 'address-1', 'agent-1');
      expect(order.id).toBe('order-1');
      expect(order.totalAmount).toBe(1500);
    });

    it('should apply coupon discount and record usage when couponCode provided', async () => {
      const mockCart = {
        id: 'cart-1',
        items: [{ productVariantId: 'variant-1', qty: 2, priceSnapshot: 1000 }],
      };
      mockPrisma.cart.findUnique.mockResolvedValue(mockCart);
      mockPrisma.productVariant.findMany.mockResolvedValue([
        {
          id: 'variant-1',
          sku: 'SKU-001',
          name: 'Size L',
          price: 1500,
          productId: 'product-1',
          product: { name: 'Tra Herbal' },
        },
      ]);
      mockPrisma.customerAddress.findUnique.mockResolvedValue({
        id: 'address-1',
        customerId: 'customer-1',
      });
      mockCouponService.validateCode.mockResolvedValue({
        id: 'coupon-1',
        usageLimit: 5,
      });
      mockCouponService.calculateDiscount.mockResolvedValue({
        discountAmount: 500,
      });

      const order = await service.checkout(
        'cart-1',
        'customer-1',
        'address-1',
        undefined,
        'SALE10',
      );

      expect(order.subtotal).toBe(3000);
      expect(order.discountAmount).toBe(500);
      expect(order.totalAmount).toBe(2500);
      expect(mockCouponService.validateCode).toHaveBeenCalledWith('SALE10', 3000);
    });

    it('should not call coupon service when no couponCode', async () => {
      const mockCart = {
        id: 'cart-1',
        items: [{ productVariantId: 'variant-1', qty: 2, priceSnapshot: 1000 }],
      };
      mockPrisma.cart.findUnique.mockResolvedValue(mockCart);
      mockPrisma.productVariant.findMany.mockResolvedValue([
        {
          id: 'variant-1',
          sku: 'SKU-001',
          name: 'Size L',
          price: 1500,
          productId: 'product-1',
          product: { name: 'Tra Herbal' },
        },
      ]);
      mockPrisma.customerAddress.findUnique.mockResolvedValue({
        id: 'address-1',
        customerId: 'customer-1',
      });

      const order = await service.checkout('cart-1', 'customer-1', 'address-1');
      expect(order.discountAmount).toBe(0);
      expect(mockCouponService.validateCode).not.toHaveBeenCalled();
    });
  });

  describe('cancelOrder', () => {
    it('should throw NotFoundException if order not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.cancelOrder('order-1', 'customer-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should cancel successfully and emit order.cancelled', async () => {
      const mockOrder = {
        id: 'order-1',
        customerId: 'customer-1',
        status: OrderStatus.PENDING,
        items: [
          { productVariantId: 'variant-1', qty: 2 },
        ],
      };
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.cancelOrder('order-1', 'customer-1', 'Hủy bởi khách hàng');

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'order.cancelled',
        expect.objectContaining({
          orderId: 'order-1',
          items: [{ productVariantId: 'variant-1', qty: 2 }],
        }),
      );
    });

    it('should not emit order.cancelled if order is already CANCELLED (idempotent)', async () => {
      const mockOrder = {
        id: 'order-1',
        customerId: 'customer-1',
        status: OrderStatus.CANCELLED,
        items: [
          { productVariantId: 'variant-1', qty: 2 },
        ],
      };
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.cancelOrder('order-1', 'customer-1', 'Hủy lại');

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('findAllForAdmin', () => {
    it('should return paginated orders with total', async () => {
      const mockOrders = [
        { id: 'order-1', orderCode: 'ORD-1', customer: { fullName: 'Nguyen A' } },
        { id: 'order-2', orderCode: 'ORD-2', customer: { fullName: 'Tran B' } },
      ];
      mockPrisma.order.findMany.mockResolvedValue(mockOrders);
      mockPrisma.order.count.mockResolvedValue(2);

      const result = await service.findAllForAdmin(1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.totalPages).toBe(1);
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
    });

    it('should filter by status when provided', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      await service.findAllForAdmin(1, 20, OrderStatus.SHIPPED);

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: OrderStatus.SHIPPED } }),
      );
      expect(mockPrisma.order.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: OrderStatus.SHIPPED } }),
      );
    });

    it('should search by orderCode when search provided', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      await service.findAllForAdmin(1, 20, undefined, 'ORD-123');

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ orderCode: { contains: 'ORD-123', mode: 'insensitive' } }),
            ]),
          }),
        }),
      );
    });

    it('should filter by date range when from/to provided', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      await service.findAllForAdmin(1, 20, undefined, undefined, '2026-08-01', '2026-08-04');

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: new Date('2026-08-01'), lte: new Date('2026-08-04T23:59:59.999') },
          }),
        }),
      );
    });
  });

  describe('findByIdForAdmin', () => {
    it('should return order detail when found', async () => {
      const mockOrder = { id: 'order-1', orderCode: 'ORD-1', statusHistory: [] };
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.findByIdForAdmin('order-1');

      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.findByIdForAdmin('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    beforeEach(() => {
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          order: {
            update: jest.fn().mockImplementation((args) => Promise.resolve({ id: args.where.id, ...args.data })),
          },
          orderStatusHistory: {
            create: jest.fn().mockResolvedValue({ id: 'osh-1' }),
          },
        };
        return cb(tx);
      });
    });

    it('should throw NotFoundException if order not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('order-1', OrderStatus.CONFIRMED, 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should be idempotent when status is unchanged', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.PENDING,
        items: [],
      });

      const result = await service.updateStatus('order-1', OrderStatus.PENDING, 'admin-1');

      expect(result.status).toBe(OrderStatus.PENDING);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException on invalid transition', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.PENDING,
        items: [],
      });

      await expect(
        service.updateStatus('order-1', OrderStatus.SHIPPED, 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update status and record history on valid transition', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.PENDING,
        items: [],
      });

      const result = await service.updateStatus('order-1', OrderStatus.CONFIRMED, 'admin-1', 'Duyệt đơn');

      expect(result.status).toBe(OrderStatus.CONFIRMED);
      expect(eventEmitter.emit).toHaveBeenCalledWith('order.confirmed', { orderId: 'order-1' });
    });

    it('should emit order.cancelled when transitioning to CANCELLED', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.PENDING,
        items: [{ productVariantId: 'variant-1', qty: 2 }],
      });

      await service.updateStatus('order-1', OrderStatus.CANCELLED, 'admin-1', 'Hủy bởi admin');

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'order.cancelled',
        expect.objectContaining({
          orderId: 'order-1',
          items: [{ productVariantId: 'variant-1', qty: 2 }],
        }),
      );
    });

    it('should follow full happy path PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED', async () => {
      const chain = [
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PROCESSING,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
      ];
      mockPrisma.order.findUnique.mockResolvedValue({ id: 'order-1', status: OrderStatus.PENDING, items: [] });

      for (let i = 0; i < chain.length; i++) {
        mockPrisma.order.findUnique.mockResolvedValue({ id: 'order-1', status: chain[i], items: [] });
        const next = chain[i + 1];
        if (!next) break;
        const result = await service.updateStatus('order-1', next, 'admin-1');
        expect(result.status).toBe(next);
      }
    });
  });
});
