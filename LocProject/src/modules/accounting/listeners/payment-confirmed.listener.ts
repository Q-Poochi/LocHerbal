import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InvoiceService } from '../services/invoice.service';

@Injectable()
export class PaymentConfirmedListener {
    private readonly logger = new Logger(PaymentConfirmedListener.name);

    constructor(private readonly invoiceService: InvoiceService) { }

    @OnEvent('payment.confirmed')
    async handlePaymentConfirmed(event: { orderId: string }) {
        try {
            this.logger.log(`Received payment.confirmed for order ${event.orderId}`);
            const invoice = await this.invoiceService.createFromOrder(event.orderId);
            this.logger.log(`Invoice created: ${invoice.invoiceNumber} for order ${event.orderId}`);
        } catch (error: any) {
            this.logger.error(`Failed to create invoice for order ${event.orderId}: ${error?.message || error}`);
            // Không throw error để không block event handler chain
        }
    }
}