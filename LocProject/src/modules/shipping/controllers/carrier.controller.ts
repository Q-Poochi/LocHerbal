import { Controller, Get, Post, Patch, Param, Body, Delete, UseGuards } from '@nestjs/common';
import { CarrierService } from '../services/carrier.service';
import { CreateCarrierDto } from '../dto/create-carrier.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';

@Controller('api/v1/shipping/carriers')
export class CarrierController {
    constructor(private readonly carrierService: CarrierService) { }

    @Get()
    findAll(@Body('isActive') isActive?: boolean) {
        return this.carrierService.findAll(isActive);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.carrierService.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    create(@Body() dto: CreateCarrierDto) {
        return this.carrierService.create(dto);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    update(@Param('id') id: string, @Body() dto: any) {
        return this.carrierService.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    deactivate(@Param('id') id: string) {
        return this.carrierService.deactivate(id);
    }
}
