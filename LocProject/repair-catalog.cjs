/* ═══════════════════════════════════════════════════════════════
 * repair-catalog.cjs — Sửa mojibake tiếng Việt trong DB (Bug 1+6)
 * Nguồn sự thật: prisma/seed.ts (dataset chuẩn, giữ nguyên từng chữ).
 *
 * KHÔNG PHÁ HỦY: seed.ts gốc dùng deleteMany toàn bộ catalog nhưng DB
 * đang có 2642 OrderItem + 3027 StockMovement tham chiếu → không thể
 * chạy nguyên bản. Chiến lược:
 *   1) Category upsert theo slug → sửa tên/mô tả đúng dấu
 *   2) Product  upsert theo slug → giữ ID cũ, FK đơn hàng nguyên vẹn
 *   3) Variant  chỉ TẠO MỚI theo SKU khi thiếu (không đổi giá đã có order)
 *   4) Stock    tạo StockItem qtyOnHand=100 cho variant chưa có (như seed)
 *   5) Image    đảm bảo mỗi product có ≥1 ProductImage
 *   6) Rác      xoá product chứa '??' nếu không còn đơn hàng tham chiếu
 * Chạy: node repair-catalog.cjs   (từ thư mục LocProject)
 * ═══════════════════════════════════════════════════════════════ */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Tim Mạch', slug: 'tim-mach', description: 'Sản phẩm hỗ trợ sức khỏe tim mạch', code: 'TM' },
  { name: 'Xương Khớp', slug: 'xuong-khop', description: 'Sản phẩm hỗ trợ xương khớp', code: 'XK' },
  { name: 'Tiêu Hóa', slug: 'tieu-hoa', description: 'Sản phẩm hỗ trợ tiêu hóa', code: 'TH' },
  { name: 'An Thần Ngủ Ngon', slug: 'an-than-ngu-ngon', description: 'Sản phẩm hỗ trợ giấc ngủ', code: 'AT' },
];

