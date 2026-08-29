
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
ecord  console.log('✔ Category', c.slug, before ? '→ upsert' : '→ tạo mới');
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