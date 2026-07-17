import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ShipmentService } from '../services/shipment.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { CreateShipmentDto } from '../dto/create-shipment.dto';
import { UpdateShipmentStatusDto } from '../dto/update-shipment-status.dto';
import { AddTrackingEventDto } from '../dto/add-tracking-event.dto';
import { ShipmentStatus } from '@prisma/client';

@Controller('api/v1/shipping/shipments')
export class ShipmentController {
    constructor(private readonly shipmentService: ShipmentService) { }

    @Get('order/:orderId')
    findByOrder(@Param('orderId') orderId: string) {
        return this.shipmentService.findByOrder(orderId);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    create(@Body() dto: CreateShipmentDto) {
        return this.shipmentService.create(dto);
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    updateStatus(@Param('id') id: string, @Body() dto: UpdateShipmentStatusDto) {
        return this.shipmentService.updateStatus(id, dto.status as ShipmentStatus, dto.note);
    }

    @Post(':id/tracking')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    addTrackingEvent(@Param('id') id: string, @Body() dto: AddTrackingEventDto) {
        return this.shipmentService.addTrackingEvent(id, dto);
    }
}