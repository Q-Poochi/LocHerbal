import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from '../services/inventory.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { InsufficientStockException } from '../exceptions/insufficient-stock.exception';

describe('InventoryService', () => {
  let service: InventoryService;

  // Mock transaction callback: gọi callback với chính mockPrisma làm tx
  const mockPrisma = {
    stockItem: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
    },
    $executeRaw: jest.fn(),
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    // Giả lập $transaction: gọi callback ngay với mockPrisma làm đối tượng tx
    mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ===== ALLOCATE =====

  describe('allocate', () => {
    it('should throw NotFoundException if stock item not found', async () => {
      mockPrisma.stockItem.findFirst.mockResolvedValue(null);

      await expect(
        service.allocate('variant-1', 5),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw InsufficientStockException if insufficient stock', async () => {
      mockPrisma.stockItem.findFirst.mockResolvedValue({ id: 'si-1', productVariantId: 'variant-1', qtyOnHand: 10, qtyReserved: 5 });
      mockPrisma.$executeRaw.mockResolvedValue(0); // affected = 0 → không đủ tồn kho

      await expect(
        service.allocate('variant-1', 100),
      ).rejects.toThrow(InsufficientStockException);
    });

    it('InsufficientStockException should expose variantId, requested, available', async () => {
      mockPrisma.stockItem.findFirst.mockResolvedValue({ id: 'si-1', productVariantId: 'variant-1', qtyOnHand: 10, qtyReserved: 5 });
      mockPrisma.$executeRaw.mockResolvedValue(0);

      try {
        await service.allocate('variant-1', 100);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(InsufficientStockException);
        const ex = e as InsufficientStockException;
        expect(ex.variantId).toBe('variant-1');
        expect(ex.requested).toBe(100);
        expect(ex.available).toBe(5); // qtyOnHand(10) - qtyReserved(5)
      }
    });

    it('should allocate successfully when stock is sufficient', async () => {
      mockPrisma.stockItem.findFirst.mockResolvedValue({ id: 'si-1', productVariantId: 'variant-1' });
      mockPrisma.$executeRaw.mockResolvedValue(1); // affected = 1 → thành công

      const result = await service.allocate('variant-1', 5, 'order-1');

      expect(result.success).toBe(true);
      expect(result.qtyAllocated).toBe(5);
    });

    it('should create StockMovement with type RESERVED after allocate', async () => {
      mockPrisma.stockItem.findFirst.mockResolvedValue({ id: 'si-1', productVariantId: 'variant-1' });
      mockPrisma.$executeRaw.mockResolvedValue(1);

      await service.allocate('variant-1', 3, 'order-99');

      expect(mockPrisma.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          stockItemId: 'si-1',
          type: 'RESERVED',
          qty: 3,
          referenceType: 'ORDER',
          referenceId: 'order-99',
        }),
      });
    });
  });

  // ===== RELEASE =====

  describe('release', () => {
    it('should throw NotFoundException if stock item not found', async () => {
      mockPrisma.stockItem.findFirst.mockResolvedValue(null);

      await expect(
        service.release('variant-1', 5),
      ).rejects.toThrow(NotFoundException);
    });

    it('should release successfully', async () => {
      mockPrisma.stockItem.findFirst.mockResolvedValue({ id: 'si-1', productVariantId: 'variant-1' });
      mockPrisma.$executeRaw.mockResolvedValue(1);

      const result = await service.release('variant-1', 5, 'order-1');

      expect(result.success).toBe(true);
      expect(result.qtyReleased).toBe(5);
      expect(mockPrisma.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'RELEASED',
          qty: 5,
        }),
      });
    });
  });

  // ===== DEDUCT =====

  describe('deduct', () => {
    it('should throw NotFoundException if stock item not found', async () => {
      mockPrisma.stockItem.findFirst.mockResolvedValue(null);

      await expect(
        service.deduct('variant-1', 5),
      ).rejects.toThrow(NotFoundException);
    });

    it('should deduct successfully when data is consistent', async () => {
      mockPrisma.stockItem.findFirst.mockResolvedValue({ id: 'si-1', productVariantId: 'variant-1' });
      mockPrisma.$executeRaw.mockResolvedValue(1);

      const result = await service.deduct('variant-1', 5, 'order-1');

      expect(result.success).toBe(true);
      expect(result.qtyDeducted).toBe(5);
      expect(mockPrisma.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'OUTBOUND',
          qty: 5,
        }),
      });
    });

    it('should throw InsufficientStockException if qty_on_hand < qty (data integrity check)', async () => {
      mockPrisma.stockItem.findFirst.mockResolvedValue({ id: 'si-1', productVariantId: 'variant-1' });
      mockPrisma.$executeRaw.mockResolvedValue(0); // affected = 0 → dữ liệu không nhất quán

      await expect(
        service.deduct('variant-1', 100),
      ).rejects.toThrow(InsufficientStockException);

      // Phải KHÔNG ghi StockMovement nếu deduct thất bại
      expect(mockPrisma.stockMovement.create).not.toHaveBeenCalled();
    });
  });

  // ===== INBOUND =====

  describe('inbound', () => {
    it('should create StockItem if not exists (upsert)', async () => {
      mockPrisma.stockItem.upsert = jest.fn().mockResolvedValue({ id: 'si-new' });
      mockPrisma.$executeRaw.mockResolvedValue(1);
      mockPrisma.stockMovement.create = jest.fn().mockResolvedValue({});

      await service.inbound('variant-1', 'wh-1', 10, 'po-1');

      expect(mockPrisma.stockItem.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { warehouseId_productVariantId: { warehouseId: 'wh-1', productVariantId: 'variant-1' } },
          create: expect.objectContaining({ warehouseId: 'wh-1', productVariantId: 'variant-1' }),
        }),
      );
    });

    it('should increase qty_on_hand by correct amount', async () => {
      mockPrisma.stockItem.upsert = jest.fn().mockResolvedValue({ id: 'si-1' });
      mockPrisma.$executeRaw.mockResolvedValue(1);
      mockPrisma.stockMovement.create = jest.fn().mockResolvedValue({});

      await service.inbound('variant-1', 'wh-1', 10, 'po-1');

      const callArgs = mockPrisma.$executeRaw.mock.calls[0][0];
      const sqlString = Array.isArray(callArgs) ? callArgs.join('') : callArgs;
      expect(sqlString).toContain('qty_on_hand = qty_on_hand +');
    });

    it('should create StockMovement with type INBOUND', async () => {
      mockPrisma.stockItem.upsert = jest.fn().mockResolvedValue({ id: 'si-1' });
      mockPrisma.$executeRaw.mockResolvedValue(1);
      mockPrisma.stockMovement.create = jest.fn().mockResolvedValue({});

      await service.inbound('variant-1', 'wh-1', 7, 'po-99');

      expect(mockPrisma.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          stockItemId: 'si-1',
          type: 'INBOUND',
          qty: 7,
          referenceType: 'PURCHASE_ORDER',
          referenceId: 'po-99',
        }),
      });
    });
  });
});
