import { Module } from '@nestjs/common';
import { CategoryService } from './services/category.service';
import { ProductService } from './services/product.service';
import { CategoryController } from './controllers/category.controller';
import { ProductController } from './controllers/product.controller';

@Module({
  controllers: [CategoryController, ProductController],
  providers: [CategoryService, ProductService],
  exports: [ProductService, CategoryService],
})
export class CatalogModule {}
