import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { InvoiceService } from '../services/invoice.service';
import { PaymentTransactionService } from '../services/payment-transaction.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';

@Controller('accounting')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountingController {
    constructor(
        private readonly invoiceService: InvoiceService,
        private readonly paymentTransactionService: PaymentTransactionService,
    ) { }

    @Get('revenue')
    @Roles('admin', 'staff')
    async getRevenue(@Query('from') from?: string, @Query('to') to?: string) {
        const startDate = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
        const endDate = to ? new Date(to) : new Date();

        const invoices = await this.invoiceService.findAll(1, 1000);
        const revenue = invoices.data
            .filter((inv: any) => {
                const issuedAt = new Date(inv.issuedAt);
                return issuedAt >= startDate && issuedAt <= endDate;
            })
            .reduce((sum: number, inv: any) => sum + Number(inv.totalAmount), 0);

        return {
            from: startDate.toISOString(),
            to: endDate.toISOString(),
            revenue,
            invoiceCount: invoices.data.length,
        };
    }

    @Get('invoices')
    @Roles('admin', 'staff')
    async getInvoices(@Query('page') page?: string, @Query('limit') limit?: string) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 20;
        return this.invoiceService.findAll(pageNum, limitNum);
    }

    @Get('invoices/:orderId')
    @Roles('admin', 'staff')
    async getInvoiceByOrderId(@Param('orderId') orderId: string) {
        return this.invoiceService.findByOrderId(orderId);
    }

    @Get('transactions/:orderId')
    @Roles('admin', 'staff')
    async getTransactionsByOrderId(@Param('orderId') orderId: string) {
        return this.paymentTransactionService.findByOrderId(orderId);
    }
}