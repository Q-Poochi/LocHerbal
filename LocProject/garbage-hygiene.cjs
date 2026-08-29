/* garbage-hygiene.cjs — 4 product rác còn lại có đơn hàng tham chiếu,
 * KHÔNG xoá được. In hiện trạng → unpublish nếu đang published → verify. */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const GARBAGE_SLUGS = ['khhop-tam-binh', 'bung-khang-an', 'an-than-ninh-tam', 'ngu-ngon-dinh-tam'];

async function main() {
  console.log('── HIỆN TRẠNG ──');
  const rows = await prisma.product.findMany({
    where: { slug: { in: GARBAGE_SLUGS } },
    include: { variants: true },
  });
  for (const p of rows) {
    console.log(JSON.stringify({
      slug: p.slug, name: p.name, isPublished: p.isPublished, variants: p.variants.length,
    }));
  }

  // Chỉ unpublish những slug có tên hỏng (chứa '?') và đang published
  for (const p of rows) {
    if (!/\?/.test(p.name)) {
      console.log('SKIP (tên không chứa ?):', p.slug);
      continue;
    }
    if (!p.isPublished) {
      console.log('SKIP (đã unpublished):', p.slug);
      continue;
    }
    await prisma.product.update({ where: { id: p.id }, data: { isPublished: false } });
    console.log('✔ UNPUBLISHED:', p.slug, '→', p.name);
  }

  console.log('── VERIFY SAU KHI CHẠY ──');
  const after = await prisma.product.findMany({ where: { slug: { in: GARBAGE_SLUGS } } });
  after.forEach((p) => console.log(p.slug, '| published:', p.isPublished));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());