import { Controller, Get, Post, Patch, Param, Body, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CarrierService } from '../services/carrier.service';
import { CreateCarrierDto } from '../dto/create-carrier.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';

@ApiTags('Shipping')
@Controller('api/v1/shipping/carriers')
export class CarrierController {
    constructor(private readonly carrierService: CarrierService) { }

    @Get()
    @ApiOperation({ summary: 'Danh sách hãng vận chuyển' })
    findAll(@Body('isActive') isActive?: boolean) {
        return this.carrierService.findAll(isActive);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Chi tiết hãng vận chuyển' })
    findOne(@Param('id') id: string) {
        return this.carrierService.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'staff')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Tạo hãng vận chuyển mới (admin)' })
    create(@Body() dto: CreateCarrierDto) {
        return this.carrierService.create(dto);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'staff')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật hãng vận chuyển (admin)' })
    update(@Param('id') id: string, @Body() dto: any) {
        return this.carrierService.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'staff')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Vô hiệu hoá hãng vận chuyển (admin)' })
    deactivate(@Param('id') id: string) {
        return this.carrierService.deactivate(id);
    }
}
