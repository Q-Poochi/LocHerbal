import { Test, TestingModule } from '@nestjs/testing';
import { AdminCustomerController } from '../controllers/admin-customer.controller';
import { AdminCustomerService } from '../services/admin-customer.service';

describe('AdminCustomerController', () => {
    let controller: AdminCustomerController;
    let adminCustomerService: AdminCustomerService;

    const mockService = {
        findAll: jest.fn(),
        findById: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AdminCustomerController],
            providers: [{ provide: AdminCustomerService, useValue: mockService }],
        }).compile();

        controller = module.get<AdminCustomerController>(AdminCustomerController);
        adminCustomerService = module.get<AdminCustomerService>(AdminCustomerService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should delegate to service with pagination', async () => {
            mockService.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });

            const result = await controller.findAll({ page: 2, limit: 10 } as any);

            expect(adminCustomerService.findAll).toHaveBeenCalledWith(2, 10);
            expect(result.total).toBe(0);
        });
    });

    describe('findById', () => {
        it('should delegate to service with id', async () => {
            const mockCustomer = { id: 'c-1' };
            mockService.findById.mockResolvedValue(mockCustomer);

            const result = await controller.findById('c-1');

            expect(adminCustomerService.findById).toHaveBeenCalledWith('c-1');
            expect(result).toEqual(mockCustomer);
        });
    });
});
