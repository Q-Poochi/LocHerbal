import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderCancelledEvent } from '../../sales/events/order-cancelled.event';
import { InventoryService } from '../services/inventory.service';

@Injectable()
export class OrderCancelledListener {
  private readonly logger = new Logger(OrderCancelledListener.name);

  constructor(private readonly inventoryService: InventoryService) {}

  @OnEvent('order.cancelled')
  async handleOrderCancelledEvent(event: OrderCancelledEvent) {
    this.logger.log(`Handling order.cancelled event for order: ${event.orderId}`);
    try {
      for (const item of event.items) {
        await this.inventoryService.release(item.productVariantId, item.qty, event.orderId);
      }
    } catch (error) {
      this.logger.error(`Failed to release inventory for order ${event.orderId}: ${(error as any).message}`);
    }
  }
}
