import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus, NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../core/decorators/user.decorator';
import { Public } from '../../core/decorators/public.decorator';
import { ReviewService } from '../services/review.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewController {
  constructor(
    private readonly reviewService: ReviewService,
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post(':productId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo đánh giá cho sản phẩm' })
  async create(
    @Param('productId') productId: string,
    @User('userId') userId: string,
    @Body() body: { rating: number; comment?: string },
  ) {
    const customer = await this.getCustomer(userId);
    return this.reviewService.create(productId, customer.id, body.rating, body.comment);
  }

  @Get(':productId')
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách đánh giá theo sản phẩm' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findByProduct(
    @Param('productId') productId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.reviewService.findByProduct(productId, +page, +limit);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật đánh giá' })
  async update(
    @Param('id') id: string,
    @User('userId') userId: string,
    @Body() body: { rating: number; comment?: string },
  ) {
    const customer = await this.getCustomer(userId);
    return this.reviewService.update(id, customer.id, body.rating, body.comment);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xoá đánh giá' })
  async remove(@Param('id') id: string, @User('userId') userId: string) {
    const customer = await this.getCustomer(userId);
    await this.reviewService.remove(id, customer.id);
  }

  private async getCustomer(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { customer: true },
    });
    if (!user?.customer) throw new NotFoundException('Không tìm thấy thông tin khách hàng');
    return user.customer;
  }
}
