import { Module } from '@nestjs/common';
import { CartService } from './services/cart.service';
import { OrderService } from './services/order.service';
import { VNPayService } from './services/vnpay.service';
import { AddressService } from './services/address.service';
import { WishlistService } from './services/wishlist.service';
import { PaymentController } from './controllers/payment.controller';
import { CartController } from './controllers/cart.controller';
import { OrderController } from './controllers/order.controller';
import { CustomerController } from './controllers/customer.controller';
import { AddressController } from './controllers/address.controller';
import { WishlistController } from './controllers/wishlist.controller';
import { InventoryAllocationFailedListener } from './listeners/inventory-allocation-failed.listener';

@Module({
  providers: [
    CartService,
    OrderService,
    VNPayService,
    AddressService,
    WishlistService,
    InventoryAllocationFailedListener,
  ],
  controllers: [PaymentController, CartController, OrderController, CustomerController, AddressController, WishlistController],
  exports: [CartService, OrderService, VNPayService],
})
export class SalesModule { }

