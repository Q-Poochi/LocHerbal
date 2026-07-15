import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InventoryAllocationFailedEvent } from '../../warehouse/events/inventory-allocation-failed.event';
import { OrderService } from '../services/order.service';

@Injectable()
export class InventoryAllocationFailedListener {
  private readonly logger = new Logger(InventoryAllocationFailedListener.name);

  constructor(private readonly orderService: OrderService) {}

  @OnEvent('inventory.allocation.failed')
  async handleAllocationFailed(event: InventoryAllocationFailedEvent) {
    this.logger.warn(`Nhận sự kiện thất bại tồn kho cho đơn hàng: ${event.orderId}. Lý do: ${event.reason}`);
    try {
      await this.orderService.cancelOrder(
        event.orderId,
        'SYSTEM_COMPENSATING',
        `Tự động hủy: không đủ tồn kho — ${event.reason}`,
      );
      this.logger.log(`Compensating cancelOrder hoàn tất cho đơn hàng ${event.orderId}`);
    } catch (error) {
      this.logger.error(`[CRITICAL] Lỗi compensating cancelOrder cho đơn hàng ${event.orderId}: ${(error as any).message}`);
    }
  }
}
