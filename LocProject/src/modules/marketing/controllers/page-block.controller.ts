import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PageBlockService } from '../services/page-block.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { Public } from '../../core/decorators/public.decorator';

@ApiTags('Marketing')
@Controller()
export class PageBlockController {
  constructor(private readonly pageBlockService: PageBlockService) { }

  /**
   * Public: blocks đã publish cho storefront — GET /pages/ve-chung-toi/blocks
   */
  @Public()
  @Get('pages/:pageSlug/blocks')
  @ApiOperation({ summary: 'Blocks đã publish của một trang (public)' })
  findPublished(@Param('pageSlug') pageSlug: string) {
    return this.pageBlockService.findPublished(pageSlug);
  }

  /**
   * Admin: toàn bộ blocks (kể cả chưa publish) — GET /admin/pages/ve-chung-toi/blocks
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('admin/pages/:pageSlug/blocks')
  @Roles('admin')
  @ApiOperation({ summary: 'Tất cả blocks của một trang (admin)' })
  findAll(@Param('pageSlug') pageSlug: string) {
    return this.pageBlockService.findAll(pageSlug);
  }
}