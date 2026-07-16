import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { InvoiceService } from './services/invoice.service';
import { PaymentTransactionService } from './services/payment-transaction.service';
import { AccountingController } from './controllers/accounting.controller';
import { PaymentConfirmedListener } from './listeners/payment-confirmed.listener';

@Module({
  imports: [PrismaModule],
  controllers: [AccountingController],
  providers: [InvoiceService, PaymentTransactionService, PaymentConfirmedListener],
  exports: [InvoiceService, PaymentTransactionService],
})
export class AccountingModule { }