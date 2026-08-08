import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from '../services/inventory.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { InsufficientStockException } from '../exceptions/insufficient-stock.exception';
import { NotFoundException } from '@nestjs/common';

describe('InventoryService.getStockOverview', () => {
    let service: InventoryService;
    let prisma: PrismaService;

    const mockPrisma = {
        stockItem: {
            findMany: jest.fn(),
            count: jest.fn(),
            groupBy: jest.fn(),
            findFirst: jest.fn(),
            upsert: jest.fn(),
        },
        warehouse: {
            findMany: jest.fn(),
        },
        $transaction: jest.fn(),
        $executeRaw: jest.fn(),
        stockMovement: {
            create: jest.fn(),
        },
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InventoryService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<InventoryService>(InventoryService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should return stock items with warehouse summary and low stock flag', async () => {
        mockPrisma.stockItem.findMany.mockResolvedValue([
            {
                id: 's-1',
                warehouseId: 'w-1',
                qtyOnHand: 10,
                qtyReserved: 2,
                reorderThreshold: 5,
                warehouse: { id: 'w-1', name: 'Kho A' },
                variant: { id: 'v-1', sku: 'SKU-1', product: { id: 'p-1', name: 'Tra' } },
            },
            {
                id: 's-2',
                warehouseId: 'w-1',
                qtyOnHand: 15,
                qtyReserved: 0,
                reorderThreshold: 20,
                warehouse: { id: 'w-1', name: 'Kho A' },
                variant: { id: 'v-2', sku: 'SKU-2', product: { id: 'p-2', name: 'Mat ong' } },
            },
        ]);
        mockPrisma.stockItem.count.mockResolvedValue(2);
        mockPrisma.stockItem.groupBy.mockResolvedValue([
            { warehouseId: 'w-1', _sum: { qtyOnHand: 25, qtyReserved: 2 } },
        ]);
        mockPrisma.warehouse.findMany.mockResolvedValue([{ id: 'w-1', name: 'Kho A' }]);

        const result = await service.getStockOverview(1, 20);

        expect(result.total).toBe(2);
        expect(result.data).toHaveLength(2);
        expect(result.data[0].available).toBe(8);
        expect(result.data[0].isLowStock).toBe(false);
        expect(result.data[1].isLowStock).toBe(true);
        expect(result.warehouses).toEqual([
            {
                warehouseId: 'w-1',
                warehouseName: 'Kho A',
                qtyOnHand: 25,
                qtyReserved: 2,
                available: 23,
            },
        ]);
    });

    it('should respect pagination', async () => {
        mockPrisma.stockItem.findMany.mockResolvedValue([]);
        mockPrisma.stockItem.count.mockResolvedValue(0);
        mockPrisma.stockItem.groupBy.mockResolvedValue([]);
        mockPrisma.warehouse.findMany.mockResolvedValue([]);

        await service.getStockOverview(3, 10);

        expect(mockPrisma.stockItem.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ skip: 20, take: 10 }),
        );
    });
});

