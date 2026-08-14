import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { BannerService } from './services/banner.service';
import { BannerController } from './controllers/banner.controller';
import { HeroBannerController, AdminHeroBannerController, PublicBannersController } from './controllers/hero-banner.controller';
import { CouponService } from './services/coupon.service';
import { CouponController } from './controllers/coupon.controller';
import { BlogPostService } from './services/blog-post.service';
import { BlogPostController } from './controllers/blog-post.controller';
import { PublicMarketingController } from './controllers/public-marketing.controller';
import { PageBlockService } from './services/page-block.service';
import { PageBlockController } from './controllers/page-block.controller';
import { AdminPageBlockController } from './controllers/admin-page-block.controller';

@Module({
  imports: [PrismaModule],
  controllers: [BannerController, HeroBannerController, AdminHeroBannerController, PublicBannersController, CouponController, BlogPostController, PublicMarketingController, PageBlockController, AdminPageBlockController],
  providers: [BannerService, CouponService, BlogPostService, PageBlockService],
  exports: [BannerService, CouponService, BlogPostService, PageBlockService],
})
export class MarketingModule { }