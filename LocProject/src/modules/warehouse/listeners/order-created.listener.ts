import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { OrderCreatedEvent } from '../../sales/events/order-created.event';
import { InventoryService } from '../services/inventory.service';
import { InventoryAllocationFailedEvent } from '../events/inventory-allocation-failed.event';

@Injectable()
export class OrderCreatedListener {
  private readonly logger = new Logger(OrderCreatedListener.name);

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('order.created')
  async handleOrderCreatedEvent(event: OrderCreatedEvent) {
    this.logger.log(`Handling order.created event for order: ${event.orderId}`);
    try {
      for (const item of event.items) {
        await this.inventoryService.allocate(item.productVariantId, item.qty, event.orderId);
      }
    } catch (error) {
      this.logger.error(`Failed to allocate inventory for order ${event.orderId}: ${(error as any).message}`);

      // Giải phóng tồn kho đã allocate thành công cho các item trước đó
      const failedItemIndex = event.items.findIndex(
        (item) => (error as any).message?.includes(item.productVariantId),
      );
      // Release các item đã allocate thành công (trước item bị lỗi)
      const successfulItems = failedItemIndex > 0 ? event.items.slice(0, failedItemIndex) : [];
      for (const item of successfulItems) {
        try {
          await this.inventoryService.release(item.productVariantId, item.qty, event.orderId);
        } catch (releaseError) {
          this.logger.error(`Failed to release inventory for variant ${item.productVariantId} during compensation: ${(releaseError as any).message}`);
        }
      }

      // Phát đi event để Sales tự xử lý cancelOrder và cập nhật trạng thái đơn hàng
      this.eventEmitter.emit(
        'inventory.allocation.failed',
        new InventoryAllocationFailedEvent(event.orderId, (error as any).message || 'Không đủ tồn kho khả dụng'),
      );
    }
  }
}
