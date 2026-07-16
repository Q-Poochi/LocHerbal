import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class InvoiceService {
    constructor(private readonly prisma: PrismaService) { }

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
        const countToday = await this.prisma.invoice.count({
            where: {
                issuedAt: {
                    gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
                },
            },
        });
        const sequence = String(countToday + 1).padStart(4, '0');
        const invoiceNumber = `INV-${dateStr}-${sequence}`;

        const invoice = await this.prisma.invoice.create({
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

        return invoice;
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