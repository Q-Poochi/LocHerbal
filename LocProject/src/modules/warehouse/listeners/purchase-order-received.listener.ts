import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PurchaseOrderReceivedEvent } from '../../supplier/events/purchase-order-received.event';
import { InventoryService } from '../services/inventory.service';

@Injectable()
export class PurchaseOrderReceivedListener {
    private readonly logger = new Logger(PurchaseOrderReceivedListener.name);

    constructor(private inventoryService: InventoryService) { }

    @OnEvent('purchase-order.received')
    async handle(event: PurchaseOrderReceivedEvent) {
        this.logger.log(`Handling purchase-order.received event for order: ${event.orderId}`);
        for (const item of event.items) {
            await this.inventoryService.inbound(
                item.productVariantId,
                item.warehouseId,
                item.qty,
                event.orderId,
            );
        }
    }
}