import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvoiceService } from '../services/invoice.service';
import { PaymentTransactionService } from '../services/payment-transaction.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';

@ApiTags('Accounting')
@ApiBearerAuth()
@Controller('accounting')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountingController {
    constructor(
        private readonly invoiceService: InvoiceService,
        private readonly paymentTransactionService: PaymentTransactionService,
    ) { }

    @Get('revenue')
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Doanh thu theo khoảng thời gian' })
    async getRevenue(@Query('from') from?: string, @Query('to') to?: string) {
        const startDate = from ? new Date(from) : undefined;
        const endDate = to ? new Date(to) : undefined;
        return this.invoiceService.getRevenue(startDate, endDate);
    }

    @Get('invoices')
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Danh sách hoá đơn (có phân trang)' })
    async getInvoices(@Query('page') page?: string, @Query('limit') limit?: string) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 20;
        return this.invoiceService.findAll(pageNum, limitNum);
    }

    @Get('invoices/:orderId')
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Hoá đơn theo đơn hàng' })
    async getInvoiceByOrderId(@Param('orderId') orderId: string) {
        return this.invoiceService.findByOrderId(orderId);
    }

    @Get('transactions/:orderId')
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Giao dịch thanh toán theo đơn hàng' })
    async getTransactionsByOrderId(@Param('orderId') orderId: string) {
        return this.paymentTransactionService.findByOrderId(orderId);
    }
}