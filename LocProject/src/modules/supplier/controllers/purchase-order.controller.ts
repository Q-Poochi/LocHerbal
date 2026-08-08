import { Controller, Get, Post, Patch, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { User } from '../../core/decorators/user.decorator';
import { PurchaseOrderService } from '../services/purchase-order.service';
import { CreatePurchaseOrderDto } from '../dto/create-purchase-order.dto';
import { ReceiveItemsDto } from '../dto/receive-items.dto';
import { PurchaseOrderStatus } from '@prisma/client';

@ApiTags('Supplier')
@ApiBearerAuth()
@Controller('supplier/purchase-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PurchaseOrderController {
    constructor(private readonly purchaseOrderService: PurchaseOrderService) { }

    @Get()
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Danh sách phiếu nhập hàng' })
    findAll() {
        return this.purchaseOrderService.findAll();
    }

    @Post()
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Tạo phiếu nhập hàng mới' })
    create(
        @Body() dto: CreatePurchaseOrderDto,
        @User('userId') userId: string,
    ) {
        return this.purchaseOrderService.createPO(dto, userId);
    }

    @Get(':id')
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Chi tiết phiếu nhập hàng' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.purchaseOrderService.findOne(id);
    }

    @Patch(':id/status')
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Cập nhật trạng thái phiếu nhập hàng' })
    updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() status: PurchaseOrderStatus,
    ) {
        return this.purchaseOrderService.updateStatus(id, status);
    }

    @Post(':id/receive')
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Nhận hàng (cộng tồn kho)' })
    receive(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ReceiveItemsDto,
    ) {
        return this.purchaseOrderService.receiveItems(id, dto);
    }

    @Post(':id/cancel')
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Huỷ phiếu nhập hàng' })
    cancel(@Param('id', ParseUUIDPipe) id: string) {
        return this.purchaseOrderService.cancelPO(id);
    }
}
