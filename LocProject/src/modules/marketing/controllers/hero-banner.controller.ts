import { Controller, Get, Put, Delete, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BannerService } from '../services/banner.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { Public } from '../../core/decorators/public.decorator';
import { UpsertHeroBannerDto } from '../dto/hero-banner.dto';

/**
 * ⚠️ CAROUSEL BANNERS — endpoint RIÊNG cho khu vực carousel (position='home').
 * Lọc the position Ở BACKEND (query param), không trả tất cả rồi tự lọc ở frontend.
 * - GET /banners?position=home → mảng slide carousel (KHÔNG chứa position='hero')
 */
@ApiTags('Marketing / Banners (public)')
@Controller('banners')
export class PublicBannersController {
    constructor(private readonly bannerService: BannerService) { }

    @Public()
    @Get()
    @ApiOperation({ summary: 'Banner theo position — filter ở backend (vd ?position=home)' })
    async getBanners(@Query('position') position?: string) {
        if (position === 'home') {
            return this.bannerService.getCarouselBanners();
        }
        if (position === 'hero') {
            // Cho an toàn: nếu ai đó query hero, trả đúng hàm hero (1 object) để không lẫn logic.
            return this.bannerService.getHeroBanner();
        }
        return this.bannerService.findAll(position);
    }
}

/**
 * ⚠️ HERO BANNER — endpoint RIÊNG, KHÔNG lẫn vào /banners (carousel).
 * - GET  /hero-banner       → 1 object (hoặc null) — KHÔNG PHẢI mảng
 * - PUT  /admin/hero-banner → admin set/update (CHỈ 1 bản ghi duy nhất)
 * - DELETE /admin/hero-banner → xoá ảnh hero, về icon chày cối
 */
@ApiTags('Marketing / Hero Banner')
@Controller('hero-banner')
export class HeroBannerController {
    constructor(private readonly bannerService: BannerService) { }

    @Public()
    @Get()
    @ApiOperation({ summary: 'Hero banner (1 object hoặc null, không phải mảng)' })
    async getHeroBanner() {
        return this.bannerService.getHeroBanner();
    }
}

@ApiTags('Marketing / Hero Banner (admin)')
@ApiBearerAuth()
@Controller('admin/hero-banner')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminHeroBannerController {
    constructor(private readonly bannerService: BannerService) { }

    @Put()
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Set/update hero banner (chỉ 1 bản ghi duy nhất)' })
    async upsertHeroBanner(@Body() dto: UpsertHeroBannerDto) {
        return this.bannerService.upsertHeroBanner(dto);
    }

    @Delete()
    @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Xoá hero banner — khối Hero về fallback icon' })
    async removeHeroBanner() {
        return this.bannerService.removeHeroBanner();
    }
}