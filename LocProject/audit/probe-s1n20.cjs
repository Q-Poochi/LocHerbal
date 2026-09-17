// Soi DB quanh variant RACE-S1-20: mọi order có item trên variant + stock hiện tại
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const rows = await prisma.$queryRaw`
    SELECT o.id, o.order_code, o.status, o.allocation_status, o.payment_status,
           oi.qty, h.changed_by, h.note, h.created_at AS h_created, o.created_at
    FROM product_variants v
    JOIN order_items oi ON oi.product_variant_id = v.id
    JOIN orders o ON o.id = oi.order_id
    LEFT JOIN order_status_history h ON h.order_id = o.id
    WHERE v.sku = 'RACE-S1-20'
    ORDER BY o.created_at`;
  console.log(JSON.stringify(rows, null, 1));
  const one = await prisma.$queryRaw`
    SELECT o.id, o.order_code, o.status, o.allocation_status, o.payment_status, o.created_at,
           (SELECT string_agg(h.changed_by || ':' || coalesce(h.note,''), ' | ' ORDER BY h.created_at)
              FROM order_status_history h WHERE h.order_id = o.id) AS history
    FROM orders o WHERE o.id = 'a582d153-5b4d-4df0-8a9f-48c51723b1ca'`;
  console.log('order a582d153:', JSON.stringify(one, null, 1));
  const mv = await prisma.$queryRaw`
    SELECT m.type, m.qty, m.reference_id, m.note, m.created_at
    FROM stock_movements m
    JOIN product_variants v ON v.id = (
      SELECT product_variant_id FROM stock_items WHERE id = m.stock_item_id)
    WHERE v.sku = 'RACE-S1-20'
      AND m.created_at > '2026-09-17T11:09:00Z'
    ORDER BY m.created_at`;
  console.log('movements today:', JSON.stringify(mv, null, 1));
  const stock = await prisma.$queryRaw`
    SELECT s.qty_on_hand, s.qty_reserved FROM stock_items s
    JOIN product_variants v ON v.id = s.product_variant_id WHERE v.sku = 'RACE-S1-20'`;
  console.log('stock:', JSON.stringify(stock));
  await prisma.$disconnect();
})();
