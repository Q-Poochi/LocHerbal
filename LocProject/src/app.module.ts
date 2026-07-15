import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CoreModule } from './modules/core/core.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { SalesModule } from './modules/sales/sales.module';
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { SupplierModule } from './modules/supplier/supplier.module';
import { PrismaModule } from './shared/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    EventEmitterModule.forRoot(),
    CoreModule,
    CatalogModule,
    SalesModule,
    WarehouseModule,
    AccountingModule,
    MarketingModule,
    ShippingModule,
    SupplierModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

