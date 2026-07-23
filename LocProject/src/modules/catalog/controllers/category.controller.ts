import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import { CreateAttributeDefinitionDto } from '../dto/attribute.dto';
import { Public } from '../../core/decorators/public.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { RolesGuard } from '../../core/guards/roles.guard';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) { }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  @Public()
  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }

  // --- ATTRIBUTE DEFINITIONS ---

  @Post(':id/attributes')
  @UseGuards(RolesGuard)
  @Roles('admin')
  addAttribute(@Param('id') id: string, @Body() dto: CreateAttributeDefinitionDto) {
    return this.categoryService.addAttribute(id, dto);
  }

  @Public()
  @Get(':id/attributes')
  getAttributes(@Param('id') id: string) {
    return this.categoryService.getAttributes(id);
  }

  @Delete(':id/attributes/:attributeId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  removeAttribute(@Param('id') id: string, @Param('attributeId') attributeId: string) {
    return this.categoryService.removeAttribute(id, attributeId);
  }
}
