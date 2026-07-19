import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { ProductService } from '../services/product.service';
import { CreateProductDto, UpdateProductDto, UpsertProductAttributeValueDto } from '../dto/product.dto';
import { Public } from '../../core/decorators/public.decorator';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Public()
  @Get()
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sort') sort?: 'popular' | 'price_asc' | 'price_desc' | 'newest',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.productService.findAll({
      categoryId,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
    });
  }

  @Public()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productService.findBySlug(slug);
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
