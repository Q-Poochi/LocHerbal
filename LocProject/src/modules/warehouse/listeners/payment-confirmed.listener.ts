import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PaymentConfirmedEvent } from '../../sales/events/payment-confirmed.event';
import { InventoryService } from '../services/inventory.service';

@Injectable()
export class PaymentConfirmedListener {
  private readonly logger = new Logger(PaymentConfirmedListener.name);

  constructor(private readonly inventoryService: InventoryService) {}

  @OnEvent('payment.confirmed')
  async handlePaymentConfirmedEvent(event: PaymentConfirmedEvent) {
    this.logger.log(`Handling payment.confirmed event for order: ${event.orderId}`);
    try {
      for (const item of event.items) {
        await this.inventoryService.deduct(item.productVariantId, item.qty, event.orderId);
      }
    } catch (error) {
      this.logger.error(`Failed to deduct inventory for order ${event.orderId}: ${(error as any).message}`);
    }
  }
}
