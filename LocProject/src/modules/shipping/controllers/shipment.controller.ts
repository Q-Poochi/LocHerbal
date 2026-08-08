import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShipmentService } from '../services/shipment.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { CreateShipmentDto } from '../dto/create-shipment.dto';
import { UpdateShipmentStatusDto } from '../dto/update-shipment-status.dto';
import { AddTrackingEventDto } from '../dto/add-tracking-event.dto';
import { ShipmentStatus } from '@prisma/client';

@ApiTags('Shipping')
@Controller('api/v1/shipping/shipments')
export class ShipmentController {
    constructor(
        private readonly shipmentService: ShipmentService,
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

    @Get('order/:orderId')
    @ApiOperation({ summary: 'Shipment của đơn hàng (chủ đơn)' })
    async findByOrder(@Param('orderId') orderId: string, @Req() req: Request) {
        const customerId = await this.getCustomerId(req);
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: { customerId: true },
        });
        if (!order) {
            throw new NotFoundException('Không tìm thấy đơn hàng');
        }

        // Kiểm tra quyền sở hữu: customer chỉ xem được shipment đơn của mình (fail-closed)
        if (!customerId || order.customerId !== customerId) {
            throw new NotFoundException('Không tìm thấy đơn hàng');
        }

        return this.shipmentService.findByOrder(orderId);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'staff')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Tạo shipment (admin)' })
    create(@Body() dto: CreateShipmentDto) {
        return this.shipmentService.create(dto);
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'staff')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật trạng thái shipment (admin)' })
    updateStatus(@Param('id') id: string, @Body() dto: UpdateShipmentStatusDto) {
        return this.shipmentService.updateStatus(id, dto.status as ShipmentStatus, dto.note);
    }

    @Post(':id/tracking')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'staff')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Thêm mốc theo dõi (tracking) cho shipment (admin)' })
    addTrackingEvent(@Param('id') id: string, @Body() dto: AddTrackingEventDto) {
        return this.shipmentService.addTrackingEvent(id, dto);
    }
}