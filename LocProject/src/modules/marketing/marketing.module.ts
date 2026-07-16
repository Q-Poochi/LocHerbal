import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { BannerService } from './services/banner.service';
import { BannerController } from './controllers/banner.controller';
import { CouponService } from './services/coupon.service';
import { CouponController } from './controllers/coupon.controller';
import { BlogPostService } from './services/blog-post.service';
import { BlogPostController } from './controllers/blog-post.controller';

@Module({
  imports: [PrismaModule],
  controllers: [BannerController, CouponController, BlogPostController],
  providers: [BannerService, CouponService, BlogPostService],
  exports: [BannerService, CouponService, BlogPostService],
})
export class MarketingModule { }