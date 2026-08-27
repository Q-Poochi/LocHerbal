import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    Req,
    Res,
    UseGuards,
    NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { OrderService } from '../services/order.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CancelOrderDto } from '../dto/order.dto';
import { PaginationDto } from '../../../shared/dto/pagination.dto';
import { OrderStatus } from '@prisma/client';

@ApiTags('Orders')
@ApiBearerAuth()
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
     * Danh sách đơn hàng của customer hiện tại (có phân trang + lọc trạng thái).
     * status không hợp lệ sẽ bị bỏ qua âm thầm (trả tất cả) — tránh 500 do query lạ.
     */
    @Get()
    async listOrders(
        @Query() pagination: PaginationDto,
        @Query('status') status?: string,
        @Req() req?: Request,
    ) {
        const customerId = await this.getCustomerId(req);
        if (!customerId) {
            throw new NotFoundException('Không tìm thấy thông tin khách hàng');
        }
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 20;

        const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
        const where: { customerId: string; status?: OrderStatus } = { customerId };
        if (status && (VALID_STATUSES as readonly string[]).includes(status)) {
            where.status = status as OrderStatus;
        }

        const [data, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    items: true,
                    paymentTxns: {
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
            }),
            this.prisma.order.count({ where }),
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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
                paymentTxns: {
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
                address: true,
                shipment: true,
                statusHistory: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!order) {
            throw new NotFoundException('Không tìm thấy đơn hàng');
        }

        // Kiểm tra quyền sở hữu: customer chỉ xem được đơn của mình (fail-closed)
        if (!customerId || order.customerId !== customerId) {
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

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'staff')
    @Get('export/csv')
    @ApiOperation({ summary: 'Xuất danh sách đơn hàng dạng CSV' })
    @ApiQuery({ name: 'from', required: false })
    @ApiQuery({ name: 'to', required: false })
    async exportCsv(
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Res() res?: Response,
    ) {
        const where: any = {};
        if (from || to) {
            where.createdAt = {};
            if (from) where.createdAt.gte = new Date(from);
            if (to) where.createdAt.lte = new Date(to);
        }

        const orders = await this.prisma.order.findMany({
            where,
            include: {
                customer: { select: { fullName: true, phone: true, email: true } },
                items: { include: { variant: { select: { sku: true, name: true } } } },
                address: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        const header = 'Mã ĐH,Khách hàng,SĐT,Email,Tổng tiền,Trạng thái,Thanh toán,Ngày tạo\n';
        const rows = orders.map(o => {
            const line = [
                o.orderCode,
                o.customer?.fullName || '',
                o.customer?.phone || '',
                o.customer?.email || '',
                o.subtotal.toString(),
                o.status,
                o.paymentStatus,
                o.createdAt.toISOString(),
            ].map(v => `"${v}"`).join(',');
            return line;
        }).join('\n');

        res.set({
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="orders.csv"',
        });
        res.send('\uFEFF' + header + rows);
    }
}