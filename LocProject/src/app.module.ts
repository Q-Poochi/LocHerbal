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
      // Tracker = IP client thật (hop CUỐI của X-Forwarded-For, do Railway edge append
      // -> client không spoof được). getTracker mặc định dùng req.ip = IP proxy nội bộ,
      // khiến counter bị phân mảnh theo connection và limit trở nên vô nghĩa.
      getTracker: (req: { headers?: Record<string, string | string[] | undefined>; ip?: string }) => {
        const xff = req.headers?.['x-forwarded-for'];
        if (typeof xff === 'string' && xff.trim().length > 0) {
          const parts = xff.split(',');
          return parts[parts.length - 1].trim();
        }
        return req.ip ?? 'unknown';
      },
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

