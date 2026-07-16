import { Module } from '@nestjs/common';
import { CartService } from './services/cart.service';
import { OrderService } from './services/order.service';
import { VNPayService } from './services/vnpay.service';
import { PaymentController } from './controllers/payment.controller';
import { CartController } from './controllers/cart.controller';
import { OrderController } from './controllers/order.controller';
import { InventoryAllocationFailedListener } from './listeners/inventory-allocation-failed.listener';

@Module({
  providers: [
    CartService,
    OrderService,
    VNPayService,
    InventoryAllocationFailedListener,
  ],
  controllers: [PaymentController, CartController, OrderController],
  exports: [CartService, OrderService, VNPayService],
})
export class SalesModule { }

