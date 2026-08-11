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
    for (const item of event.items) {
      try {
        await this.inventoryService.release(item.productVariantId, item.qty, event.orderId);
      } catch (error) {
        // Fail 1 item không được chặn các item còn lại — nếu dừng sớm sẽ rò stock.
        this.logger.error(
          `Failed to release inventory for order ${event.orderId}, variant=${item.productVariantId}: ${(error as any).message}`,
        );
      }
    }
  }
}
