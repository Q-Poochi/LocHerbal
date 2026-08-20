import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CategoryService } from './services/category.service';
import { ProductService } from './services/product.service';
import { ReviewService } from './services/review.service';
import { CategoryController } from './controllers/category.controller';
import { ProductController } from './controllers/product.controller';
import { UploadController } from './controllers/upload.controller';
import { ReviewController } from './controllers/review.controller';
import { ObjectStorageService } from '../../shared/storage/object-storage.service';
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
  // Không cấu hình Redis → fallback in-memory (không bị treo request).
  return new Keyv();
}

@Module({
  controllers: [CategoryController, ProductController, UploadController, ReviewController],
  providers: [CategoryService, ProductService, ReviewService, ObjectStorageService],
  exports: [ProductService, CategoryService, ObjectStorageService],
  imports: [
    CacheModule.register({
      stores: [buildStore()],
      ttl: 3_600_000,
    }),
  ],
})
export class CatalogModule { }
