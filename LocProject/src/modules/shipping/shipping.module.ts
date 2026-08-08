import { Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CarrierService } from './services/carrier.service';
import { ShipmentService } from './services/shipment.service';
import { CarrierController } from './controllers/carrier.controller';
import { ShipmentController } from './controllers/shipment.controller';
import { OrderConfirmedListener } from './listeners/order-confirmed.listener';
import { ShipmentDeliveredListener } from './listeners/shipment-delivered.listener';

@Module({
  controllers: [CarrierController, ShipmentController],
  providers: [CarrierService, ShipmentService, OrderConfirmedListener, ShipmentDeliveredListener],
  exports: [CarrierService, ShipmentService],
})
export class ShippingModule { }
