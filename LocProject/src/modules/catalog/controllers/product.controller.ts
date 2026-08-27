import { SkipThrottle } from '@nestjs/throttler';
import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { CreateProductDto, UpdateProductDto, UpsertProductAttributeValueDto } from '../dto/product.dto';
import { Public } from '../../core/decorators/public.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { RolesGuard } from '../../core/guards/roles.guard';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly prisma: PrismaService,
  ) { }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo sản phẩm mới (admin)' })
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Public()
  @SkipThrottle()
  @Get()
  @ApiOperation({ summary: 'Danh sách sản phẩm (có phân trang, lọc)' })
  @ApiResponse({ status: 200, description: 'Danh sách sản phẩm phân trang', schema: { example: { data: [{ id: 'product-uuid', name: 'Cỏ Thoái Vương', slug: 'cot-thoai-vuong', price: 290000, salePrice: 250000, imageUrl: 'http://localhost:4000/uploads/products/xxx.png', categoryId: 'cat-uuid' }], total: 12, page: 1, limit: 12, totalPages: 1 } } })
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
  @SkipThrottle()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productService.findBySlug(slug);
  }

  @Public()
  @SkipThrottle()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật sản phẩm (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xoá sản phẩm (admin)' })
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  /**
   * Tra cứu giá tham khảo thị trường theo tên sản phẩm.
   * Dùng AI keywords để gợi ý nếu chưa có trong database.
   */
  @Public()
  @Get('reference-price')
  async referencePrice(@Query('name') name?: string) {
    if (!name) return { found: false };

    // Tìm gần đúng trong DB (ưu tiên chính xác, fallback like)
    const ref = await this.prisma.referencePrice.findFirst({
      where: {
        OR: [
          { productName: { equals: name } },
          { productName: { contains: name, mode: 'insensitive' } },
        ],
      },
      orderBy: { productName: 'asc' },
    });
    if (ref) return { found: true, productName: ref.productName, minPrice: Number(ref.minPrice), maxPrice: Number(ref.maxPrice), source: ref.source, category: ref.category, price: Number(ref.minPrice) };

    // AI fallback: phân tích keywords để gợi ý khoảng giá
    const kw = name.toLowerCase();
    let minPrice = 50000;
    let maxPrice = 200000;
    let source = 'AI gợi ý (dựa trên từ khóa)';

    if (/\b(panadol|efferalgan|paracetamol|hapacol|tylenol)\b/.test(kw)) {
      minPrice = 15000; maxPrice = 50000;
      source = 'Giá trung bình thuốc giảm đau hạ sốt OTC';
    } else if (/\b(kháng sinh|amoxicillin|augmentin|azithromycin|cefixim)\b/.test(kw)) {
      minPrice = 20000; maxPrice = 150000;
      source = 'Giá trung bình thuốc kháng sinh OTC';
    } else if (/\b(omeprazole|nexium|antacit|gaviston|antiacid)\b/.test(kw)) {
      minPrice = 15000; maxPrice = 150000;
      source = 'Giá trung bình thuốc dạ dày OTC';
    } else if (/\b(glucosamine|canxi|calcium|xương khớp|khớp|chondroitin)\b/.test(kw)) {
      minPrice = 100000; maxPrice = 400000;
      source = 'Giá trung bình TPCN xương khớp';
    } else if (/\b(vitamin|omega|dha|epa)\b/.test(kw)) {
      minPrice = 80000; maxPrice = 350000;
      source = 'Giá trung bình TPCN vitamin & Omega';
    } else if (/\b(hoạt huyết|tuần hoàn|tim mạch|huyết áp|mỡ máu)\b/.test(kw)) {
      minPrice = 80000; maxPrice = 250000;
      source = 'Giá trung bình TPCN tim mạch';
    } else if (/\b(sâm|nhung|bổ thận|sinh lý)\b/.test(kw)) {
      minPrice = 150000; maxPrice = 500000;
      source = 'Giá trung bình TPCN bổ thận sinh lý';
    } else if (/\b(an thần|ngủ|mất ngủ|thần kinh|an thần)\b/.test(kw)) {
      minPrice = 80000; maxPrice = 200000;
      source = 'Giá trung bình TPCN an thần thần kinh';
    } else if (/\b(tiêu hóa|đại tràng|bao tử|gastro|probiotic)\b/.test(kw)) {
      minPrice = 60000; maxPrice = 150000;
      source = 'Giá trung bình TPCN tiêu hóa';
    } else if (/\b(giảm cân|detox|thanh lọc|thải độc)\b/.test(kw)) {
      minPrice = 100000; maxPrice = 300000;
      source = 'Giá trung bình TPCN giảm cân';
    } else if (/\b(trà|tea|thảo mộc|herbal)\b/.test(kw)) {
      minPrice = 40000; maxPrice = 120000;
      source = 'Giá trung bình trà thảo mộc';
    }

    return { found: false, name, minPrice, maxPrice, price: minPrice, source };
  }

  // --- PRODUCT ATTRIBUTE VALUES (EAV) ---

  @Post(':id/attributes')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật giá trị thuộc tính sản phẩm (EAV, admin)' })
  upsertAttributeValue(@Param('id') id: string, @Body() dto: UpsertProductAttributeValueDto) {
    return this.productService.upsertAttributeValue(id, dto);
  }

  @Delete(':id/attributes/:attributeId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xoá giá trị thuộc tính sản phẩm (admin)' })
  removeAttributeValue(@Param('id') id: string, @Param('attributeId') attributeId: string) {
    return this.productService.removeAttributeValue(id, attributeId);
  }
}
