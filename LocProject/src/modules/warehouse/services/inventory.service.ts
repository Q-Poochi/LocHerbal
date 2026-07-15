import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạm giữ (reserve) tồn kho khi khách tạo đơn hàng.
   * Sử dụng atomic UPDATE có điều kiện trong transaction để chống race condition.
   */
  async allocate(productVariantId: string, qty: number, referenceId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Tìm StockItem theo productVariantId
      const stockItem = await tx.stockItem.findFirst({
        where: { productVariantId },
      });

      if (!stockItem) {
        throw new NotFoundException('Không tìm thấy tồn kho cho sản phẩm này');
      }

      // 2. Atomic update: tăng qty_reserved nếu đủ tồn kho khả dụng
      //    Điều kiện: (qty_on_hand - qty_reserved) >= qty
      //    Sau $executeRaw, phải kiểm tra affected === 0 rồi mới throw
      const affected: number = await tx.$executeRaw`
        UPDATE stock_items 
        SET qty_reserved = qty_reserved + ${qty}
        WHERE id = ${stockItem.id} 
          AND (qty_on_hand - qty_reserved) >= ${qty}
      `;

      if (affected === 0) {
        throw new BadRequestException('Không đủ tồn kho để giữ hàng');
      }

      // 3. Ghi audit trail — StockMovement type RESERVED
      await tx.stockMovement.create({
        data: {
          stockItemId: stockItem.id,
          type: 'RESERVED',
          qty,
          referenceType: referenceId ? 'ORDER' : null,
          referenceId: referenceId || null,
          note: `Tạm giữ ${qty} đơn vị cho đơn hàng`,
        },
      });

      return { success: true, stockItemId: stockItem.id, qtyAllocated: qty };
    });
  }

  /**
   * Giải phóng (release) tồn kho đã tạm giữ khi đơn hàng bị hủy.
   * Dùng GREATEST(0, ...) vì đây là thao tác hoàn lại — an toàn khi giá trị đã bị thay đổi.
   */
  async release(productVariantId: string, qty: number, referenceId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const stockItem = await tx.stockItem.findFirst({
        where: { productVariantId },
      });

      if (!stockItem) {
        throw new NotFoundException('Không tìm thấy tồn kho cho sản phẩm này');
      }

      // Dùng GREATEST(0, ...) vì release là thao tác hoàn lại — chấp nhận floor tại 0
      await tx.$executeRaw`
        UPDATE stock_items 
        SET qty_reserved = GREATEST(0, qty_reserved - ${qty})
        WHERE id = ${stockItem.id}
      `;

      // Ghi audit trail — StockMovement type RELEASED
      await tx.stockMovement.create({
        data: {
          stockItemId: stockItem.id,
          type: 'RELEASED',
          qty,
          referenceType: referenceId ? 'ORDER' : null,
          referenceId: referenceId || null,
          note: `Giải phóng ${qty} đơn vị do hủy đơn`,
        },
      });

      return { success: true, stockItemId: stockItem.id, qtyReleased: qty };
    });
  }

  /**
   * Trừ kho thực tế khi thanh toán đơn hàng được xác nhận.
   * KHÔNG dùng GREATEST(0, ...) — nếu dữ liệu không nhất quán phải báo lỗi rõ ràng.
   * deduct() chạy SAU allocate() đã thành công, nên qty_on_hand và qty_reserved
   * phải đủ. Nếu không đủ = data integrity error.
   */
  async deduct(productVariantId: string, qty: number, referenceId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const stockItem = await tx.stockItem.findFirst({
        where: { productVariantId },
      });

      if (!stockItem) {
        throw new NotFoundException('Không tìm thấy tồn kho cho sản phẩm này');
      }

      // Atomic update: trừ cả qty_on_hand và qty_reserved
      // Điều kiện nghiêm ngặt: qty_on_hand >= qty AND qty_reserved >= qty
      // Sau $executeRaw, phải kiểm tra affected === 0 rồi mới throw
      const affected: number = await tx.$executeRaw`
        UPDATE stock_items 
        SET qty_on_hand = qty_on_hand - ${qty},
            qty_reserved = qty_reserved - ${qty}
        WHERE id = ${stockItem.id} 
          AND qty_on_hand >= ${qty} 
          AND qty_reserved >= ${qty}
      `;

      if (affected === 0) {
        throw new BadRequestException('Lỗi tồn kho: dữ liệu không nhất quán');
      }

      // Ghi audit trail — StockMovement type OUTBOUND
      await tx.stockMovement.create({
        data: {
          stockItemId: stockItem.id,
          type: 'OUTBOUND',
          qty,
          referenceType: referenceId ? 'ORDER' : null,
          referenceId: referenceId || null,
          note: `Trừ kho ${qty} đơn vị sau xác nhận thanh toán`,
        },
      });

      return { success: true, stockItemId: stockItem.id, qtyDeducted: qty };
    });
  }
}
