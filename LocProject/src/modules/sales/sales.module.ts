import { Module } from '@nestjs/common';
import { CartService } from './services/cart.service';
import { OrderService } from './services/order.service';
import { VNPayService } from './services/vnpay.service';
import { AddressService } from './services/address.service';
import { WishlistService } from './services/wishlist.service';
import { AdminCustomerService } from './services/admin-customer.service';
import { PaymentController } from './controllers/payment.controller';
import { CartController } from './controllers/cart.controller';
import { OrderController } from './controllers/order.controller';
import { AdminOrderController } from './controllers/admin-order.controller';
import { CustomerController } from './controllers/customer.controller';
import { AdminCustomerController } from './controllers/admin-customer.controller';
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
    AdminCustomerService,
    InventoryAllocationFailedListener,
  ],
  controllers: [PaymentController, CartController, OrderController, AdminOrderController, CustomerController, AdminCustomerController, AddressController, WishlistController],
  exports: [CartService, OrderService, VNPayService],
})
export class SalesModule { }

