import { Module } from '@nestjs/common';
import { CartService } from './services/cart.service';
import { OrderService } from './services/order.service';
import { VNPayService } from './services/vnpay.service';
import { PaymentController } from './controllers/payment.controller';
import { InventoryAllocationFailedListener } from './listeners/inventory-allocation-failed.listener';

@Module({
  providers: [
    CartService,
    OrderService,
    VNPayService,
    InventoryAllocationFailedListener,
  ],
  controllers: [PaymentController],
  exports: [CartService, OrderService, VNPayService],
})
export class SalesModule {}

