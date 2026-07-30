import {
  Controller, Get, Post, Delete, Body, Param, UseGuards, HttpCode, HttpStatus, NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../core/decorators/user.decorator';
import { WishlistService } from '../services/wishlist.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@ApiTags('Wishlist')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@Controller('wishlist')
export class WishlistController {
  constructor(
    private readonly wishlistService: WishlistService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách yêu thích' })
  async getItems(@User('userId') userId: string) {
    const customer = await this.getCustomer(userId);
    return this.wishlistService.getItems(customer.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Thêm sản phẩm vào danh sách yêu thích' })
  async addItem(@User('userId') userId: string, @Body() body: { productVariantId: string }) {
    const customer = await this.getCustomer(userId);
    return this.wishlistService.addItem(customer.id, body.productVariantId);
  }

  @Delete(':productVariantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xoá sản phẩm khỏi danh sách yêu thích' })
  async removeItem(@User('userId') userId: string, @Param('productVariantId') productVariantId: string) {
    const customer = await this.getCustomer(userId);
    await this.wishlistService.removeItem(customer.id, productVariantId);
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
