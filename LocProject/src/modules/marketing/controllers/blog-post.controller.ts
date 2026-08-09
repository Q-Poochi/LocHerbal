import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BlogPostService } from '../services/blog-post.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { CreateBlogPostDto, UpdateBlogPostDto } from '../dto/blog-post.dto';

@ApiTags('Marketing')
@ApiBearerAuth()
@Controller('marketing/blog-posts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BlogPostController {
    constructor(private readonly blogPostService: BlogPostService) { }

    @Get()
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Danh sách bài viết blog (admin — gồm cả draft)' })
    findAll() {
        return this.blogPostService.findAllAdmin();
    }

    @Get('slug/:slug')
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Tìm bài viết theo slug' })
    findBySlug(@Param('slug') slug: string) {
        return this.blogPostService.findBySlug(slug);
    }

    @Get(':id')
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Chi tiết bài viết' })
    findOne(@Param('id') id: string) {
        return this.blogPostService.findById(id);
    }

    @Post()
    @Roles('admin')
    @ApiOperation({ summary: 'Tạo bài viết mới' })
    create(@Body() createBlogPostDto: CreateBlogPostDto) {
        return this.blogPostService.create(createBlogPostDto);
    }

    @Patch(':id')
    @Roles('admin')
    @ApiOperation({ summary: 'Cập nhật bài viết' })
    update(@Param('id') id: string, @Body() updateBlogPostDto: UpdateBlogPostDto) {
        return this.blogPostService.update(id, updateBlogPostDto);
    }

    @Delete(':id')
    @Roles('admin')
    @ApiOperation({ summary: 'Xoá bài viết' })
    remove(@Param('id') id: string) {
        return this.blogPostService.remove(id);
    }
}