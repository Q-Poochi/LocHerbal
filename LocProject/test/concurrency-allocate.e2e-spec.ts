import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/prisma/prisma.service';
import { InventoryService } from '../src/modules/warehouse/services/inventory.service';
import { InsufficientStockException } from '../src/modules/warehouse/exceptions/insufficient-stock.exception';

/**
 * E2E concurrency — kiểm chứng atomic UPDATE chống race condition ở tầng DB thật.
 *
 * Kịch bản: kho còn 2, khách A và khách B đều đặt mua 2, 2 request allocate()
 * chạy ĐỒNG THỜI (Promise.all). PostgreSQL row-lock đảm bảo chúng xử lý tuần tự
 * ở mức row:
 *   - Request chạm DB trước: (qty_on_hand - qty_reserved) = 2 >= 2 → thành công
 *   - Request sau: available = 0 >= 2 → WHERE không khớp → affected = 0 → throw
 *     InsufficientStockException
 * Kết quả mong đợi: ĐÚNG 1 thành công, 1 fail, và qty_reserved cuối = 2 (không
 * phải 4) — không double-sell.
 *
 * Chạy với DATABASE_URL/DIRECT_URL trỏ local DB (ecommerce). Dữ liệu tạo tạm,
 * tự cleanup trong afterAll.
 */
describe('E2E Concurrency: allocate x2 đồng thời trên cùng stock', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let inventory: InventoryService;

  const created: { kind: string; id: string }[] = [];

  function track(kind: string, id: string) {
    created.push({ kind, id });
  }

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    inventory = app.get(InventoryService);
  });

  afterAll(async () => {
    // Cleanup theo thứ tự ngược (child → parent)
    const order = created.reverse();
    for (const { kind, id } of order) {
      try {
        if (kind === 'movement') await prisma.stockMovement.delete({ where: { id } });
        else if (kind === 'stockItem') await prisma.stockItem.delete({ where: { id } });
        else if (kind === 'variant') await prisma.productVariant.delete({ where: { id } });
        else if (kind === 'product') await prisma.product.delete({ where: { id } });
        else if (kind === 'category') await prisma.category.delete({ where: { id } });
        else if (kind === 'warehouse') await prisma.warehouse.delete({ where: { id } });
      } catch {
        // cleanup best-effort — không làm fail test nếu đã xóa rồi
      }
    }
    await app.close();
  });

  it('chỉ 1 trong 2 allocate(2) thành công khi kho còn 2 — không double-sell (5 vòng lặp)', async () => {
    // Chạy 5 vòng để kiểm chứng tính nhất quán dưới tải lặp lại — nếu cơ chế
    // atomic UPDATE sai, vòng nào đó sẽ cho 0 hoặc 2 thành công.
    for (let i = 0; i < 5; i++) {
      // ── Setup dữ liệu tạm ──────────────────────────────────────────
      const suffix = Date.now() + i * 100;
      const warehouse = await prisma.warehouse.create({
        data: { name: `Conc Kho ${suffix}`, isActive: true },
      });
      track('warehouse', warehouse.id);

      const category = await prisma.category.create({
        data: { name: `Conc Cat ${suffix}`, slug: `conc-cat-${suffix}` },
      });
      track('category', category.id);

      const product = await prisma.product.create({
        data: {
          name: `Conc Prod ${suffix}`,
          slug: `conc-prod-${suffix}`,
          categoryId: category.id,
          isPublished: true,
        },
      });
      track('product', product.id);

      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: `CONC-${suffix}`,
          name: `Conc Variant ${suffix}`,
          price: 50000,
        },
      });
      track('variant', variant.id);

      // Kho còn ĐÚNG 2 — đúng kịch bản user đưa ra
      const stockItem = await prisma.stockItem.create({
        data: {
          warehouseId: warehouse.id,
          productVariantId: variant.id,
          qtyOnHand: 2,
          qtyReserved: 0,
        },
      });
      track('stockItem', stockItem.id);

      // ── Chạy 2 allocate() ĐỒNG THỜI ────────────────────────────────
      const results = await Promise.allSettled([
        inventory.allocate(variant.id, 2, `conc-order-A-${suffix}`),
        inventory.allocate(variant.id, 2, `conc-order-B-${suffix}`),
      ]);

      // ── Assert ─────────────────────────────────────────────────────
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      // Đúng 1 thành công
      expect(fulfilled.length).toBe(1);
      // Đúng 1 thất bại với InsufficientStockException
      expect(rejected.length).toBe(1);
      const rejectedReason = rejected[0] as PromiseRejectedResult;
      expect(rejectedReason.reason).toBeInstanceOf(InsufficientStockException);

      // Không double-sell: qty_reserved cuối = 2 (không phải 4)
      const after = await prisma.stockItem.findUnique({ where: { id: stockItem.id } });
      expect(after?.qtyReserved).toBe(2);
      expect(after?.qtyOnHand).toBe(2);

      // Audit: đúng 1 StockMovement RESERVED
      const movements = await prisma.stockMovement.findMany({
        where: { stockItemId: stockItem.id, type: 'RESERVED' },
      });
      expect(movements.length).toBe(1);
      expect(movements[0].qty).toBe(2);
      movements.forEach((m) => track('movement', m.id));
    }
  });
});
