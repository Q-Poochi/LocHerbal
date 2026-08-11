import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AllocationStatus } from '@prisma/client';
import { PaymentConfirmedEvent } from '../../sales/events/payment-confirmed.event';
import { InventoryService } from '../services/inventory.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class PaymentConfirmedListener {
  private readonly logger = new Logger(PaymentConfirmedListener.name);

  // Tối đa 3 lần đọc lại DB khi order còn PENDING (allocate có thể chưa xong)
  private readonly MAX_ALLOCATION_WAIT = 3;
  private readonly ALLOCATION_RETRY_DELAY_MS = 200;

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('payment.confirmed')
  async handlePaymentConfirmedEvent(event: PaymentConfirmedEvent) {
    this.logger.log(`Handling payment.confirmed event for order: ${event.orderId}`);

    const allocationStatus = await this.waitForAllocation(event.orderId);
    if (allocationStatus !== AllocationStatus.ALLOCATED) {
      this.logger.error(
        `[RÒ STOCK] Order ${event.orderId} đã nhận payment.confirmed nhưng allocation status = ${allocationStatus}. Không deduct.`,
      );
      await this.prisma.orderStatusHistory.create({
        data: {
          orderId: event.orderId,
          status: 'PENDING',
          note: `[CRITICAL] payment.confirmed nhận khi allocation = ${allocationStatus} — KHÔNG deduct (cần xử lý thủ công)`,
          changedBy: 'WAREHOUSE_AUDIT',
        },
      });
      return;
    }

    // Defense-in-depth: xác minh số dư RESERVED thực tế trước khi deduct
    const fullyAllocated = await this.inventoryService.isOrderFullyAllocated(
      event.orderId,
      event.items,
    );
    if (!fullyAllocated) {
      this.logger.error(
        `[RÒ STOCK] Order ${event.orderId} allocationStatus=ALLOCATED nhưng StockMovement thiếu. Không deduct.`,
      );
      await this.prisma.orderStatusHistory.create({
        data: {
          orderId: event.orderId,
          status: 'PENDING',
          note: '[CRITICAL] allocationStatus=ALLOCATED nhưng reserve thiếu — KHÔNG deduct (cần xử lý thủ công)',
          changedBy: 'WAREHOUSE_AUDIT',
        },
      });
      return;
    }

    for (const item of event.items) {
      try {
        await this.inventoryService.deduct(item.productVariantId, item.qty, event.orderId);
      } catch (error) {
        this.logger.error(
          `[RÒ STOCK] Failed to deduct inventory for order ${event.orderId}, variant=${item.productVariantId}: ${(error as any).message}`,
        );
        await this.prisma.orderStatusHistory.create({
          data: {
            orderId: event.orderId,
            status: 'PENDING',
            note: `[CRITICAL] deduct thất bại variant ${item.productVariantId} — ${(error as any).message}`,
            changedBy: 'WAREHOUSE_AUDIT',
          },
        });
      }
    }
  }

  /**
   * Đọc allocationStatus của order. Nếu còn PENDING (order.created→allocate đang
   * xử lý song song), đọc lại sau delay ngắn tối đa MAX_ALLOCATION_WAIT lần.
   * Trả FAILED/PENDING nếu không kịp hoặc đã fail — lúc đó KHÔNG deduct.
   */
  private async waitForAllocation(orderId: string): Promise<AllocationStatus> {
    for (let attempt = 0; attempt < this.MAX_ALLOCATION_WAIT; attempt++) {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { allocationStatus: true },
      });
      if (!order) return AllocationStatus.FAILED;
      if (order.allocationStatus !== AllocationStatus.PENDING) {
        return order.allocationStatus;
      }
      if (attempt < this.MAX_ALLOCATION_WAIT - 1) {
        await this.delay(this.ALLOCATION_RETRY_DELAY_MS);
      }
    }
    return AllocationStatus.PENDING;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
