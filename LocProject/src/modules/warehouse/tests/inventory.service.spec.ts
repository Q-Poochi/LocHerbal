import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from '../services/inventory.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('InventoryService', () => {
  let service: InventoryService;

  // Mock transaction callback: gọi callback với chính mockPrisma làm tx
  const mockPrisma = {
    stockItem: {
      findFirst: jest.fn(),
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

    it('should throw BadRequestException if insufficient stock', async () => {
      mockPrisma.stockItem.findFirst.mockResolvedValue({ id: 'si-1', productVariantId: 'variant-1' });
      mockPrisma.$executeRaw.mockResolvedValue(0); // affected = 0 → không đủ tồn kho

      await expect(
        service.allocate('variant-1', 100),
      ).rejects.toThrow('Không đủ tồn kho để giữ hàng');
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

    it('should throw BadRequestException if qty_on_hand < qty (data integrity check)', async () => {
      mockPrisma.stockItem.findFirst.mockResolvedValue({ id: 'si-1', productVariantId: 'variant-1' });
      mockPrisma.$executeRaw.mockResolvedValue(0); // affected = 0 → dữ liệu không nhất quán

      await expect(
        service.deduct('variant-1', 100),
      ).rejects.toThrow('Lỗi tồn kho: dữ liệu không nhất quán');

      // Phải KHÔNG ghi StockMovement nếu deduct thất bại
      expect(mockPrisma.stockMovement.create).not.toHaveBeenCalled();
    });
  });
});
