import { SkipThrottle } from '@nestjs/throttler';
import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoryService } from '../services/category.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import { CreateAttributeDefinitionDto } from '../dto/attribute.dto';
import { Public } from '../../core/decorators/public.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { RolesGuard } from '../../core/guards/roles.guard';
import { PaginationDto } from '../../../shared/dto/pagination.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) { }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo danh mục mới (admin)' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  @Public()
  @SkipThrottle()
  @Get()
  @ApiOperation({ summary: 'Danh sách danh mục (có phân trang)' })
  findAll(@Query() pagination?: PaginationDto) {
    return this.categoryService.findAll(pagination);
  }

  @Public()
  @SkipThrottle()
  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết danh mục theo id' })
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật danh mục (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xoá danh mục (admin)' })
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }

  // --- ATTRIBUTE DEFINITIONS ---

  @Post(':id/attributes')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thêm thuộc tính động cho danh mục (admin)' })
  addAttribute(@Param('id') id: string, @Body() dto: CreateAttributeDefinitionDto) {
    return this.categoryService.addAttribute(id, dto);
  }

  @Public()
  @Get(':id/attributes')
  @ApiOperation({ summary: 'Danh sách thuộc tính của danh mục' })
  getAttributes(@Param('id') id: string) {
    return this.categoryService.getAttributes(id);
  }

  @Delete(':id/attributes/:attributeId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xoá thuộc tính của danh mục (admin)' })
  removeAttribute(@Param('id') id: string, @Param('attributeId') attributeId: string) {
    return this.categoryService.removeAttribute(id, attributeId);
  }
}
