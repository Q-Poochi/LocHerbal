import { Test, TestingModule } from '@nestjs/testing';
import { AdminOrderController } from '../controllers/admin-order.controller';
import { OrderService } from '../services/order.service';
import { OrderStatus } from '@prisma/client';

describe('AdminOrderController', () => {
    let controller: AdminOrderController;
    let orderService: OrderService;

    const mockOrderService = {
        findAllForAdmin: jest.fn(),
        findByIdForAdmin: jest.fn(),
        updateStatus: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AdminOrderController],
            providers: [{ provide: OrderService, useValue: mockOrderService }],
        }).compile();

        controller = module.get<AdminOrderController>(AdminOrderController);
        orderService = module.get<OrderService>(OrderService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should return paginated orders', async () => {
            mockOrderService.findAllForAdmin.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });

            const result = await controller.findAll({ page: 1, limit: 20 } as any);

            expect(orderService.findAllForAdmin).toHaveBeenCalledWith(1, 20, undefined, undefined, undefined, undefined);
            expect(result.total).toBe(0);
        });

        it('should pass status filter when provided', async () => {
            mockOrderService.findAllForAdmin.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });

            await controller.findAll({ page: 2, limit: 10, status: OrderStatus.SHIPPED } as any);

            expect(orderService.findAllForAdmin).toHaveBeenCalledWith(2, 10, OrderStatus.SHIPPED, undefined, undefined, undefined);
        });

        it('should pass search and date range filters', async () => {
            mockOrderService.findAllForAdmin.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });

            await controller.findAll({ page: 1, limit: 20, search: 'Khách Test', from: '2026-08-01', to: '2026-08-04' } as any);

            expect(orderService.findAllForAdmin).toHaveBeenCalledWith(1, 20, undefined, 'Khách Test', '2026-08-01', '2026-08-04');
        });
    });

    describe('findById', () => {
        it('should return order detail', async () => {
            const mockOrder = { id: 'order-1' };
            mockOrderService.findByIdForAdmin.mockResolvedValue(mockOrder);

            const result = await controller.findById('order-1');

            expect(orderService.findByIdForAdmin).toHaveBeenCalledWith('order-1');
            expect(result).toEqual(mockOrder);
        });
    });

    describe('updateStatus', () => {
        it('should update status with changedBy from req.user', async () => {
            mockOrderService.updateStatus.mockResolvedValue({ id: 'order-1', status: OrderStatus.CONFIRMED });

            const result = await controller.updateStatus(
                'order-1',
                { status: OrderStatus.CONFIRMED, note: 'Duyệt' },
                { user: { userId: 'admin-1' } } as any,
            );

            expect(orderService.updateStatus).toHaveBeenCalledWith('order-1', OrderStatus.CONFIRMED, 'admin-1', 'Duyệt');
            expect(result.status).toBe(OrderStatus.CONFIRMED);
        });

        it('should fallback changedBy to admin when user missing', async () => {
            mockOrderService.updateStatus.mockResolvedValue({ id: 'order-1' });

            await controller.updateStatus('order-1', { status: OrderStatus.SHIPPED }, {} as any);

            expect(orderService.updateStatus).toHaveBeenCalledWith('order-1', OrderStatus.SHIPPED, 'admin', undefined);
        });
    });
});