describe('InventoryService.allocate (race condition)', () => {
    let service: InventoryService;
    let prisma: PrismaService;

    // tx mock: mô phỏng $executeRaw trả affected theo qty_reserved hiện tại,
    // giống hành vi SQL thật: UPDATE ... WHERE (qty_on_hand - qty_reserved) >= qty
    function buildTx(stockItem: any) {
        return {
            stockItem: {
                findFirst: jest.fn().mockResolvedValue(stockItem),
            },
            $executeRaw: jest.fn(async () => {
                const available = stockItem.qtyOnHand - stockItem.qtyReserved;
                if (available >= stockItem._pendingQty) {
                    stockItem.qtyReserved += stockItem._pendingQty;
                    return 1;
                }
                return 0;
            }),
            stockMovement: {
                create: jest.fn().mockResolvedValue({ id: 'm-1' }),
            },
        };
    }

    const mockPrisma = {
        $transaction: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InventoryService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();
        service = module.get<InventoryService>(InventoryService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should allocate when stock available', async () => {
        const stock = { id: 's-1', qtyOnHand: 10, qtyReserved: 2, _pendingQty: 3 };
        const tx = buildTx(stock);
        mockPrisma.$transaction.mockImplementation((cb) => cb(tx));

        const res = await service.allocate('v-1', 3, 'order-1');
        expect(res.success).toBe(true);
        expect(res.qtyAllocated).toBe(3);
        expect(tx.stockMovement.create).toHaveBeenCalled();
    });

    it('should throw InsufficientStockException when not enough available (race lost)', async () => {
        // qty_on_hand - qty_reserved = 10 - 8 = 2, đòi 5 → affected = 0 → race lost
        const stock = { id: 's-1', qtyOnHand: 10, qtyReserved: 8, _pendingQty: 5 };
        const tx = buildTx(stock);
        mockPrisma.$transaction.mockImplementation((cb) => cb(tx));

        await expect(service.allocate('v-1', 5, 'order-1')).rejects.toThrow(
            InsufficientStockException,
        );
    });

    it('should throw NotFoundException when no stock item', async () => {
        const tx = {
            stockItem: { findFirst: jest.fn().mockResolvedValue(null) },
        };
        mockPrisma.$transaction.mockImplementation((cb) => cb(tx));
        await expect(service.allocate('v-1', 1)).rejects.toThrow(NotFoundException);
    });
});

describe('InventoryService.deduct (payment confirmed)', () => {
    let service: InventoryService;
    let prisma: PrismaService;

    function buildTx(stockItem: any) {
        return {
            stockItem: {
                findFirst: jest.fn().mockResolvedValue(stockItem),
            },
            $executeRaw: jest.fn(async () => {
                if (stockItem.qtyOnHand >= stockItem._q && stockItem.qtyReserved >= stockItem._q) {
                    stockItem.qtyOnHand -= stockItem._q;
                    stockItem.qtyReserved -= stockItem._q;
                    return 1;
                }
                return 0;
            }),
            stockMovement: {
                create: jest.fn().mockResolvedValue({ id: 'm-1' }),
            },
        };
    }

    const mockPrisma = { $transaction: jest.fn() };

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InventoryService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();
        service = module.get<InventoryService>(InventoryService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should deduct when both qtyOnHand and qtyReserved are enough', async () => {
        const stock = { id: 's-1', qtyOnHand: 10, qtyReserved: 5, _q: 5 };
        const tx = buildTx(stock);
        mockPrisma.$transaction.mockImplementation((cb) => cb(tx));

        const res = await service.deduct('v-1', 5, 'order-1');
        expect(res.success).toBe(true);
        expect(res.qtyDeducted).toBe(5);
        expect(tx.stockMovement.create).toHaveBeenCalledWith(
            expect.objectContaining({ data: expect.objectContaining({ type: 'OUTBOUND' }) }),
        );
    });

    it('should throw when qtyReserved insufficient (data integrity violation)', async () => {
        const stock = { id: 's-1', qtyOnHand: 10, qtyReserved: 2, _q: 5 };
        const tx = buildTx(stock);
        mockPrisma.$transaction.mockImplementation((cb) => cb(tx));

        await expect(service.deduct('v-1', 5, 'order-1')).rejects.toThrow(
            InsufficientStockException,
        );
    });
});

describe('InventoryService.release (order cancelled)', () => {
    let service: InventoryService;

    const mockPrisma = { $transaction: jest.fn() };

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InventoryService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();
        service = module.get<InventoryService>(InventoryService);
    });

    it('should release reserved stock with GREATEST(0, ...) safety', async () => {
        const tx = {
            stockItem: { findFirst: jest.fn().mockResolvedValue({ id: 's-1' }) },
            $executeRaw: jest.fn().mockResolvedValue(1),
            stockMovement: { create: jest.fn().mockResolvedValue({ id: 'm-1' }) },
        };
        mockPrisma.$transaction.mockImplementation((cb) => cb(tx));

        const res = await service.release('v-1', 2, 'order-1');
        expect(res.success).toBe(true);
        expect(res.qtyReleased).toBe(2);
        expect(tx.stockMovement.create).toHaveBeenCalledWith(
            expect.objectContaining({ data: expect.objectContaining({ type: 'RELEASED' }) }),
        );
    });
});
