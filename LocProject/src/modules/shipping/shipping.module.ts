import { Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CarrierService } from './services/carrier.service';
import { ShipmentService } from './services/shipment.service';
import { CarrierWebhookService } from './services/carrier-webhook.service';
import { CarrierController } from './controllers/carrier.controller';
import { ShipmentController } from './controllers/shipment.controller';
import { CarrierWebhookController } from './controllers/carrier-webhook.controller';
import { OrderConfirmedListener } from './listeners/order-confirmed.listener';
import { ShipmentDeliveredListener } from './listeners/shipment-delivered.listener';

@Module({
  controllers: [CarrierController, ShipmentController, CarrierWebhookController],
  providers: [
    CarrierService,
    ShipmentService,
    CarrierWebhookService,
    OrderConfirmedListener,
    ShipmentDeliveredListener,
  ],
  exports: [CarrierService, ShipmentService],
})
export class ShippingModule { }
