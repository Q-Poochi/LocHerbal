// ── Verify runtime OrphanedOrderSweeperJob ────────────────────────────────
// Dựng 2 đơn orphan PENDING/PENDING (createdAt lùi về 20 phút trước, KHÔNG
// phải đợi thật):  A) chưa thanh toán, có reserve tồn kho  B) đã PAID.
// Sau đó poll DB đợi cron (*/5 phút) và đối chiếu kết quả + số tồn kho.
// Cleanup: xóa sạch dữ liệu test, hoàn trả qtyReserved.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TAG = 'sweeper-verify';
const codeA = `SWEEPA-${Date.now()}`;
const codeB = `SWEEPB-${Date.now()}`;
const codePfxA = codeA.slice(0, 20);
const codePfxB = codeB.slice(0, 20);

async function pickVariant() {
  // variant có tồn khả dụng >= 10, kèm tên SP để snapshot
  const rows = await prisma.$queryRaw`
    SELECT v.id, v.sku, s.id AS stock_id, s.qty_on_hand, s.qty_reserved,
           p.name AS product_name
    FROM product_variants v
    JOIN stock_items s ON s.product_variant_id = v.id
    JOIN products p ON p.id = v.product_id
    WHERE (s.qty_on_hand - s.qty_reserved) >= 10
    LIMIT 1`;
  return rows[0];
}

async function makeOrphan({ code, customer, variant, paid }) {
  const stale = new Date(Date.now() - 20 * 60 * 1000);
  const order = await prisma.order.create({
    data: {
      orderCode: code,
      customerId: customer.id,
      status: 'PENDING',
      paymentStatus: paid ? 'PAID' : 'UNPAID',
      allocationStatus: 'PENDING',
      paymentMethod: paid ? 'VNPAY' : 'COD',
      subtotal: 200000, shippingFee: 0, totalAmount: 200000,
      createdAt: stale, updatedAt: stale,
      items: {
        create: {
          productVariantId: variant.id,
          productNameSnapshot: variant.product_name,
          skuSnapshot: variant.sku,
          qty: 2, unitPrice: 100000, subtotal: 200000,
        },
      },
    },
  });
  if (paid) {
    await prisma.paymentTransaction.create({
      data: {
        orderId: order.id, provider: 'VNPAY',
        transactionCode: `${TAG}-${Date.now()}`,
        amount: 200000, status: 'PAID',
      },
    });
  } else {
    // Mô phỏng saga ĐÃ reserve tồn kho rồi mới kẹt (worst case orphan):
    // allocate thật ghi cả qty_reserved VÀ StockMovement RESERVED theo
    // referenceId=orderId — release per-reference đối soát movement này,
    // nên fixture phải tạo đủ cả hai để phản ánh đúng trạng thái thật.
    await prisma.$executeRaw`
      UPDATE stock_items SET qty_reserved = qty_reserved + 2
      WHERE id = ${variant.stock_id}`;
    await prisma.stockMovement.create({
      data: {
        stockItemId: variant.stock_id,
        type: 'RESERVED',
        qty: 2,
        referenceType: 'ORDER',
        referenceId: order.id,
        note: 'Tạm giữ 2 đơn vị cho đơn hàng (fixture sweeper-verify)',
      },
    });
  }
  return order;
}

async function stockOf(stockId) {
  const r = await prisma.$queryRaw`
    SELECT qty_on_hand AS on_hand, qty_reserved AS reserved
    FROM stock_items WHERE id = ${stockId}`;
  return r[0];
}

async function main() {
  const variant = await pickVariant();
  if (!variant) throw new Error('Không có variant đủ tồn');
  const customer = await prisma.customer.findFirst({
    where: { email: 'race-1@locherbal.com' },
  });
  if (!customer) throw new Error('Thiếu customer race-1 (chạy S1 trước)');

  const stockBefore = await stockOf(variant.stock_id);
  const orderA = await makeOrphan({ code: codeA, customer, variant, paid: false });
  const orderB = await makeOrphan({ code: codeB, customer, variant, paid: true });
  console.log(`[fixtures] A(unpaid,reserved)=${orderA.id} B(paid)=${orderB.id}`);
  console.log(`[stock-before] on_hand=${stockBefore.on_hand} reserved=${stockBefore.reserved}`);
  console.log('[phase] WAIT_CRON — poll tối đa 7 phút...');

  const deadline = Date.now() + 7 * 60 * 1000;
  let a, b;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 20000));
    a = await prisma.order.findUnique({ where: { id: orderA.id }, include: { statusHistory: true } });
    b = await prisma.order.findUnique({ where: { id: orderB.id }, include: { statusHistory: true } });
    const doneA = a.status === 'CANCELLED';
    const doneB = b.statusHistory.some((h) => (h.note || '').includes('ADMIN'));
    if (doneA && doneB) break;
    console.log(`[poll] A=${a.status}/${a.allocationStatus} B=${b.status} historyB=${b.statusHistory.length}`);
  }

  const stockAfter = await stockOf(variant.stock_id);
  const noteB = (b.statusHistory.find((h) => (h.note || '').includes('ADMIN'))?.note) || '';
  console.log('══════════ VERDICT ══════════');
  console.log(`A(unpaid): status=${a.status} allocationStatus=${a.allocationStatus} ` +
    `history=[${a.statusHistory.map((h) => h.changedBy).join(',')}]`);
  console.log(`  expect: CANCELLED/FAILED + changedBy SYSTEM_SWEEPER`);
  console.log(`B(paid): status=${b.status} flagNote=${noteB ? 'CO [' + noteB.slice(0, 40) + '...]' : 'KHONG'}`);
  console.log(`  expect: vẫn PENDING + note [CẦN ADMIN XỬ LÝ]`);
  console.log(`[stock] reserved before=${stockBefore.reserved} after=${stockAfter.reserved} ` +
    `(A đã reserve +2 rồi bị hủy)`);
  console.log(`  expect-đúng-nghiệp-vụ: after = before (tồn kho được giải phóng)`);
  const released = Number(stockAfter.reserved) === Number(stockBefore.reserved);
  console.log(`RELEASE_OK=${released ? 'YES' : 'NO — RÒ TỒN KHO ' + (Number(stockAfter.reserved) - Number(stockBefore.reserved))}`);
}

main()
  .catch((e) => { console.error('[FATAL]', e.message); process.exitCode = 1; })
  .finally(async () => {
    // ── Cleanup: xóa dữ liệu test + hoàn trả reserve của A ──
    try {
      const a = await prisma.order.findFirst({ where: { orderCode: { startsWith: codePfxA } } });
      const b = await prisma.order.findFirst({ where: { orderCode: { startsWith: codePfxB } } });
      if (a) await prisma.order.delete({ where: { id: a.id } }).catch(() => {});
      if (b) await prisma.order.delete({ where: { id: b.id } }).catch(() => {});
      const variant = await pickVariant();
      if (variant) {
        await prisma.$executeRaw`
          UPDATE stock_items SET qty_reserved = GREATEST(0, qty_reserved - 2)
          WHERE id = ${variant.stock_id}`;
      }
      console.log('[cleanup] done (orders deleted, qtyReserved hoàn trả)');
    } catch (e) { console.error('[cleanup-err]', e.message); }
    await prisma.$disconnect();
  });
