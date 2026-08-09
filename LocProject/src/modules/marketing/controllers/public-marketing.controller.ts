import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../core/decorators/public.decorator';
import { BannerService } from '../services/banner.service';
import { BlogPostService } from '../services/blog-post.service';
import { CouponService } from '../services/coupon.service';

/**
 * Endpoints PUBLIC cho storefront — KHÔNG cần JWT.
 * Homepage gọi các API này để render banner, bài viết mới nhất, mã giảm giá.
 */
@ApiTags('Marketing / Public')
@Controller('public/marketing')
export class PublicMarketingController {
    constructor(
        private readonly bannerService: BannerService,
        private readonly blogPostService: BlogPostService,
        private readonly couponService: CouponService,
    ) { }

    @Public()
    @Get('banners')
    @ApiOperation({ summary: 'Danh sách banner active (public storefront)' })
    async banners() {
        return this.bannerService.findAll();
    }

    @Public()
    @Get('blog-posts')
    @ApiOperation({ summary: 'Bài viết đã xuất bản (public storefront)' })
    async blogPosts() {
        const posts = await this.blogPostService.findAll(true);
        return posts.slice(0, 6);
    }

    @Public()
    @Get('coupons/active')
    @ApiOperation({ summary: 'Mã giảm giá đang hoạt động (public storefront)' })
    async activeCoupons() {
        return this.couponService.findAllActive();
    }
}