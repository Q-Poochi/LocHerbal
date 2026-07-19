import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from '../services/order.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';

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
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
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
      };
      return cb(tx);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
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

      const order = await service.checkout('cart-1', 'customer-1', 'address-1', 'agent-1');

      // Verify tổng tiền tính theo giá thật (1500 * 2 = 3000)
      expect(order.subtotal).toBe(3000);
      expect(order.totalAmount).toBe(3000);
      expect(order.customerId).toBe('customer-1');

      // Verify event được emit
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'order.created',
        expect.objectContaining({
          orderId: 'order-1',
          items: [{ productVariantId: 'variant-1', qty: 2 }],
        }),
      );
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
});
