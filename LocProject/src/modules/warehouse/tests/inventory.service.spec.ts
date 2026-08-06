import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from '../services/inventory.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';

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
