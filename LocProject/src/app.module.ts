import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { RedisThrottlerStorage } from './shared/throttler/redis-throttler.storage';
import { ConfigModule } from '@nestjs/config';
import { validate } from './shared/config/env.validation';
import { CoreModule } from './modules/core/core.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { SalesModule } from './modules/sales/sales.module';
import { AdminModule } from './modules/admin/admin.module';
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ConsultationModule } from './modules/consultation/consultation.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { SupplierModule } from './modules/supplier/supplier.module';
import { SupportModule } from './modules/support/support.module';
import { PrismaModule } from './shared/prisma/prisma.module';
import { AuditService } from './shared/services/audit.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    PrismaModule,
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: Number(process.env.THROTTLE_LIMIT ?? 60) }],
      // Redis storage: rate limit chia sẻ giữa các instance Railway
      // (in-memory counter per-instance khiến limit thực tế = limit x số instance)
      storage: new RedisThrottlerStorage(),
    }),
    CoreModule,
    CatalogModule,
    SalesModule,
    AdminModule,
    WarehouseModule,
    AccountingModule,
    MarketingModule,
    SettingsModule,
    ConsultationModule,
    ShippingModule,
    SupplierModule,
    SupportModule,
  ],
  controllers: [],
  providers: [
    AuditService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

