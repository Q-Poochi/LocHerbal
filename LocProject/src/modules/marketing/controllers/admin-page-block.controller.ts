import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PageBlockService } from '../services/page-block.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import {
  CreatePageBlockDto,
  UpdatePageBlockDto,
  ReorderPageBlocksDto,
} from '../dto/page-block.dto';

/**
 * Các thao tác tạo/sửa/xoá/reorder block — CHỈ ADMIN.
 */
@ApiTags('Marketing')
@ApiBearerAuth()
@Controller('admin/pages/:pageSlug/blocks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminPageBlockController {
  constructor(private readonly pageBlockService: PageBlockService) { }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Tạo block mới cho trang' })
  create(@Param('pageSlug') pageSlug: string, @Body() dto: CreatePageBlockDto) {
    return this.pageBlockService.create(pageSlug, dto.type, dto.content);
  }

  @Patch('reorder')
  @Roles('admin')
  @ApiOperation({ summary: 'Cập nhật thứ tự blocks (kéo-thả)' })
  reorder(@Param('pageSlug') pageSlug: string, @Body() dto: ReorderPageBlocksDto) {
    return this.pageBlockService.reorder(pageSlug, dto.items);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Cập nhật block (content / publish)' })
  update(@Param('id') id: string, @Body() dto: UpdatePageBlockDto) {
    return this.pageBlockService.update(id, {
      content: dto.content,
      isPublished: dto.isPublished,
    });
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Xoá block' })
  remove(@Param('id') id: string) {
    return this.pageBlockService.remove(id);
  }
}