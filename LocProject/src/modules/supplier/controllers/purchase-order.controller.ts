import { Controller, Get, Post, Patch, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { User } from '../../core/decorators/user.decorator';
import { PurchaseOrderService } from '../services/purchase-order.service';
import { CreatePurchaseOrderDto } from '../dto/create-purchase-order.dto';
import { ReceiveItemsDto } from '../dto/receive-items.dto';
import { PurchaseOrderStatus } from '@prisma/client';

@Controller('supplier/purchase-orders')
@UseGuards(JwtAuthGuard)
export class PurchaseOrderController {
    constructor(private readonly purchaseOrderService: PurchaseOrderService) { }

    @Get()
    findAll() {
        return this.purchaseOrderService.findAll();
    }

    @Post()
    create(
        @Body() dto: CreatePurchaseOrderDto,
        @User('userId') userId: string,
    ) {
        return this.purchaseOrderService.createPO(dto, userId);
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.purchaseOrderService.findOne(id);
    }

    @Patch(':id/status')
    updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() status: PurchaseOrderStatus,
    ) {
        return this.purchaseOrderService.updateStatus(id, status);
    }

    @Post(':id/receive')
    receive(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ReceiveItemsDto,
    ) {
        return this.purchaseOrderService.receiveItems(id, dto);
    }

    @Post(':id/cancel')
    cancel(@Param('id', ParseUUIDPipe) id: string) {
        return this.purchaseOrderService.cancelPO(id);
    }
}