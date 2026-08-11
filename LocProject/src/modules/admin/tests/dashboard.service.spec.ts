import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from '../services/dashboard.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: PrismaService;

  const mockPrisma = {
    order: {
      aggregate: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    customer: { count: jest.fn() },
    product: { count: jest.fn() },
    stockItem: { count: jest.fn() },
    orderItem: { groupBy: jest.fn() },
    productVariant: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('getStats', () => {
    it('should return aggregated stats', async () => {
      mockPrisma.order.aggregate
        .mockResolvedValueOnce({ _sum: { totalAmount: 1000000 } }) // total revenue
        .mockResolvedValueOnce({ _sum: { totalAmount: 500000 } }); // today revenue
      mockPrisma.order.count
        .mockResolvedValueOnce(120) // total orders
        .mockResolvedValueOnce(5); // today orders
      mockPrisma.customer.count.mockResolvedValue(80);
      mockPrisma.product.count.mockResolvedValue(200);
      mockPrisma.stockItem.count.mockResolvedValue(3);
      mockPrisma.order.findMany.mockResolvedValue([]);

      const stats = await service.getStats();

      expect(stats.revenue.total).toBe(1000000);
      expect(stats.revenue.today).toBe(500000);
      expect(stats.orders.total).toBe(120);
      expect(stats.orders.today).toBe(5);
      expect(stats.totalCustomers).toBe(80);
      expect(stats.totalProducts).toBe(200);
      expect(stats.lowStockItems).toBe(3);
      expect(stats.recentOrders).toEqual([]);
    });

    it('should return 0 for revenue when no orders', async () => {
      mockPrisma.order.aggregate
        .mockResolvedValueOnce({ _sum: { totalAmount: null } })
        .mockResolvedValueOnce({ _sum: { totalAmount: null } });
      mockPrisma.order.count.mockResolvedValue(0);
      mockPrisma.customer.count.mockResolvedValue(0);
      mockPrisma.product.count.mockResolvedValue(0);
      mockPrisma.stockItem.count.mockResolvedValue(0);
      mockPrisma.order.findMany.mockResolvedValue([]);

      const stats = await service.getStats();

      expect(stats.revenue.total).toBe(0);
      expect(stats.revenue.today).toBe(0);
    });
  });

  describe('getRevenueByDay', () => {
    it('should bucket revenue by ISO date', async () => {
      mockPrisma.order.findMany.mockResolvedValue([
        { totalAmount: 100, createdAt: new Date('2026-08-10T10:00:00Z') },
        { totalAmount: 50, createdAt: new Date('2026-08-10T12:00:00Z') },
        { totalAmount: 300, createdAt: new Date('2026-08-09T08:00:00Z') },
      ]);

      const result = await service.getRevenueByDay(30);

      expect(result).toEqual([
        { date: '2026-08-10', revenue: 150 },
        { date: '2026-08-09', revenue: 300 },
      ]);
    });
  });

  describe('getTopProducts', () => {
    it('should join top product variants with product info', async () => {
      mockPrisma.orderItem.groupBy.mockResolvedValue([
        { productVariantId: 'v-1', _sum: { qty: 10 } },
        { productVariantId: 'v-2', _sum: { qty: 4 } },
      ]);
      mockPrisma.productVariant.findMany.mockResolvedValue([
        { id: 'v-1', product: { id: 'p-1', name: 'Tra Herbal', slug: 'tra-herbal' } },
        { id: 'v-2', product: { id: 'p-2', name: 'Mật ong', slug: 'mat-ong' } },
      ]);

      const result = await service.getTopProducts(10);

      expect(result).toHaveLength(2);
      expect(result[0].totalSold).toBe(10);
      expect(result[0].variant.product.name).toBe('Tra Herbal');
      expect(result[1].totalSold).toBe(4);
    });
  });
});