const PRODUCTS = [
  // ── Tim Mạch ──
  {
    name: 'Ích Tâm Khang', slug: 'ich-tam-khang',
    description: 'Ích Tâm Khang hỗ trợ tăng cường tuần hoàn máu, giúp tim mạch khỏe mạnh. Sản phẩm kết hợp bài thuốc cổ truyền với công nghệ hiện đại.',
    categoryCode: 'TM',
    variants: [
      { sku: 'LH-TM-001-30V', name: 'Hộp 30 viên', price: 165000, compareAtPrice: 220000, optionValues: { size: 'Hộp 30 viên' } },
      { sku: 'LH-TM-001-60V', name: 'Hộp 60 viên', price: 295000, compareAtPrice: 400000, optionValues: { size: 'Hộp 60 viên' } },
    ],
  },
  {
    name: 'Hạnh Phúc Huyết Áp', slug: 'hanh-phuc-huyet-ap',
    description: 'Hạnh Phúc Huyết Áp hỗ trợ ổn định huyết áp, giảm các triệu chứng chóng mặt, hoa mắt do huyết áp thất thường.',
    categoryCode: 'TM',
    variants: [
      { sku: 'LH-TM-002-30V', name: 'Hộp 30 viên', price: 125000, compareAtPrice: 170000, optionValues: { size: 'Hộp 30 viên' } },
      { sku: 'LH-TM-002-60V', name: 'Hộp 60 viên', price: 220000, compareAtPrice: 300000, optionValues: { size: 'Hộp 60 viên' } },
    ],
  },
  {
    name: 'Hoạt Huyết Dưỡng Não', slug: 'hoat-huyet-duong-nao',
    description: 'Hoạt Huyết Dưỡng Não giúp tăng cường lưu thông máu lên não, cải thiện trí nhớ và giảm đau đầu hiệu quả.',
    categoryCode: 'TM',
    variants: [
      { sku: 'LH-TM-003-30V', name: 'Hộp 30 viên', price: 145000, compareAtPrice: 195000, optionValues: { size: 'Hộp 30 viên' } },
      { sku: 'LH-TM-003-60V', name: 'Hộp 60 viên', price: 255000, compareAtPrice: 350000, optionValues: { size: 'Hộp 60 viên' } },
    ],
  },
  // ── Xương Khớp ──
  {
    name: 'Cốt Thoái Vương', slug: 'cot-thoai-vuong',
    description: 'Cốt Thoái Vương hỗ trợ điều trị thoái hóa khớp, đau lưng, mỏi gối nhờ các thảo dược quý như Độc Hoạt, Tang Ký Sinh.',
    categoryCode: 'XK',
    variants: [
      { sku: 'LH-XK-001-30V', name: 'Hộp 30 viên', price: 135000, compareAtPrice: 185000, optionValues: { size: 'Hộp 30 viên' } },
      { sku: 'LH-XK-001-60V', name: 'Hộp 60 viên', price: 235000, compareAtPrice: 320000, optionValues: { size: 'Hộp 60 viên' } },
    ],
  },
  {
    name: 'Khớp Tâm Bình', slug: 'khop-tam-binh',
    description: 'Khớp Tâm Bình hỗ trợ làm chậm quá trình thoái hóa sụn khớp, tăng tiết dịch khớp giúp vận động linh hoạt.',
    categoryCode: 'XK',
    variants: [
      { sku: 'LH-XK-002-30V', name: 'Hộp 30 viên', price: 110000, compareAtPrice: 150000, optionValues: { size: 'Hộp 30 viên' } },
      { sku: 'LH-XK-002-60V', name: 'Hộp 60 viên', price: 195000, compareAtPrice: 265000, optionValues: { size: 'Hộp 60 viên' } },
    ],
  },
  {
    name: 'Xương Khớp Vàng', slug: 'xuong-khop-vang',
    description: 'Xương Khớp Vàng là sự kết hợp hoàn hảo giữa Glucosamine, Chondroitin và thảo dược, giúp tái tạo sụn khớp.',
    categoryCode: 'XK',
    variants: [
      { sku: 'LH-XK-003-30V', name: 'Hộp 30 viên', price: 155000, compareAtPrice: 210000, optionValues: { size: 'Hộp 30 viên' } },
      { sku: 'LH-XK-003-60V', name: 'Hộp 60 viên', price: 270000, compareAtPrice: 370000, optionValues: { size: 'Hộp 60 viên' } },
    ],
  },
  // ── Tiêu Hóa ──
  {
    name: 'Tràng Phục Linh', slug: 'trang-phuc-linh',
    description: 'Tràng Phục Linh hỗ trợ giảm các triệu chứng viêm đại tràng, rối loạn tiêu hóa, đầy hơi, khó tiêu.',
    categoryCode: 'TH',
    variants: [
      { sku: 'LH-TH-001-30V', name: 'Hộp 30 viên', price: 95000, compareAtPrice: 130000, optionValues: { size: 'Hộp 30 viên' } },
      { sku: 'LH-TH-001-60V', name: 'Hộp 60 viên', price: 165000, compareAtPrice: 225000, optionValues: { size: 'Hộp 60 viên' } },
    ],
  },
  {
    name: 'Tiêu Hóa Khang', slug: 'tieu-hoa-khang',
    description: 'Tiêu Hóa Khang hỗ trợ tăng cường chức năng tiêu hóa, giảm đầy bụng, khó tiêu sau bữa ăn.',
    categoryCode: 'TH',
    variants: [
      { sku: 'LH-TH-002-30V', name: 'Hộp 30 viên', price: 75000, compareAtPrice: 100000, optionValues: { size: 'Hộp 30 viên' } },
      { sku: 'LH-TH-002-60V', name: 'Hộp 60 viên', price: 130000, compareAtPrice: 175000, optionValues: { size: 'Hộp 60 viên' } },
    ],
  },
  {
    name: 'Bình Vị Thái', slug: 'binh-vi-thai',
    description: 'Bình Vị Thái hỗ trợ giảm đau dạ dày, trung hòa acid, bảo vệ niêm mạc dạ dày khỏi viêm loét.',
    categoryCode: 'TH',
    variants: [
      { sku: 'LH-TH-003-30V', name: 'Hộp 30 viên', price: 85000, compareAtPrice: 115000, optionValues: { size: 'Hộp 30 viên' } },
      { sku: 'LH-TH-003-60V', name: 'Hộp 60 viên', price: 150000, compareAtPrice: 205000, optionValues: { size: 'Hộp 60 viên' } },
    ],
  },
  // ── An Thần Ngủ Ngon ──
  {
    name: 'Ngủ Ngon Thảo Mộc', slug: 'ngu-ngon-thao-moc',
    description: 'Ngủ Ngon Thảo Mộc giúp cải thiện chất lượng giấc ngủ, giảm căng thẳng, mệt mỏi với các thảo dược tự nhiên.',
    categoryCode: 'AT',
    variants: [
      { sku: 'LH-AT-001-30V', name: 'Hộp 30 viên', price: 110000, compareAtPrice: 150000, optionValues: { size: 'Hộp 30 viên' } },
      { sku: 'LH-AT-001-60V', name: 'Hộp 60 viên', price: 195000, compareAtPrice: 265000, optionValues: { size: 'Hộp 60 viên' } },
    ],
  },
  {
    name: 'An Thần Tâm Bình', slug: 'an-than-tam-binh',
    description: 'An Thần Tâm Bình hỗ trợ an thần, giảm lo âu, giúp tinh thần thư thái và dễ đi vào giấc ngủ.',
    categoryCode: 'AT',
    variants: [
      { sku: 'LH-AT-002-30V', name: 'Hộp 30 viên', price: 125000, compareAtPrice: 170000, optionValues: { size: 'Hộp 30 viên' } },
      { sku: 'LH-AT-002-60V', name: 'Hộp 60 viên', price: 220000, compareAtPrice: 300000, optionValues: { size: 'Hộp 60 viên' } },
    ],
  },
  {
    name: 'Dưỡng Tâm An Thần', slug: 'duong-tam-an-than',
    description: 'Dưỡng Tâm An Thần bồi bổ tâm huyết, giúp ngủ sâu giấc, giảm hồi hộp trống ngực do suy nhược thần kinh.',
    categoryCode: 'AT',
    variants: [
      { sku: 'LH-AT-003-30V', name: 'Hộp 30 viên', price: 135000, compareAtPrice: 185000, optionValues: { size: 'Hộp 30 viên' } },
      { sku: 'LH-AT-003-60V', name: 'Hộp 60 viên', price: 235000, compareAtPrice: 320000, optionValues: { size: 'Hộp 60 viên' } },
    ],
  },
];

