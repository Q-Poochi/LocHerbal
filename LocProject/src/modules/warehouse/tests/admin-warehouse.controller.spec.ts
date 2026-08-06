import { Test, TestingModule } from '@nestjs/testing';
import { AdminWarehouseController } from '../controllers/admin-warehouse.controller';
import { InventoryService } from '../services/inventory.service';

describe('AdminWarehouseController', () => {
    let controller: AdminWarehouseController;
    let inventoryService: InventoryService;

    const mockInventoryService = {
        getStockOverview: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AdminWarehouseController],
            providers: [{ provide: InventoryService, useValue: mockInventoryService }],
        }).compile();

        controller = module.get<AdminWarehouseController>(AdminWarehouseController);
        inventoryService = module.get<InventoryService>(InventoryService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getStock', () => {
        it('should delegate to service with pagination', async () => {
            mockInventoryService.getStockOverview.mockResolvedValue({
                data: [], total: 0, page: 1, limit: 20, totalPages: 0, warehouses: [],
            });

            const result = await controller.getStock({ page: 1, limit: 20 } as any);

            expect(inventoryService.getStockOverview).toHaveBeenCalledWith(1, 20);
            expect(result.total).toBe(0);
        });
    });
});
