import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class InvoiceService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Tạo hóa đơn từ đơn hàng khi thanh toán được xác nhận.
     * Race condition: nhiều đơn PAID cùng lúc → cùng đếm `invoice.count` +1 →
     * trùng invoice_number (P2002). Fix: retry có giới hạn — khi bắt được P2002
     * do invoice_number, đếm lại (count đã bao gồm invoice vừa commit) rồi tạo lại.
     */
    async createFromOrder(orderId: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });
        if (!order) {
            throw new NotFoundException('Đơn hàng không tồn tại');
        }

        const existingInvoice = await this.prisma.invoice.findUnique({
            where: { orderId },
        });
        if (existingInvoice) {
            throw new BadRequestException('Invoice đã tồn tại cho đơn hàng này');
        }

        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const MAX_RETRIES = 5;
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            const countToday = await this.prisma.invoice.count({
                where: {
                    issuedAt: { gte: startOfDay },
                },
            });
            const sequence = String(countToday + 1).padStart(4, '0');
            const invoiceNumber = `INV-${dateStr}-${sequence}`;

            try {
                return await this.prisma.invoice.create({
                    data: {
                        orderId,
                        invoiceNumber,
                        totalAmount: order.totalAmount,
                        taxAmount: 0,
                    },
                    include: {
                        order: true,
                    },
                });
            } catch (error: any) {
                const isNumberCollision =
                    error?.code === 'P2002' &&
                    Array.isArray(error?.meta?.target) &&
                    error.meta.target.includes('invoice_number');
                if (isNumberCollision && attempt < MAX_RETRIES) {
                    // invoice_number trùng do race → đếm lại và thử lại
                    continue;
                }
                throw error;
            }
        }

        // Không thể tới đây nhưng cần để TypeScript thỏa mãn return path
        throw new BadRequestException('Không thể sinh số hóa đơn, thử lại sau');
    }

    async findByOrderId(orderId: string) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { orderId },
            include: {
                order: true,
            },
        });
        if (!invoice) {
            throw new NotFoundException('Invoice không tồn tại');
        }
        return invoice;
    }

    /**
     * Doanh thu theo khoảng thời gian — thống nhất nguồn với Dashboard:
     * tổng totalAmount của các order có paymentStatus = PAID (đã bao gồm
     * discount/shippingFee). Không dựa trên invoice để tránh 2 nguồn lệch nhau.
     */
    async getRevenue(from?: Date, to?: Date) {
        const startDate = from ?? new Date(new Date().getFullYear(), 0, 1);
        const endDate = to ?? new Date();

        const orders = await this.prisma.order.findMany({
            where: {
                paymentStatus: 'PAID',
                createdAt: { gte: startDate, lte: endDate },
            },
            select: { totalAmount: true },
        });

        const revenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

        return {
            from: startDate.toISOString(),
            to: endDate.toISOString(),
            revenue,
            orderCount: orders.length,
        };
    }

    async findAll(page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;
        const [invoices, total] = await Promise.all([
            this.prisma.invoice.findMany({
                skip,
                take: limit,
                orderBy: { issuedAt: 'desc' },
                include: {
                    order: true,
                },
            }),
            this.prisma.invoice.count(),
        ]);
        return {
            data: invoices,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}