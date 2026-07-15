import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateCart(customerId?: string, sessionId?: string) {
    if (!customerId && !sessionId) {
      throw new Error('Yêu cầu customerId hoặc sessionId để lấy giỏ hàng');
    }

    if (customerId) {
      let cart = await this.prisma.cart.findFirst({
        where: { customerId },
        include: { items: { include: { variant: true } } },
      });

      if (!cart) {
        cart = await this.prisma.cart.create({
          data: { customerId },
          include: { items: { include: { variant: true } } },
        });
      }
      return cart;
    } else {
      let cart = await this.prisma.cart.findFirst({
        where: { sessionId },
        include: { items: { include: { variant: true } } },
      });

      if (!cart) {
        cart = await this.prisma.cart.create({
          data: { sessionId },
          include: { items: { include: { variant: true } } },
        });
      }
      return cart;
    }
  }

  async addToCart(cartId: string, productVariantId: string, qty: number) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: productVariantId },
    });

    if (!variant) {
      throw new NotFoundException('Không tìm thấy variant sản phẩm');
    }

    const existingItem = await this.prisma.cartItem.findUnique({
      where: { cartId_productVariantId: { cartId, productVariantId } },
    });

    if (existingItem) {
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { qty: existingItem.qty + qty },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        cartId,
        productVariantId,
        qty,
        priceSnapshot: variant.price,
      },
    });
  }

  async removeItem(cartId: string, productVariantId: string) {
    const existingItem = await this.prisma.cartItem.findUnique({
      where: { cartId_productVariantId: { cartId, productVariantId } },
    });

    if (!existingItem) {
      throw new NotFoundException('Sản phẩm không có trong giỏ hàng');
    }

    return this.prisma.cartItem.delete({
      where: { id: existingItem.id },
    });
  }

  async clearCart(cartId: string) {
    return this.prisma.cartItem.deleteMany({
      where: { cartId },
    });
  }
}
