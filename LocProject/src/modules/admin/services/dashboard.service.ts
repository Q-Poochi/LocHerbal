import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalRevenue, todayRevenue, totalOrders, todayOrders, totalCustomers, totalProducts, lowStockItems, recentOrders] = await Promise.all([
      this.prisma.order.aggregate({ _sum: { subtotal: true }, where: { paymentStatus: 'PAID' } }),
      this.prisma.order.aggregate({ _sum: { subtotal: true }, where: { createdAt: { gte: today }, paymentStatus: 'PAID' } }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { createdAt: { gte: today } } }),
      this.prisma.customer.count(),
      this.prisma.product.count(),
      this.prisma.stockItem.count({ where: { qtyOnHand: { lte: 5 } } }),
      this.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { fullName: true } },
          items: { take: 3 },
        },
      }),
    ]);

    return {
      revenue: {
        total: totalRevenue._sum.subtotal || 0,
        today: todayRevenue._sum.subtotal || 0,
      },
      orders: {
        total: totalOrders,
        today: todayOrders,
      },
      totalCustomers,
      totalProducts,
      lowStockItems,
      recentOrders,
    };
  }

  async getRevenueByDay(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: since }, paymentStatus: 'PAID' },
      select: { subtotal: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const map = new Map<string, number>();
    for (const o of orders) {
      const date = o.createdAt.toISOString().slice(0, 10);
      map.set(date, (map.get(date) || 0) + Number(o.subtotal));
    }

    return Array.from(map, ([date, revenue]) => ({ date, revenue }));
  }

  async getTopProducts(limit = 10) {
    const items = await this.prisma.orderItem.groupBy({
      by: ['productVariantId'],
      _sum: { qty: true },
      orderBy: { _sum: { qty: 'desc' } },
      take: limit,
    });

    const variantIds = items.map(i => i.productVariantId);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: { select: { id: true, name: true, slug: true } } },
    });

    const variantMap = new Map(variants.map(v => [v.id, v]));
    return items.map(i => ({
      productVariantId: i.productVariantId,
      totalSold: i._sum.qty || 0,
      variant: variantMap.get(i.productVariantId) || null,
    }));
  }
}
