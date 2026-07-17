import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { SupplierService } from '../services/supplier.service';
import { CreateSupplierDto } from '../dto/create-supplier.dto';
import { UpdateSupplierDto } from '../dto/update-supplier.dto';

@Controller('supplier')
@UseGuards(JwtAuthGuard)
export class SupplierController {
    constructor(private readonly supplierService: SupplierService) { }

    @Get()
    findAll() {
        return this.supplierService.findAll();
    }

    @Post()
    create(@Body() dto: CreateSupplierDto) {
        return this.supplierService.create(dto);
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.supplierService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateSupplierDto,
    ) {
        return this.supplierService.update(id, dto);
    }

    @Delete(':id')
    deactivate(@Param('id', ParseUUIDPipe) id: string) {
        return this.supplierService.deactivate(id);
    }
}