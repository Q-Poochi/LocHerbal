import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminCustomerService } from '../services/admin-customer.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';

describe('AdminCustomerService', () => {
    let service: AdminCustomerService;
    let prisma: PrismaService;

    const mockPrisma = {
        customer: {
            findMany: jest.fn(),
            count: jest.fn(),
            findUnique: jest.fn(),
        },
        order: {
            groupBy: jest.fn(),
            findMany: jest.fn(),
            aggregate: jest.fn(),
        },
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminCustomerService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<AdminCustomerService>(AdminCustomerService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    describe('findAll', () => {
        it('should return customers with order count and total spent', async () => {
            mockPrisma.customer.findMany.mockResolvedValue([
                { id: 'c-1', fullName: 'Nguyen A', phone: '0901', email: 'a@x.com', createdAt: new Date(), _count: { orders: 3 } },
                { id: 'c-2', fullName: 'Tran B', phone: '0902', email: 'b@x.com', createdAt: new Date(), _count: { orders: 1 } },
            ]);
            mockPrisma.customer.count.mockResolvedValue(2);
            mockPrisma.order.groupBy.mockResolvedValue([
                { customerId: 'c-1', _sum: { totalAmount: 500000 } },
            ]);

            const result = await service.findAll(1, 20);

            expect(result.total).toBe(2);
            expect(result.totalPages).toBe(1);
            expect(result.data[0].totalSpent).toBe(500000);
            expect(result.data[0].totalOrders).toBe(3);
            expect(result.data[1].totalSpent).toBe(0);
        });

        it('should respect pagination skip/take', async () => {
            mockPrisma.customer.findMany.mockResolvedValue([]);
            mockPrisma.customer.count.mockResolvedValue(0);
            mockPrisma.order.groupBy.mockResolvedValue([]);

            await service.findAll(3, 10);

            expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ skip: 20, take: 10 }),
            );
        });
    });

    describe('findById', () => {
        it('should throw NotFoundException when customer missing', async () => {
            mockPrisma.customer.findUnique.mockResolvedValue(null);

            await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
        });

        it('should return customer with recent orders and total spent', async () => {
            mockPrisma.customer.findUnique.mockResolvedValue({
                id: 'c-1', fullName: 'Nguyen A', phone: '0901', email: 'a@x.com', createdAt: new Date(),
                _count: { orders: 2, addresses: 1 },
            });
            mockPrisma.order.findMany.mockResolvedValue([{ id: 'o-1', orderCode: 'ORD-1' }]);
            mockPrisma.order.aggregate.mockResolvedValue({ _sum: { totalAmount: 250000 } });

            const result = await service.findById('c-1');

            expect(result.totalSpent).toBe(250000);
            expect(result.recentOrders).toEqual([{ id: 'o-1', orderCode: 'ORD-1' }]);
            expect(result._count.orders).toBe(2);
        });
    });
});