async function main() {
  const report = {
    categoriesFixed: [], productsRenamed: [], productsCreated: [],
    variantsCreated: [], stockItemsCreated: 0, imagesCreated: 0,
    garbageDeleted: [], garbageKept: [],
  };

  // ── 1) Categories ──
  const catMap = {};
  for (const c of CATEGORIES) {
    const before = await prisma.category.findUnique({ where: { slug: c.slug } });
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description },
      create: { name: c.name, slug: c.slug, description: c.description },
    });
    catMap[c.code] = row.id;
    if (!before || before.name !== c.name || before.description !== c.description) {
      report.categoriesFixed.push(c.slug);
console.log('✔ Category', c.slug, before ? '→ upsert' : '→ tạo mới');
    }
  }

  // ── Warehouse (như seed.ts) ──
  let warehouse = await prisma.warehouse.findFirst();
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: { name: 'Kho Hà Nội', address: 'Hà Nội', isActive: true },
    });
  }

  // ── 2..5) Products / Variants / Stock / Images ──
  for (const p of PRODUCTS) {
    const before = await prisma.product.findUnique({ where: { slug: p.slug } });
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        categoryId: catMap[p.categoryCode],
        isPublished: true,
        // thumbnailUrl giữ nguyên ảnh hiện có
      },
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        categoryId: catMap[p.categoryCode],
        thumbnailUrl: 'https://placehold.co/400x400/1b4332/ffffff?text=' + encodeURIComponent(p.name),
        isPublished: true,
      },
    });

    if (!before) {
      report.productsCreated.push(p.slug);
      console.log('＋ Product mới:', p.slug);
    } else if (before.name !== p.name || before.description !== p.description) {
      report.productsRenamed.push(p.slug);
      console.log('✎ Sửa dấu:', p.slug);
    }

    // Variants — chỉ tạo mới khi thiếu; KHÔNG đổi giá variant đã có orders
    for (const v of p.variants) {
      const ex = await prisma.productVariant.findUnique({ where: { sku: v.sku } });
      if (ex && ex.productId === product.id) continue;
      if (ex) {
        console.log('! SKU thuộc product khác — bỏ qua:', v.sku);
        continue;
      }
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: v.sku,
          name: v.name,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          optionValues: v.optionValues,
        },
      });
      report.variantsCreated.push(v.sku);
      console.log('＋ Variant:', v.sku);
    }

    // StockItem cho mọi variant thiếu (như seed.ts: qtyOnHand=100)
    const vrRows = await prisma.productVariant.findMany({
      where: { productId: product.id },
      include: { stockItems: true },
    });
    for (const vr of vrRows) {
      if (vr.stockItems.length === 0) {
        await prisma.stockItem.create({
          data: {
            warehouseId: warehouse.id,
            productVariantId: vr.id,
            qtyOnHand: 100,
            qtyReserved: 0,
            reorderThreshold: 10,
          },
        });
        report.stockItemsCreated++;
      }
    }

    // Đảm bảo ≥1 ảnh
    const imgCount = await prisma.productImage.count({ where: { productId: product.id } });
    if (imgCount === 0) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: 'https://placehold.co/600x600/1b4332/ffffff?text=' + encodeURIComponent(p.name),
          sortOrder: 0,
        },
      });
      report.imagesCreated++;
    }
  }

  // ── 6) Dọn data rác: tên chứa '??' mà không còn đơn hàng ──
  const garbages = await prisma.product.findMany({
    where: { name: { contains: '??' }, NOT: { slug: { in: PRODUCTS.map((p) => p.slug) } } },
    include: { variants: true },
  });
  console.log('Rác cần xét:', garbages.map((g) => g.slug).join(', ') || '(không có)');
  for (const prod of garbages) {
    const ids = prod.variants.map((v) => v.id);
    if (ids.length > 0) {
      const orderRefs = await prisma.orderItem.count({
        where: { productVariantId: { in: ids } },
      });
      if (orderRefs > 0) {
        report.garbageKept.push(prod.slug + ' (' + orderRefs + ' dòng đơn tham chiếu — giữ lại)');
        continue;
      }
    }
    try {
      await prisma.product.delete({ where: { id: prod.id } });
      report.garbageDeleted.push(prod.slug);
      console.log('－ Đã xoá rác:', prod.slug);
    } catch (e) {
      report.garbageKept.push(prod.slug + ' (FK chặn: ' + (e.code || e.message.split('\n')[0]) + ')');
    }
  }

  console.log('\n═══ REPORT ═══');
  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());