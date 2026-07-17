import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { SupplierService } from './services/supplier.service';
import { PurchaseOrderService } from './services/purchase-order.service';
import { SupplierController } from './controllers/supplier.controller';
import { PurchaseOrderController } from './controllers/purchase-order.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SupplierController, PurchaseOrderController],
  providers: [SupplierService, PurchaseOrderService],
  exports: [],
})
export class SupplierModule { }