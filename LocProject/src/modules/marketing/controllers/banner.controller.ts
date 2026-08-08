import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BannerService } from '../services/banner.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { CreateBannerDto, UpdateBannerDto } from '../dto/banner.dto';

@ApiTags('Marketing')
@ApiBearerAuth()
@Controller('marketing/banners')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BannerController {
    constructor(private readonly bannerService: BannerService) { }

    @Get()
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Danh sách banner (lọc theo vị trí)' })
    findAll(@Request() req: any) {
        const position = req.query.position as string | undefined;
        return this.bannerService.findAll(position);
    }

    @Get(':id')
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Chi tiết banner' })
    findOne(@Param('id') id: string) {
        return this.bannerService.findById(id);
    }

    @Post()
    @Roles('admin')
    @ApiOperation({ summary: 'Tạo banner mới' })
    create(@Body() createBannerDto: CreateBannerDto) {
        return this.bannerService.create(createBannerDto);
    }

    @Patch(':id')
    @Roles('admin')
    @ApiOperation({ summary: 'Cập nhật banner' })
    update(@Param('id') id: string, @Body() updateBannerDto: UpdateBannerDto) {
        return this.bannerService.update(id, updateBannerDto);
    }

    @Delete(':id')
    @Roles('admin')
    @ApiOperation({ summary: 'Xoá banner' })
    remove(@Param('id') id: string) {
        return this.bannerService.remove(id);
    }
}