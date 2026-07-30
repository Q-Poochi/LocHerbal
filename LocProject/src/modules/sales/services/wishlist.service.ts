import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureWishlist(customerId: string) {
    let wishlist = await this.prisma.wishlist.findUnique({ where: { customerId } });
    if (!wishlist) {
      wishlist = await this.prisma.wishlist.create({ data: { customerId } });
    }
    return wishlist;
  }

  async getItems(customerId: string) {
    const wishlist = await this.ensureWishlist(customerId);
    return this.prisma.wishlistItem.findMany({
      where: { wishlistId: wishlist.id },
      include: {
        variant: {
          include: {
            product: { select: { id: true, name: true, slug: true, thumbnailUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addItem(customerId: string, productVariantId: string) {
    const wishlist = await this.ensureWishlist(customerId);
    const variant = await this.prisma.productVariant.findUnique({ where: { id: productVariantId } });
    if (!variant) throw new NotFoundException('Biến thể sản phẩm không tồn tại');

    const existing = await this.prisma.wishlistItem.findUnique({
      where: { wishlistId_productVariantId: { wishlistId: wishlist.id, productVariantId } },
    });
    if (existing) throw new ConflictException('Sản phẩm đã có trong danh sách yêu thích');

    return this.prisma.wishlistItem.create({
      data: { wishlistId: wishlist.id, productVariantId },
      include: {
        variant: {
          include: {
            product: { select: { id: true, name: true, slug: true, thumbnailUrl: true } },
          },
        },
      },
    });
  }

  async removeItem(customerId: string, productVariantId: string) {
    const wishlist = await this.ensureWishlist(customerId);
    const item = await this.prisma.wishlistItem.findUnique({
      where: { wishlistId_productVariantId: { wishlistId: wishlist.id, productVariantId } },
    });
    if (!item) throw new NotFoundException('Sản phẩm không có trong danh sách yêu thích');
    await this.prisma.wishlistItem.delete({ where: { id: item.id } });
  }
}
