import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CategoryService } from './services/category.service';
import { ProductService } from './services/product.service';
import { CategoryController } from './controllers/category.controller';
import { ProductController } from './controllers/product.controller';
import * as redisStore from 'cache-manager-redis-yet';

@Module({
  controllers: [CategoryController, ProductController],
  providers: [CategoryService, ProductService],
  exports: [ProductService, CategoryService],
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      ttl: 3600,
    }),
  ],
})
export class CatalogModule { }
