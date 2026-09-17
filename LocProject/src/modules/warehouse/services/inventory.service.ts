import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { InsufficientStockException } from '../exceptions/insufficient-stock.exception';
import {
  isTxTimeoutError,
  TX_OPTIONS,
  withTxRetry,
} from '../../../shared/prisma/tx-with-retry';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Delegation sang helper chung — timeout/maxWait tường minh 15s/10s
   * (mặc định 5s đã gây lỗi "Transaction already closed" ở allocate dưới
   * tải cao) + retry CHỈ cho P2028.
   */
  private txWithRetry<T>(
    fn: (tx: any) => Promise<T>,
  ): Promise<T> {
    return withTxRetry(this.prisma, fn);
  }

  /**
   * Tạm giữ (reserve) tồn kho khi khách tạo đơn hàng.
   * Sử dụng atomic UPDATE có điều kiện trong transaction để chống race condition.
   */
  async allocate(productVariantId: string, qty: number, referenceId?: string) {
    let stockItemId: string | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await this.txWithRetry(async (tx) => {
          // 1. Tìm StockItem theo productVariantId
          const stockItem = await tx.stockItem.findFirst({
            where: { productVariantId },
          });

          if (!stockItem) {
            throw new NotFoundException('Không tìm thấy tồn kho cho sản phẩm này');
          }
          stockItemId = stockItem.id;

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
            const available = Math.max(0, (stockItem.qtyOnHand ?? 0) - (stockItem.qtyReserved ?? 0));
            throw new InsufficientStockException(productVariantId, qty, available);
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
      } catch (err: any) {
        // P2028 là lỗi AMBIGUOUS: commit có thể ĐÃ thành công phía DB dù Prisma
        // báo timeout (đã xác minh thật: RESERVED +1 bị commit nhưng listener
        // vẫn nhận lỗi "Transaction already closed" → coi là fail → rò reserve).
        // Đối soát qua audit trail trước khi retry — tránh reserve kép.
        if (isTxTimeoutError(err) && referenceId && stockItemId) {
          const committed = await this.prisma.stockMovement.findFirst({
            where: {
              stockItemId,
              referenceType: 'ORDER',
              referenceId,
              type: 'RESERVED',
            },
          });
          if (committed) {
            return { success: true, stockItemId, qtyAllocated: qty };
          }
        }
        if (!isTxTimeoutError(err) || attempt === 3) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, attempt === 1 ? 100 : 300));
      }
    }
    throw new Error('unreachable'); // loop luôn return/throw bên trên
  }

  /**
   * Giải phóng (release) tồn kho đã tạm giữ khi đơn hàng bị hủy.
   * Dùng GREATEST(0, ...) vì đây là thao tác hoàn lại — an toàn khi giá trị đã bị thay đổi.
   */
  async release(productVariantId: string, qty: number, referenceId?: string) {
    let stockItemId: string | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await this.txWithRetry(async (tx) => {
          const stockItem = await tx.stockItem.findFirst({
            where: { productVariantId },
          });

          if (!stockItem) {
            throw new NotFoundException('Không tìm thấy tồn kho cho sản phẩm này');
          }
          stockItemId = stockItem.id;

          // ĐỐI SOÁT PER-REFERENCE: chỉ được decrement nếu chính đơn hàng này
          // đang giữ reserve thực (tổng RESERVED - RELEASED >= qty). Trước đây
          // release "mù" theo variant: đơn 400 (chưa từng reserve) vẫn trừ
          // qty_reserved → GIẢI PHÓNG NHẦM phần reserve của đơn KHÁC (GREATEST
          // floor che giấu) → đơn sau chiếm slot → 2×201 trên kho=1, reserved
          // về 0 sai business. Đọc movement TRONG tx để nhất quán.
          const movements = await tx.stockMovement.findMany({
            where: {
              stockItemId: stockItem.id,
              referenceType: 'ORDER',
              referenceId,
              type: { in: ['RESERVED', 'RELEASED'] },
            },
            select: { type: true, qty: true },
          });
          let netReserved = 0;
          for (const m of movements) {
            if (m.type === 'RESERVED') netReserved += m.qty;
            else netReserved -= m.qty;
          }
          if (netReserved < qty) {
            // Đơn này không có (đủ) reserve để giải phóng — idempotent skip,
            // KHÔNG decrement và KHÔNG ghi RELEASED movement (tránh làm sai
            // isOrderFullyAllocated và đối soát P2028).
            return { success: true, stockItemId: stockItem.id, qtyReleased: 0, skipped: true };
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
      } catch (err: any) {
        // P2028 ambiguous — đối soát RELEASED movement trước khi retry để
        // tránh giải phóng kép (GREATEST floor không cứu được over-release
        // trừ vào phần reserve của đơn KHÁC).
        if (isTxTimeoutError(err) && referenceId && stockItemId) {
          const committed = await this.prisma.stockMovement.findFirst({
            where: {
              stockItemId,
              referenceType: 'ORDER',
              referenceId,
              type: 'RELEASED',
            },
          });
          if (committed) {
            return { success: true, stockItemId, qtyReleased: qty };
          }
        }
        if (!isTxTimeoutError(err) || attempt === 3) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, attempt === 1 ? 100 : 300));
      }
    }
    throw new Error('unreachable'); // loop luôn return/throw bên trên
  }

  /**
   * Trừ kho thực tế khi thanh toán đơn hàng được xác nhận.
   * KHÔNG dùng GREATEST(0, ...) — nếu dữ liệu không nhất quán phải báo lỗi rõ ràng.
   * deduct() chạy SAU allocate() đã thành công, nên qty_on_hand và qty_reserved
   * phải đủ. Nếu không đủ = data integrity error.
   */
  async deduct(productVariantId: string, qty: number, referenceId?: string) {
    let stockItemId: string | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await this.txWithRetry(async (tx) => {
          const stockItem = await tx.stockItem.findFirst({
            where: { productVariantId },
          });

          if (!stockItem) {
            throw new NotFoundException('Không tìm thấy tồn kho cho sản phẩm này');
          }
          stockItemId = stockItem.id;

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
            throw new InsufficientStockException(productVariantId, qty, 0);
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
      } catch (err: any) {
        // P2028 ambiguous — OUTBOUND kép là hỏng dữ liệu nghiêm trọng (trừ kho
        // 2 lần), nên đối soát audit trail trước khi retry.
        if (isTxTimeoutError(err) && referenceId && stockItemId) {
          const committed = await this.prisma.stockMovement.findFirst({
            where: {
              stockItemId,
              referenceType: 'ORDER',
              referenceId,
              type: 'OUTBOUND',
            },
          });
          if (committed) {
            return { success: true, stockItemId, qtyDeducted: qty };
          }
        }
        if (!isTxTimeoutError(err) || attempt === 3) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, attempt === 1 ? 100 : 300));
      }
    }
    throw new Error('unreachable'); // loop luôn return/throw bên trên
  }

  /**
   * Xác minh đơn hàng đã được allocate đủ trước khi deduct (defense-in-depth).
   * Đếm StockMovement RESERVED theo referenceId=orderId, trừ RELEASED (nếu đơn đã
   * bị hủy một phần). Trả false nếu tổng reserve < tổng qty cần — lúc đó KHÔNG
   * được deduct (rò stock).
   */
  async isOrderFullyAllocated(orderId: string, items: { qty: number }[]): Promise<boolean> {
    if (!items.length) return false;

    const movements = await this.prisma.stockMovement.findMany({
      where: {
        referenceType: 'ORDER',
        referenceId: orderId,
        type: { in: ['RESERVED', 'RELEASED'] },
      },
      select: { type: true, qty: true },
    });

    let totalReserved = 0;
    let totalReleased = 0;
    for (const m of movements) {
      if (m.type === 'RESERVED') totalReserved += m.qty;
      if (m.type === 'RELEASED') totalReleased += m.qty;
    }

    const needed = items.reduce((sum, i) => sum + i.qty, 0);
    return totalReserved - totalReleased >= needed;
  }

  /**
   * Nhập kho thực tế khi nhận hàng từ nhà cung cấp (Purchase Order).
   * Upsert StockItem (tạo mới nếu chưa có với qty_on_hand/qty_reserved = 0),
   * sau đó cộng qty_on_hand bằng UPDATE atomic, và ghi StockMovement INBOUND.
   */
  async inbound(
    productVariantId: string,
    warehouseId: string,
    qty: number,
    referenceId?: string,
  ): Promise<void> {
    // Inbound tần suất thấp (nhận hàng PO) — chỉ cần timeout tường minh,
    // KHÔNG retry mù vì P2028 ambiguous có thể nhập kho kép.
    await this.prisma.$transaction(async (tx) => {
      // 1. Upsert StockItem theo (warehouseId, productVariantId)
      const stockItem = await tx.stockItem.upsert({
        where: {
          warehouseId_productVariantId: {
            warehouseId,
            productVariantId,
          },
        },
        update: {},
        create: {
          warehouseId,
          productVariantId,
          qtyOnHand: 0,
          qtyReserved: 0,
        },
      });

      // 2. Atomic UPDATE tăng qty_on_hand
      await tx.$executeRaw`
        UPDATE stock_items
        SET qty_on_hand = qty_on_hand + ${qty}
        WHERE id = ${stockItem.id}
      `;

      // 3. Ghi audit trail — StockMovement type INBOUND
      await tx.stockMovement.create({
        data: {
          stockItemId: stockItem.id,
          type: 'INBOUND',
          qty,
          referenceType: 'PURCHASE_ORDER',
          referenceId: referenceId || null,
          note: `Nhập kho ${qty} đơn vị từ đơn đặt hàng`,
        },
      });
    }, TX_OPTIONS);
  }

  /**
   * Tổng quan tồn kho cho admin: danh sách StockItem + tổng hợp theo warehouse.
   * available = qtyOnHand - qtyReserved; lowStock = available <= reorderThreshold.
   */
  async getStockOverview(page = 1, limit = 20) {
    const [data, total, aggregate] = await Promise.all([
      this.prisma.stockItem.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: {
          warehouse: { select: { id: true, name: true, address: true, isActive: true } },
          variant: {
            select: {
              id: true,
              sku: true,
              name: true,
              price: true,
              product: { select: { id: true, name: true, slug: true } },
            },
          },
        },
        orderBy: { qtyOnHand: 'asc' },
      }),
      this.prisma.stockItem.count(),
      this.prisma.stockItem.groupBy({
        by: ['warehouseId'],
        _sum: { qtyOnHand: true, qtyReserved: true },
      }),
    ]);

    const warehouseIds = aggregate.map((a) => a.warehouseId);
    const warehouses = warehouseIds.length
      ? await this.prisma.warehouse.findMany({ where: { id: { in: warehouseIds } } })
      : [];

    const warehouseMap = new Map(warehouses.map((w) => [w.id, w.name]));

    const summaries = aggregate.map((a) => ({
      warehouseId: a.warehouseId,
      warehouseName: warehouseMap.get(a.warehouseId) || 'Không xác định',
      qtyOnHand: a._sum.qtyOnHand || 0,
      qtyReserved: a._sum.qtyReserved || 0,
      available: (a._sum.qtyOnHand || 0) - (a._sum.qtyReserved || 0),
    }));

    const items = data.map((s) => ({
      id: s.id,
      warehouse: s.warehouse,
      variant: s.variant,
      qtyOnHand: s.qtyOnHand,
      qtyReserved: s.qtyReserved,
      available: s.qtyOnHand - s.qtyReserved,
      reorderThreshold: s.reorderThreshold,
      isLowStock: s.qtyOnHand - s.qtyReserved <= s.reorderThreshold,
    }));

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      warehouses: summaries,
    };
  }
}
