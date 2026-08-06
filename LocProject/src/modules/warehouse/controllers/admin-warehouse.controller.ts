import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { InventoryService } from '../services/inventory.service';
import { PaginationDto } from '../../../shared/dto/pagination.dto';

@ApiTags('Admin / Warehouse')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
@Controller('admin/warehouse')
export class AdminWarehouseController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Roles('admin', 'staff')
    @Get('stock')
    @ApiOperation({ summary: 'Tổng quan tồn kho (danh sách + tổng hợp theo kho)' })
    async getStock(@Query() pagination: PaginationDto) {
        return this.inventoryService.getStockOverview(pagination?.page || 1, pagination?.limit || 20);
    }
}
