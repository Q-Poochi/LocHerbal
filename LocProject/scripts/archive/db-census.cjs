/* db-census.cjs — Kiểm kê toàn bộ product sau repair + dọn nốt rác tên chứa
 * dấu '?' đơn (lọt qua filter '??'): có đơn hàng → unpublish, không → xoá. */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const all = await prisma.product.findMany({ include: { variants: true } });
  console.log('TOTAL:', all.length);

  // Toàn bộ slug + trạng thái publish để đối chiếu dataset chuẩn
  console.log('── PUBLISHED ──');
  all.filter((p) => p.isPublished)
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .forEach((p) => console.log(' ', p.slug, '|', p.name));

  console.log('── UNPUBLISHED (đã ẩn) ──');
  all.filter((p) => !p.isPublished)
    .forEach((p) => console.log(' ', p.slug));

  // Rác còn sót: tên chứa '?' bất kỳ (1 hay nhiều), loại trừ canonical
  const canonical = [
    'ich-tam-khang', 'hanh-phuc-huyet-ap', 'hoat-huyet-duong-nao',
    'cot-thoai-vuong', 'khop-tam-binh', 'xuong-khop-vang',
    'trang-phuc-linh', 'tieu-hoa-khang', 'binh-vi-thai',
    'ngu-ngon-thao-moc', 'an-than-tam-binh', 'duong-tam-an-than',
  ];
  const leftovers = all.filter((p) => /\?/.test(p.name || '') && !canonical.includes(p.slug));
  console.log('\n── RÁC CÒN SÓT ──');
  for (const p of leftovers) {
    const ids = p.variants.map((v) => v.id);
    let orderRefs = 0;
    if (ids.length) {
      orderRefs = await prisma.orderItem.count({ where: { productVariantId: { in: ids } } });
    }
    if (orderRefs === 0) {
      try {
        await prisma.product.delete({ where: { id: p.id } });
        console.log('XOÁ:', p.slug, '|', p.name);
      } catch (e) {
        await prisma.product.update({ where: { id: p.id }, data: { isPublished: false } });
        console.log('UNPUBLISH (FK chặn):', p.slug, '|', p.name);
      }
    } else {
      await prisma.product.update({ where: { id: p.id }, data: { isPublished: false } });
      console.log(`UNPUBLISH (${orderRefs} đơn tham chiếu): ${p.slug} | ${p.name}`);
    }
  }
  if (!leftovers.length) console.log('(không có)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());