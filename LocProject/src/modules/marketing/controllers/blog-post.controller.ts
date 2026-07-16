import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { BlogPostService } from '../services/blog-post.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { CreateBlogPostDto, UpdateBlogPostDto } from '../dto/blog-post.dto';

@Controller('marketing/blog-posts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BlogPostController {
    constructor(private readonly blogPostService: BlogPostService) { }

    @Get()
    @Roles('admin', 'staff')
    findAll() {
        return this.blogPostService.findAll();
    }

    @Get(':id')
    @Roles('admin', 'staff')
    findOne(@Param('id') id: string) {
        return this.blogPostService.findById(id);
    }

    @Get('slug/:slug')
    @Roles('admin', 'staff')
    findBySlug(@Param('slug') slug: string) {
        return this.blogPostService.findBySlug(slug);
    }

    @Post()
    @Roles('admin')
    create(@Body() createBlogPostDto: CreateBlogPostDto) {
        return this.blogPostService.create(createBlogPostDto);
    }

    @Patch(':id')
    @Roles('admin')
    update(@Param('id') id: string, @Body() updateBlogPostDto: UpdateBlogPostDto) {
        return this.blogPostService.update(id, updateBlogPostDto);
    }

    @Delete(':id')
    @Roles('admin')
    remove(@Param('id') id: string) {
        return this.blogPostService.remove(id);
    }
}