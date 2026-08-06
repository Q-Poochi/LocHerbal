import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class AdminCustomerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Danh sách khách hàng kèm số đơn + tổng chi tiêu (đã trừ đơn hủy).
   */
  async findAll(page = 1, limit = 20) {
    const [data, total, spentAgg] = await Promise.all([
      this.prisma.customer.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      this.prisma.customer.count(),
      this.prisma.order.groupBy({
        by: ['customerId'],
        where: { status: { not: 'CANCELLED' } },
        _sum: { totalAmount: true },
      }),
    ]);

    const spentMap = new Map(spentAgg.map((s) => [s.customerId, Number(s._sum.totalAmount || 0)]));

    const customers = data.map((c) => ({
      ...c,
      totalSpent: spentMap.get(c.id) || 0,
      totalOrders: c._count.orders,
    }));

    return { data: customers, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Chi tiết khách hàng + lịch sử đơn gần nhất.
   */
  async findById(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        createdAt: true,
        _count: { select: { orders: true, addresses: true } },
      },
    });

    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    const [orders, totalSpentAgg] = await Promise.all([
      this.prisma.order.findMany({
        where: { customerId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          orderCode: true,
          status: true,
          paymentStatus: true,
          totalAmount: true,
          createdAt: true,
          items: { select: { id: true, productNameSnapshot: true, qty: true, subtotal: true } },
        },
      }),
      this.prisma.order.aggregate({
        where: { customerId: id, status: { not: 'CANCELLED' } },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      ...customer,
      totalSpent: Number(totalSpentAgg._sum.totalAmount || 0),
      recentOrders: orders,
    };
  }
}
