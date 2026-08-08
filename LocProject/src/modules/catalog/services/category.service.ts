import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import { CreateAttributeDefinitionDto } from '../dto/attribute.dto';
import { PaginationDto, PaginatedResponse } from '../../../shared/dto/pagination.dto';
import { clearCacheByPrefix } from '../../../shared/cache/cache.util';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: any,
  ) { }

  private readonly inflight = new Map<string, Promise<any>>();

  private async singleFlightCache(cacheKey: string, ttlMs: number, loader: () => Promise<any>): Promise<any> {
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }
    const existing = this.inflight.get(cacheKey);
    if (existing) {
      return existing;
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

  async findAll(pagination?: PaginationDto): Promise<PaginatedResponse<any>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;

    const cacheKey = `catalog:categories:page=${page}:limit=${limit}`;
    return this.singleFlightCache(cacheKey, 3_600_000, async () => {
      const [data, total] = await Promise.all([
        this.prisma.category.findMany({
          skip: (page - 1) * limit,
          take: limit,
          include: {
            children: true,
            attributes: true,
          },
        }),
        this.prisma.category.count(),
      ]);

      return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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

    await this.prisma.category.update({
      where: { id },
      data: dto,
    });

    await this.clearCategoryListCache();
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.category.delete({ where: { id } });
    await this.clearCategoryListCache();
  }

  private async clearCategoryListCache() {
    try {
      await clearCacheByPrefix(this.cacheManager, 'catalog:categories:');
    } catch {
      // cache invalidation failure must not break the write path
    }
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
