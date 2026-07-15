import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, UpsertProductAttributeValueDto } from '../dto/product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.$transaction(async (prisma) => {
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
              optionValues: variant.optionValues || {},
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
  }

  async findAll() {
    return this.prisma.product.findMany({
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
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
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

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    if (dto.slug) {
      const existing = await this.prisma.product.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      });
      if (existing) {
        throw new BadRequestException('Slug sản phẩm đã tồn tại');
      }
    }

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
      if (!category) {
        throw new NotFoundException('Danh mục không tồn tại');
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: {
        images: true,
        variants: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
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

    return this.prisma.productAttributeValue.upsert({
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

    return this.prisma.productAttributeValue.delete({
      where: {
        productId_attributeId: {
          productId,
          attributeId,
        },
      },
    });
  }
}
