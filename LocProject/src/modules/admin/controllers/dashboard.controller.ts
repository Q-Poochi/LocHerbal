import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { DashboardService } from '../services/dashboard.service';

@ApiTags('Admin / Dashboard')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Roles('admin', 'staff')
  @Get('stats')
  @ApiOperation({ summary: 'Thống kê tổng quan (doanh thu, đơn hàng, KH, SP, tồn kho thấp)' })
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Roles('admin', 'staff')
  @Get('revenue-by-day')
  @ApiOperation({ summary: 'Doanh thu theo ngày' })
  @ApiQuery({ name: 'days', required: false, description: 'Số ngày (mặc định 30)' })
  async getRevenueByDay(@Query('days') days = '30') {
    return this.dashboardService.getRevenueByDay(+days);
  }

  @Roles('admin', 'staff')
  @Get('top-products')
  @ApiOperation({ summary: 'Sản phẩm bán chạy' })
  @ApiQuery({ name: 'limit', required: false })
  async getTopProducts(@Query('limit') limit = '10') {
    return this.dashboardService.getTopProducts(+limit);
  }
}
