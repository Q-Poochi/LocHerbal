import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, UpsertProductAttributeValueDto } from '../dto/product.dto';
import { clearCacheByPrefix } from '../../../shared/cache/cache.util';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: any,
  ) {
  }

  private readonly inflight = new Map<string, Promise<any>>();

  private async singleFlightCache<T>(cacheKey: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as T;
    }
    const existing = this.inflight.get(cacheKey);
    if (existing) {
      return existing as Promise<T>;
    }
    const p = (async () => {
      const result = await loader();
      try {
        await this.cacheManager.set(cacheKey, result, ttlMs);
      } catch {
        // cache write failure must not break the response
      }
      return result;
    })();
    this.inflight.set(cacheKey, p);
    try {
      return await p;
    } finally {
      if (this.inflight.get(cacheKey) === p) {
        this.inflight.delete(cacheKey);
      }
    }
  }

  async create(dto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new BadRequestException('Slug sản phẩm đã tồn tại');
    }

    // Validate category
    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    const created = await this.prisma.$transaction(async (prisma) => {
      // 1. Tạo Product
      const product = await prisma.product.create({
        data: {
          categoryId: dto.categoryId,
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          thumbnailUrl: dto.thumbnailUrl,
          isPublished: dto.isPublished || false,
        },
      });

      // 2. Tạo hình ảnh đính kèm
      if (dto.images && dto.images.length > 0) {
        await prisma.productImage.createMany({
          data: dto.images.map((url, index) => ({
            productId: product.id,
            url,
            sortOrder: index,
          })),
        });
      }

      // 3. Tạo các Variants đi kèm
      if (dto.variants && dto.variants.length > 0) {
        for (const variant of dto.variants) {
          const varExisting = await prisma.productVariant.findUnique({ where: { sku: variant.sku } });
          if (varExisting) {
            throw new BadRequestException(`SKU "${variant.sku}" đã được sử dụng`);
          }
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              sku: variant.sku,
              name: variant.name || dto.name,
              price: variant.price,
              compareAtPrice: variant.compareAtPrice,
              optionValues: variant.optionValues || { size: variant.name || dto.name },
            },
          });
        }
      }

      return prisma.product.findUnique({
        where: { id: product.id },
        include: {
          images: true,
          variants: true,
          category: true,
        },
      });
    });
    await this.clearProductListCache();
    return created;
  }

  async findAll(params?: {
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: 'popular' | 'price_asc' | 'price_desc' | 'newest';
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const {
      categoryId,
      minPrice,
      maxPrice,
      sort = 'popular',
      page = 1,
      limit = 12,
      search,
    } = params || {};

    const cacheKey = `catalog:products:${JSON.stringify({
      categoryId,
      minPrice,
      maxPrice,
      sort,
      page,
      limit,
      search,
    })}`;

    return this.singleFlightCache(cacheKey, 900_000, async () => {
      // Build where clause for filtering
      const where: any = {
      isPublished: true,
    };

    // Support both UUID and slug for categoryId
    if (categoryId) {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidPattern.test(categoryId)) {
        where.categoryId = categoryId;
      } else {
        // Treat as slug - lookup category first
        const category = await this.prisma.category.findUnique({
          where: { slug: categoryId },
          select: { id: true },
        });
        if (category) {
          where.categoryId = category.id;
        } else {
          // Category not found, return empty results
          return [];
        }
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    // Build orderBy for sorting
    let orderBy: any = { createdAt: 'desc' };
    switch (sort) {
      case 'price_asc':
        orderBy = { variants: { _min: { price: 'asc' } } };
        break;
      case 'price_desc':
        orderBy = { variants: { _min: { price: 'desc' } } };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'popular':
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Price filter via variants relation
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.variants = {
        some: {
          ...(minPrice !== undefined && { price: { gte: minPrice } }),
          ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
        },
      };
    }

    const products = await this.prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        images: true,
        variants: true,
        category: true,
        attributeValues: {
          include: {
            attribute: true,
          },
        },
      },
    });

    const totalCount = await this.prisma.product.count({ where });

      return {
        data: products,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        page,
        limit,
      };
    });
  }

  private async getSoldCount(productId: string): Promise<number> {
    const agg = await this.prisma.orderItem.aggregate({
      _sum: { qty: true },
      where: { variant: { productId } },
    });
    return agg._sum.qty || 0;
  }

  private transformProductDetail(product: any, soldCount: number) {
    // Transform variants to include stock from StockItem
    const variantsWithStock = (product.variants || []).map((variant: any) => ({
      ...variant,
      stock: variant.stockItems?.reduce((sum: number, item: any) => sum + (item.qtyOnHand || 0), 0) || 0,
    }));

    // Transform attributeValues to specifications
    const specifications = (product.attributeValues || []).map((av: any) => ({
      label: av.attribute?.label || av.attribute?.key || 'Thuộc tính',
      value: av.value,
    }));

    // Benefits derived trực tiếp từ description — không bịa
    const benefits = product.description ?
      product.description.split('. ').filter((s: string) => s.length > 0).slice(0, 4) :
      [];

    // Rating/reviewCount tính từ reviews thật
    const reviews: Array<{ rating: number }> = product.reviews || [];
    const reviewCount = reviews.length;
    const rating = reviewCount > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
      : 0;

    const detail: any = {
      ...product,
      variants: variantsWithStock,
      ingredients: product.description || '',
      specifications,
      benefits,
    };

    // Chỉ đính kèm dữ liệu đánh giá khi có dữ liệu THẬT — không có review/đơn hàng thì ẩn field đi.
    if (reviewCount > 0) {
      detail.rating = rating;
      detail.reviewCount = reviewCount;
    }
    if (soldCount > 0) {
      detail.soldCount = soldCount;
    }
    return detail;
  }

  async findBySlug(slug: string) {
    const detailCacheKey = `catalog:product:${slug}`;
    return this.singleFlightCache(detailCacheKey, 900_000, async () => {
      const product = await this.prisma.product.findUnique({
        where: { slug },
        include: {
          category: true,
          variants: {
            include: {
              stockItems: true,
            },
          },
          images: true,
          attributeValues: {
            include: {
              attribute: true,
            },
          },
          reviews: { select: { rating: true } },
        },
      });
      if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
      const soldCount = await this.getSoldCount(product.id);
      return this.transformProductDetail(product, soldCount);
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        variants: {
          include: {
            stockItems: true,
          },
        },
        category: true,
        attributeValues: {
          include: {
            attribute: true,
          },
        },
        reviews: { select: { rating: true } },
      },
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }
    const soldCount = await this.getSoldCount(product.id);
    return this.transformProductDetail(product, soldCount);
  }

  async update(id: string, dto: UpdateProductDto) {
    const existingProduct = await this.findOne(id);

    if (dto.slug) {
      const slugExists = await this.prisma.product.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      });
      if (slugExists) {
        throw new BadRequestException('Slug sản phẩm đã tồn tại');
      }
    }

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
      if (!category) {
        throw new NotFoundException('Danh mục không tồn tại');
      }
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: dto,
      include: {
        images: true,
        variants: true,
      },
    });

    await this.cacheManager.del(`catalog:product:${existingProduct.slug}`);
    await this.clearProductListCache();

    return updated;
  }

  async remove(id: string) {
    const existingProduct = await this.findOne(id);
    await this.prisma.product.delete({ where: { id } });
    await this.cacheManager.del(`catalog:product:${existingProduct.slug}`);
    await this.clearProductListCache();
  }

  private async clearProductListCache() {
    try {
      await clearCacheByPrefix(this.cacheManager, 'catalog:products:');
    } catch {
      // cache invalidation failure must not break the write path
    }
  }

  // --- QUẢN LÝ THUỘC TÍNH ĐỘNG EAV (Product Attribute Values) ---

  async upsertAttributeValue(productId: string, dto: UpsertProductAttributeValueDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    const attribute = await this.prisma.attributeDefinition.findUnique({
      where: { id: dto.attributeId },
    });
    if (!attribute) {
      throw new NotFoundException('Không tìm thấy định nghĩa thuộc tính');
    }

    // Yêu cầu quan trọng từ người dùng: validate attributeId phải thuộc đúng categoryId của product
    if (attribute.categoryId !== product.categoryId) {
      throw new BadRequestException('Thuộc tính này không thuộc danh mục (Category) của sản phẩm');
    }

    const result = await this.prisma.productAttributeValue.upsert({
      where: {
        productId_attributeId: {
          productId,
          attributeId: dto.attributeId,
        },
      },
      update: {
        value: dto.value,
      },
      create: {
        productId,
        attributeId: dto.attributeId,
        value: dto.value,
      },
      include: {
        attribute: true,
      },
    });
    await this.clearProductListCache();
    return result;
  }

  async removeAttributeValue(productId: string, attributeId: string) {
    const existing = await this.prisma.productAttributeValue.findUnique({
      where: {
        productId_attributeId: {
          productId,
          attributeId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Sản phẩm không có giá trị thuộc tính này');
    }

    const result = await this.prisma.productAttributeValue.delete({
      where: {
        productId_attributeId: {
          productId,
          attributeId,
        },
      },
    });
    await this.clearProductListCache();
    return result;
  }
}