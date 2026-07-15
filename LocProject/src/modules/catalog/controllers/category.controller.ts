import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import { CreateAttributeDefinitionDto } from '../dto/attribute.dto';
import { Public } from '../../core/decorators/public.decorator';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
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
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }

  // --- ATTRIBUTE DEFINITIONS ---

  @Post(':id/attributes')
  addAttribute(@Param('id') id: string, @Body() dto: CreateAttributeDefinitionDto) {
    return this.categoryService.addAttribute(id, dto);
  }

  @Public()
  @Get(':id/attributes')
  getAttributes(@Param('id') id: string) {
    return this.categoryService.getAttributes(id);
  }

  @Delete(':id/attributes/:attributeId')
  removeAttribute(@Param('id') id: string, @Param('attributeId') attributeId: string) {
    return this.categoryService.removeAttribute(id, attributeId);
  }
}
