import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { AllocationStatus } from '@prisma/client';
import { OrderCreatedEvent } from '../../sales/events/order-created.event';
import { InventoryService } from '../services/inventory.service';
import { InventoryAllocationFailedEvent } from '../events/inventory-allocation-failed.event';
import { InsufficientStockException } from '../exceptions/insufficient-stock.exception';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class OrderCreatedListener {
  private readonly logger = new Logger(OrderCreatedListener.name);

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly eventEmitter: EventEmitter2,
    private readonly prisma: PrismaService,
  ) { }

  @OnEvent('order.created')
  async handleOrderCreatedEvent(event: OrderCreatedEvent): Promise<{ success: boolean; reason?: string }> {
    this.logger.log(`Handling order.created event for order: ${event.orderId}`);
    try {
      for (let i = 0; i < event.items.length; i++) {
        const item = event.items[i];
        await this.inventoryService.allocate(item.productVariantId, item.qty, event.orderId);
      }

      // Ghi idempotency key — payment-confirmed (deduct) chỉ chạy khi ALLOCATED
      await this.prisma.order.update({
        where: { id: event.orderId },
        data: { allocationStatus: AllocationStatus.ALLOCATED },
      });
      return { success: true };
    } catch (error) {
      const failedItemIndex = this.findFailedItemIndex(error, event.items);
      const failedVariantId = failedItemIndex >= 0 ? event.items[failedItemIndex].productVariantId : 'unknown';

      this.logger.error(
        `Failed to allocate inventory for order ${event.orderId}: variant=${failedVariantId}, message=${(error as any).message}`,
      );

      // Giải phóng tồn kho đã allocate thành công cho các item trước đó
      const successfulItems = failedItemIndex > 0 ? event.items.slice(0, failedItemIndex) : [];
      for (const item of successfulItems) {
        try {
          await this.inventoryService.release(item.productVariantId, item.qty, event.orderId);
        } catch (releaseError) {
          this.logger.error(
            `Failed to release inventory for variant ${item.productVariantId} during compensation: ${(releaseError as any).message}`,
          );
        }
      }

      // Phát đi event để Sales tự xử lý cancelOrder và cập nhật trạng thái đơn hàng
      this.eventEmitter.emit(
        'inventory.allocation.failed',
        new InventoryAllocationFailedEvent(
          event.orderId,
          (error as any).message || 'Không đủ tồn kho khả dụng',
          failedVariantId,
          failedItemIndex,
        ),
      );

      // Ghi idempotency key FAILED — payment-confirmed (deduct) KHÔNG được chạy
      try {
        await this.prisma.order.update({
          where: { id: event.orderId },
          data: { allocationStatus: AllocationStatus.FAILED },
        });
      } catch (updateError) {
        this.logger.error(
          `Failed to mark order ${event.orderId} allocation FAILED: ${(updateError as any).message}`,
        );
      }

      // Trả về failure để OrderService (checkout) biết và chặn đơn đang thiếu tồn kho
      return { success: false, reason: (error as any).message || 'Không đủ tồn kho khả dụng' };
    }
  }

  /**
   * Xác định item index bị lỗi dựa vào exception type.
   * - Nếu là InsufficientStockException: đọc variantId từ exception property
   * - Nếu là exception khác (NotFoundException...): dùng index tracking từ vòng lặp
   */
  private findFailedItemIndex(
    error: unknown,
    items: { productVariantId: string; qty: number }[],
  ): number {
    if (error instanceof InsufficientStockException) {
      return items.findIndex((item) => item.productVariantId === error.variantId);
    }
    // Fallback: exception không chứa variantId -> không xác định được item nào
    return -1;
  }
}