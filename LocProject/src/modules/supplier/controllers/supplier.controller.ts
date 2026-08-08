import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { SupplierService } from '../services/supplier.service';
import { CreateSupplierDto } from '../dto/create-supplier.dto';
import { UpdateSupplierDto } from '../dto/update-supplier.dto';

@ApiTags('Supplier')
@ApiBearerAuth()
@Controller('supplier')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupplierController {
    constructor(private readonly supplierService: SupplierService) { }

    @Get()
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Danh sách nhà cung cấp' })
    findAll() {
        return this.supplierService.findAll();
    }

    @Post()
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Tạo nhà cung cấp mới' })
    create(@Body() dto: CreateSupplierDto) {
        return this.supplierService.create(dto);
    }

    @Get(':id')
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Chi tiết nhà cung cấp' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.supplierService.findOne(id);
    }

    @Patch(':id')
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Cập nhật nhà cung cấp' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateSupplierDto,
    ) {
        return this.supplierService.update(id, dto);
    }

    @Delete(':id')
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Vô hiệu hoá nhà cung cấp' })
    deactivate(@Param('id', ParseUUIDPipe) id: string) {
        return this.supplierService.deactivate(id);
    }
}
