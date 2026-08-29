const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const hasQ = (s) => typeof s === 'string' && s.indexOf('?') !== -1;

const FIXES = [
  ['?????ng h??nh s???c kh???e thi??n nhi??n', 'Đồng hành sức khỏe thiên nhiên'],
  ['Qu?? ??????', 'Quà tặng'],
  ['Qu?? ?????', 'Quà tặng'],
  ['Khuy???n m??i gi???m gi?? m??a h??', 'Khuyến mãi giảm giá mùa hè'],
  ['S???c kh???e t??? thi??n nhi??n', 'Sức khỏe từ thiên nhiên'],
];

async function main() {
  const allCats = await prisma.category.findMany();
  const badCats = allCats.filter((c) => hasQ(c.name));
  for (const c of badCats) {
    const prodCount = await prisma.product.count({ where: { categoryId: c.id } });
    if (prodCount === 0) {
      try {
        await prisma.category.delete({ where: { id: c.id } });
        console.log('XOÁ category rác:', c.slug, '|', c.name);
      } catch (e) {
        console.log('KHÔNG xoá được (FK):', c.slug, '|', String(e.message).split('\n')[0]);
      }
    } else {
      // Category rác nhưng có SP tham chiếu: xoá từng SP nếu an toàn
      // (chưa publish, không đơn hàng) rồi mới xoá category.
      const refProds = await prisma.product.findMany({ where: { categoryId: c.id } });
      let blocked = false;
      for (const p of refProds) {
        const vIds = (await prisma.productVariant.findMany({ where: { productId: p.id }, select: { id: true } })).map((v) => v.id);
        const oRefs = vIds.length
          ? await prisma.orderItem.count({ where: { productVariantId: { in: vIds } } })
          : 0;
        if (!p.isPublished && oRefs === 0 && !hasQ(p.name)) {
          await prisma.product.delete({ where: { id: p.id } });
          console.log('XOÁ SP rác đính kèm:', p.slug);
        } else {
          blocked = true;
          console.log(`WARN không dám xoá SP ${p.slug} (published=${p.isPublished}, đơn=${oRefs})`);
        }
      }
      if (!blocked) {
        try {
          await prisma.category.delete({ where: { id: c.id } });
          console.log('XOÁ category rác:', c.slug, '|', c.name);
        } catch (e) {
          console.log('KHÔNG xoá được category (FK khác):', c.slug, '|', String(e.message).split('\n')[0]);
        }
      } else {
        // Vẫn còn SP rác giữ FK (đơn hàng tham chiếu): chuyển SP sang danh mục
        // chuẩn — vô hại với lịch sử đơn (orderItem -> variant, không qua
        // categoryId), giúp xoá hẳn category rác khỏi menu.
        const fallbackCat = await prisma.category.findFirst({ where: { slug: 'tim-mach' } });
        if (fallbackCat && c.id !== fallbackCat.id) {
          await prisma.product.updateMany({ where: { categoryId: c.id }, data: { categoryId: fallbackCat.id } });
          try {
            await prisma.category.delete({ where: { id: c.id } });
            console.log('CHUYỂN nhượng SP rác sang', fallbackCat.slug, '+ XOÁ category rác:', c.slug);
          } catch (e) {
            console.log('Vẫn xoá không được (FK khác):', String(e.message).split('\n')[0]);
          }
        }
      }
    }
  }
  if (!badCats.length) console.log('Không còn category chứa "?"');

  const banners = await prisma.banner.findMany();
  let fixed = 0;
  for (const b of banners) {
    if (!hasQ(b.title)) continue;
    const hit = FIXES.find((f) => f[0] === b.title);
    if (hit) {
      await prisma.banner.update({ where: { id: b.id }, data: { title: hit[1] } });
      console.log(`SỬA banner [${b.position}]: "${b.title}" → "${hit[1]}"`);
      fixed++;
    } else {
      console.log('WARN banner chưa biết cách sửa:', JSON.stringify(b.title), `[${b.position}]`);
    }
  }
  if (!fixed) console.log('(không có banner nào cần sửa / đã sạch)');

  console.log('\n── SAU KHI SỬA ──');
  const cats2 = await prisma.category.findMany({ select: { name: true, slug: true }, orderBy: { createdAt: 'asc' } });
  cats2.forEach((c) => console.log('CAT :', c.name));
  const bans2 = await prisma.banner.findMany({ select: { title: true, position: true, isActive: true }, orderBy: { sortOrder: 'asc' } });
  bans2.forEach((b) => console.log('BAN :', b.title, `[${b.position}, active=${b.isActive}]`));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());