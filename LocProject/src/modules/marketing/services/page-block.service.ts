import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { DEFAULT_BLOCK_CONTENT, PageBlockType } from '../dto/page-block.dto';

@Injectable()
export class PageBlockService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Blocks đã publish cho storefront, sort theo order.
   */
  async findPublished(page: string) {
    return this.prisma.pageBlock.findMany({
      where: { page, isPublished: true },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * TẤT CẢ blocks (kể cả chưa publish) cho admin.
   */
  async findAll(page: string) {
    return this.prisma.pageBlock.findMany({
      where: { page },
      orderBy: { order: 'asc' },
    });
  }

  async findById(id: string) {
    const block = await this.prisma.pageBlock.findUnique({ where: { id } });
    if (!block) {
      throw new NotFoundException('Block không tồn tại');
    }
    return block;
  }

  /**
   * Tạo block mới: content mặc định theo type, order = cuối danh sách.
   */
  async create(page: string, type: PageBlockType, content?: Record<string, unknown>) {
    const maxOrder = await this.prisma.pageBlock.aggregate({
      where: { page },
      _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    const mergedContent = { ...(DEFAULT_BLOCK_CONTENT[type] as Record<string, unknown>), ...(content || {}) };

    return this.prisma.pageBlock.create({
      data: { page, type, order: nextOrder, content: mergedContent as Prisma.InputJsonValue },
    });
  }

  /**
   * Cập nhật content hoặc toggle publish.
   */
  async update(id: string, data: { content?: Record<string, unknown>; isPublished?: boolean }) {
    const existing = await this.findById(id);

    const mergedContent = data.content
      ? { ...(existing.content as Record<string, unknown>), ...data.content }
      : existing.content;

    return this.prisma.pageBlock.update({
      where: { id },
      data: {
        content: mergedContent as Prisma.InputJsonValue,
        ...(data.isPublished !== undefined ? { isPublished: data.isPublished } : {}),
      },
    });
  }

  /**
   * Cập nhật thứ tự hàng loạt trong 1 transaction (kéo-thả auto-save).
   */
  async reorder(page: string, items: { id: string; order: number }[]) {
    if (!items || items.length === 0) {
      throw new BadRequestException('Danh sách thứ tự trống');
    }

    // Chặn truy cập block thuộc trang khác (chống IDOR): xác minh toàn bộ id thuộc page.
    const ids = items.map((i) => i.id);
    const blocks = await this.prisma.pageBlock.findMany({ where: { page, id: { in: ids } }, select: { id: true } });
    const blockIds = new Set(blocks.map((b) => b.id));
    for (const i of items) {
      if (!blockIds.has(i.id)) {
        throw new BadRequestException(`Block ${i.id} không thuộc trang ${page}`);
      }
    }

    return this.prisma.$transaction(
      items.map((i) =>
        this.prisma.pageBlock.update({ where: { id: i.id }, data: { order: i.order } }),
      ),
    );
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.pageBlock.delete({ where: { id } });
    return { success: true };
  }
}