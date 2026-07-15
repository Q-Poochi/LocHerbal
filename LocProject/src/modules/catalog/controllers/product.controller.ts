import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ProductService } from '../services/product.service';
import { CreateProductDto, UpdateProductDto, UpsertProductAttributeValueDto } from '../dto/product.dto';
import { Public } from '../../core/decorators/public.decorator';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Public()
  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  // --- PRODUCT ATTRIBUTE VALUES (EAV) ---

  @Post(':id/attributes')
  upsertAttributeValue(@Param('id') id: string, @Body() dto: UpsertProductAttributeValueDto) {
    return this.productService.upsertAttributeValue(id, dto);
  }

  @Delete(':id/attributes/:attributeId')
  removeAttributeValue(@Param('id') id: string, @Param('attributeId') attributeId: string) {
    return this.productService.removeAttributeValue(id, attributeId);
  }
}
