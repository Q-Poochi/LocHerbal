import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import { CreateAttributeDefinitionDto } from '../dto/attribute.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new BadRequestException('Slug danh mục đã tồn tại');
    }

    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: dto.parentId } });
      if (!parent) {
        throw new NotFoundException('Danh mục cha không tồn tại');
      }
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        parentId: dto.parentId,
        description: dto.description,
        imageUrl: dto.imageUrl,
      },
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      include: {
        children: true,
        attributes: true,
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        attributes: true,
        parent: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);

    if (dto.slug) {
      const existing = await this.prisma.category.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      });
      if (existing) {
        throw new BadRequestException('Slug danh mục đã tồn tại');
      }
    }

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('Danh mục cha không thể là chính nó');
      }
      const parent = await this.prisma.category.findUnique({ where: { id: dto.parentId } });
      if (!parent) {
        throw new NotFoundException('Danh mục cha không tồn tại');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.category.delete({ where: { id } });
  }

  // --- QUẢN LÝ THUỘC TÍNH ĐỘNG (Attribute Definitions) ---

  async addAttribute(categoryId: string, dto: CreateAttributeDefinitionDto) {
    await this.findOne(categoryId);

    const existing = await this.prisma.attributeDefinition.findUnique({
      where: {
        categoryId_key: {
          categoryId,
          key: dto.key,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(`Thuộc tính với key "${dto.key}" đã tồn tại trong danh mục này`);
    }

    return this.prisma.attributeDefinition.create({
      data: {
        categoryId,
        key: dto.key,
        label: dto.label,
        dataType: dto.dataType,
        isRequired: dto.isRequired || false,
        options: dto.options ? dto.options : undefined,
      },
    });
  }

  async getAttributes(categoryId: string) {
    await this.findOne(categoryId);
    return this.prisma.attributeDefinition.findMany({
      where: { categoryId },
    });
  }

  async removeAttribute(categoryId: string, attributeId: string) {
    const attribute = await this.prisma.attributeDefinition.findFirst({
      where: { id: attributeId, categoryId },
    });

    if (!attribute) {
      throw new NotFoundException('Thuộc tính không tồn tại trong danh mục này');
    }

    return this.prisma.attributeDefinition.delete({
      where: { id: attributeId },
    });
  }
}
