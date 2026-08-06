import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { AdminCustomerService } from '../services/admin-customer.service';
import { PaginationDto } from '../../../shared/dto/pagination.dto';

@ApiTags('Admin / Customers')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
@Controller('admin/customers')
export class AdminCustomerController {
    constructor(private readonly adminCustomerService: AdminCustomerService) { }

    @Roles('admin', 'staff')
    @Get()
    @ApiOperation({ summary: 'Danh sách khách hàng (số đơn + tổng chi tiêu)' })
    async findAll(@Query() pagination: PaginationDto) {
        return this.adminCustomerService.findAll(pagination?.page || 1, pagination?.limit || 20);
    }

    @Roles('admin', 'staff')
    @Get(':id')
    @ApiOperation({ summary: 'Chi tiết khách hàng + lịch sử đơn hàng' })
    async findById(@Param('id') id: string) {
        return this.adminCustomerService.findById(id);
    }
}
