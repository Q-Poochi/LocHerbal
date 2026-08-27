import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { CompanySettingsService } from './services/company-settings.service';
import { CompanySettingsController } from './controllers/settings.controller';
import KeyvRedis from '@keyv/redis';
import Keyv from 'keyv';

function buildStore(): Keyv {
  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST;
  if (redisUrl || redisHost) {
    return new Keyv(redisUrl
      ? new KeyvRedis(redisUrl)
      : new KeyvRedis({
          socket: {
            host: redisHost,
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
          },
        }));
  }
  return new Keyv();
}

@Module({
  imports: [
    PrismaModule,
    CacheModule.register({
      stores: [buildStore()],
      ttl: 3_600_000,
    }),
  ],
  controllers: [CompanySettingsController],
  providers: [CompanySettingsService],
  exports: [CompanySettingsService],
})
export class SettingsModule { }
