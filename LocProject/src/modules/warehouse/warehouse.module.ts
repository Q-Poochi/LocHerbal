import { Module } from '@nestjs/common';
import { InventoryService } from './services/inventory.service';
import { OrderCreatedListener } from './listeners/order-created.listener';
import { OrderCancelledListener } from './listeners/order-cancelled.listener';
import { PaymentConfirmedListener } from './listeners/payment-confirmed.listener';
import { PurchaseOrderReceivedListener } from './listeners/purchase-order-received.listener';

@Module({
  providers: [
    InventoryService,
    OrderCreatedListener,
    OrderCancelledListener,
    PaymentConfirmedListener,
    PurchaseOrderReceivedListener,
  ],
  exports: [InventoryService],
})
export class WarehouseModule { }

