import { Controller, Get, Patch, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { OrderService } from '../services/order.service';
import { UpdateOrderStatusDto, AdminOrderQueryDto } from '../dto/order.dto';
import { OrderStatus } from '@prisma/client';

@ApiTags('Admin / Orders')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
@Controller('admin/orders')
export class AdminOrderController {
    constructor(private readonly orderService: OrderService) { }

    @Roles('admin', 'staff')
    @Get()
    @ApiOperation({ summary: 'Danh sách đơn hàng (toàn hệ thống)' })
    @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
    @ApiQuery({ name: 'search', required: false, description: 'Tìm theo mã đơn / tên KH / SĐT / email' })
    @ApiQuery({ name: 'from', required: false, description: 'Ngày bắt đầu (YYYY-MM-DD)' })
    @ApiQuery({ name: 'to', required: false, description: 'Ngày kết thúc (YYYY-MM-DD)' })
    async findAll(@Query() query: AdminOrderQueryDto) {
        return this.orderService.findAllForAdmin(
            query?.page || 1,
            query?.limit || 20,
            query?.status,
            query?.search,
            query?.from,
            query?.to,
        );
    }

    @Roles('admin', 'staff')
    @Get(':id')
    @ApiOperation({ summary: 'Chi tiết đơn hàng' })
    async findById(@Param('id') id: string) {
        return this.orderService.findByIdForAdmin(id);
    }

    @Roles('admin', 'staff')
    @Patch(':id/status')
    @ApiOperation({ summary: 'Cập nhật trạng thái đơn hàng' })
    async updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdateOrderStatusDto,
        @Req() req: Request,
    ) {
        const changedBy = (req as any).user?.userId || 'admin';
        return this.orderService.updateStatus(id, dto.status, changedBy, dto.note);
    }
}
