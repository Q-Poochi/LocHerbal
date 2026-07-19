import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Req,
    UseGuards,
    NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { OrderService } from '../services/order.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CancelOrderDto } from '../dto/order.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
    constructor(
        private readonly orderService: OrderService,
        private readonly prisma: PrismaService,
    ) { }

    /**
     * Resolve Customer.id từ JWT (payload.sub = User.id).
     */
    private async getCustomerId(req: Request): Promise<string | undefined> {
        const userId = (req as any).user?.userId;
        if (!userId) return undefined;
        const customer = await this.prisma.customer.findUnique({
            where: { userId },
            select: { id: true },
        });
        return customer?.id;
    }

    /**
     * Danh sách đơn hàng của customer hiện tại.
     */
    @Get()
    async listOrders(@Req() req: Request) {
        const customerId = await this.getCustomerId(req);
        if (!customerId) {
            throw new NotFoundException('Không tìm thấy thông tin khách hàng');
        }
        return this.prisma.order.findMany({
            where: { customerId },
            include: {
                items: true,
                paymentTransactions: {
                    select: {
                        id: true,
                        provider: true,
                        transactionCode: true,
                        amount: true,
                        status: true,
                        createdAt: true,
                    },
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Chi tiết đơn hàng.
     */
    @Get(':id')
    async getOrder(@Param('id') id: string, @Req() req: Request) {
        const customerId = await this.getCustomerId(req);
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                items: true,
                paymentTransactions: {
                    select: {
                        id: true,
                        provider: true,
                        transactionCode: true,
                        amount: true,
                        status: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: 'desc' },
                },
                statusHistory: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!order) {
            throw new NotFoundException('Không tìm thấy đơn hàng');
        }

        // Kiểm tra quyền sở hữu: customer chỉ xem được đơn của mình
        if (customerId && order.customerId !== customerId) {
            throw new NotFoundException('Không tìm thấy đơn hàng');
        }

        return order;
    }

    /**
     * Hủy đơn hàng (chỉ PENDING/CONFIRMED, idempotent).
     */
    @Post(':id/cancel')
    async cancelOrder(
        @Param('id') id: string,
        @Body() body: CancelOrderDto,
        @Req() req: Request,
    ) {
        const customerId = await this.getCustomerId(req);
        if (!customerId) {
            throw new NotFoundException('Không tìm thấy thông tin khách hàng');
        }
        return this.orderService.cancelOrder(id, customerId, body.note);
    }
}