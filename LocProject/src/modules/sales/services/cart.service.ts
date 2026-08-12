import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) { }

  private transformCartWithStock(cart: any) {
    if (!cart) return cart;
    return {
      ...cart,
      items: cart.items.map((item: any) => ({
        ...item,
        variant: item.variant
          ? {
            ...item.variant,
            product: item.variant.product
              ? {
                ...item.variant.product,
                stock:
                  item.variant.stockItems?.reduce(
                    (sum: number, si: any) => sum + ((si.qtyOnHand || 0) - (si.qtyReserved || 0)),
                    0,
                  ) || 0,
              }
              : null,
          }
          : null,
      })),
    };
  }

  private transformCartItemWithStock(item: any) {
    if (!item) return item;
    return {
      ...item,
      variant: item.variant
        ? {
          ...item.variant,
          product: item.variant.product
            ? {
              ...item.variant.product,
              stock:
                item.variant.stockItems?.reduce(
                  (sum: number, si: any) => sum + ((si.qtyOnHand || 0) - (si.qtyReserved || 0)),
                  0,
                ) || 0,
            }
            : null,
        }
        : null,
    };
  }

  async getOrCreateCart(customerId?: string, sessionId?: string) {
    if (!customerId && !sessionId) {
      throw new BadRequestException('Yêu cầu customerId hoặc sessionId để lấy giỏ hàng');
    }

    const includeOptions = {
      items: {
        include: {
          variant: {
            include: {
              stockItems: true,
              product: {
                select: { id: true, name: true, slug: true, thumbnailUrl: true, images: true },
              },
            },
          },
        },
      },
    };

    if (customerId) {
      let cart = await this.prisma.cart.findFirst({
        where: { customerId },
        include: includeOptions,
      });

      if (!cart) {
        cart = await this.prisma.cart.create({
          data: { customerId },
          include: includeOptions,
        });
      }
      return this.transformCartWithStock(cart);
    } else {
      let cart = await this.prisma.cart.findFirst({
        where: { sessionId },
        include: includeOptions,
      });

      if (!cart) {
        cart = await this.prisma.cart.create({
          data: { sessionId },
          include: includeOptions,
        });
      }
      return this.transformCartWithStock(cart);
    }
  }

  async addToCart(customerId: string | undefined, sessionId: string | undefined, productVariantId: string, qty: number) {
    const cart = await this.getOrCreateCart(customerId, sessionId);
    const existingItem = cart.items.find((item) => item.productVariantId === productVariantId);

    // Tính tổng qty sau khi thêm/cập nhật
    const newTotalQty = existingItem ? existingItem.qty + qty : qty;
    await this.validateStock(productVariantId, newTotalQty);

    if (existingItem) {
      // Tăng số lượng item hiện có
      const updated = await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { qty: newTotalQty },
        include: {
          variant: {
            include: {
              stockItems: true,
              product: {
                select: { id: true, name: true, slug: true, thumbnailUrl: true, images: true },
              },
            },
          },
        },
      });
      return this.transformCartItemWithStock(updated);
    } else {
      // Thêm item mới
      const created = await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productVariantId,
          qty: newTotalQty,
        },
        include: {
          variant: {
            include: {
              stockItems: true,
              product: {
                select: { id: true, name: true, slug: true, thumbnailUrl: true, images: true },
              },
            },
          },
        },
      });
      return this.transformCartItemWithStock(created);
    }
  }

  private async validateStock(productVariantId: string, requestedQty: number) {
    const stockAgg = await this.prisma.stockItem.aggregate({
      where: { productVariantId },
      _sum: { qtyOnHand: true, qtyReserved: true },
    });
    const totalOnHand = stockAgg._sum.qtyOnHand || 0;
    const totalReserved = stockAgg._sum.qtyReserved || 0;
    const available = totalOnHand - totalReserved;
    if (requestedQty > available) {
      throw new BadRequestException(
        `Số lượng yêu cầu (${requestedQty}) vượt quá tồn kho khả dụng (${available})`,
      );
    }
  }

  async updateItem(cartId: string, itemId: string, qty: number) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy item trong giỏ hàng');
    }

    if (item.cartId !== cartId) {
      throw new BadRequestException('Item không thuộc giỏ hàng này');
    }

    await this.validateStock(item.productVariantId, qty);

    const updated = await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { qty },
      include: {
        variant: {
          include: {
            stockItems: true,
            product: {
              select: { id: true, name: true, slug: true, thumbnailUrl: true, images: true },
            },
          },
        },
      },
    });
    return this.transformCartItemWithStock(updated);
  }

  async removeItem(cartId: string, itemId: string) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy item trong giỏ hàng');
    }

    if (item.cartId !== cartId) {
      throw new BadRequestException('Item không thuộc giỏ hàng này');
    }

    return this.prisma.cartItem.delete({ where: { id: itemId } });
  }

  async removeItemByVariantId(cartId: string, productVariantId: string) {
    const item = await this.prisma.cartItem.findFirst({
      where: { cartId, productVariantId },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy item trong giỏ hàng');
    }

    return this.prisma.cartItem.delete({ where: { id: item.id } });
  }

  async clearCart(cartId: string) {
    return this.prisma.cartItem.deleteMany({ where: { cartId } });
  }
}