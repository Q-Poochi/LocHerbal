import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

type CategoryCode = 'TM' | 'XK' | 'TH' | 'AT'

interface ProductSeed {
  name: string
  slug: string
  description: string
  categoryCode: CategoryCode
  seq: number
  variants: {
    sku: string
    name: string
    price: number
    compareAtPrice: number
    optionValues: Record<string, string>
  }[]
}

const CATEGORIES: { name: string; slug: string; description: string; code: CategoryCode }[] = [
  { name: 'Tim Mạch', slug: 'tim-mach', description: 'Sản phẩm hỗ trợ sức khỏe tim mạch', code: 'TM' },
  { name: 'Xương Khớp', slug: 'xuong-khop', description: 'Sản phẩm hỗ trợ xương khớp', code: 'XK' },
  { name: 'Tiêu Hóa', slug: 'tieu-hoa', description: 'Sản phẩm hỗ trợ tiêu hóa', code: 'TH' },
  { name: 'An Thần Ngủ Ngon', slug: 'an-than-ngu-ngon', description: 'Sản phẩm hỗ trợ giấc ngủ', code: 'AT' },
]

const PRODUCTS: ProductSeed[] = [
  // ── Tim Mạch ────────────────────────────────────────────────
  {
    name: 'Ích Tâm Khang', slug: 'ich-tam-khang',
    description: 'Ích Tâm Khang hỗ trợ tăng cường tuần hoàn máu, giúp tim mạch khỏe mạnh. Sản phẩm kết hợp bài thuốc cổ truyền với công nghệ hiện đại.',
    categoryCode: 'TM', seq: 1,
    variants: [
      { sku: 'LH-TM-001-30V', name: 'Hộp 30 viên', price: 165000, compareAtPrice: 220000, optionValues: { 'size': 'Hộp 30 viên' } },
      { sku: 'LH-TM-001-60V', name: 'Hộp 60 viên', price: 295000, compareAtPrice: 400000, optionValues: { 'size': 'Hộp 60 viên' } },
    ],
  },
  {
    name: 'Hạnh Phúc Huyết Áp', slug: 'hanh-phuc-huyet-ap',
    description: 'Hạnh Phúc Huyết Áp hỗ trợ ổn định huyết áp, giảm các triệu chứng chóng mặt, hoa mắt do huyết áp thất thường.',
    categoryCode: 'TM', seq: 2,
    variants: [
      { sku: 'LH-TM-002-30V', name: 'Hộp 30 viên', price: 125000, compareAtPrice: 170000, optionValues: { 'size': 'Hộp 30 viên' } },
      { sku: 'LH-TM-002-60V', name: 'Hộp 60 viên', price: 220000, compareAtPrice: 300000, optionValues: { 'size': 'Hộp 60 viên' } },
    ],
  },
  {
    name: 'Hoạt Huyết Dưỡng Não', slug: 'hoat-huyet-duong-nao',
    description: 'Hoạt Huyết Dưỡng Não giúp tăng cường lưu thông máu lên não, cải thiện trí nhớ và giảm đau đầu hiệu quả.',
    categoryCode: 'TM', seq: 3,
    variants: [
      { sku: 'LH-TM-003-30V', name: 'Hộp 30 viên', price: 145000, compareAtPrice: 195000, optionValues: { 'size': 'Hộp 30 viên' } },
      { sku: 'LH-TM-003-60V', name: 'Hộp 60 viên', price: 255000, compareAtPrice: 350000, optionValues: { 'size': 'Hộp 60 viên' } },
    ],
  },

  // ── Xương Khớp ──────────────────────────────────────────────
  {
    name: 'Cốt Thoái Vương', slug: 'cot-thoai-vuong',
    description: 'Cốt Thoái Vương hỗ trợ điều trị thoái hóa khớp, đau lưng, mỏi gối nhờ các thảo dược quý như Độc Hoạt, Tang Ký Sinh.',
    categoryCode: 'XK', seq: 1,
    variants: [
      { sku: 'LH-XK-001-30V', name: 'Hộp 30 viên', price: 135000, compareAtPrice: 185000, optionValues: { 'size': 'Hộp 30 viên' } },
      { sku: 'LH-XK-001-60V', name: 'Hộp 60 viên', price: 235000, compareAtPrice: 320000, optionValues: { 'size': 'Hộp 60 viên' } },
    ],
  },
  {
    name: 'Khớp Tâm Bình', slug: 'khop-tam-binh',
    description: 'Khớp Tâm Bình hỗ trợ làm chậm quá trình thoái hóa sụn khớp, tăng tiết dịch khớp giúp vận động linh hoạt.',
    categoryCode: 'XK', seq: 2,
    variants: [
      { sku: 'LH-XK-002-30V', name: 'Hộp 30 viên', price: 110000, compareAtPrice: 150000, optionValues: { 'size': 'Hộp 30 viên' } },
      { sku: 'LH-XK-002-60V', name: 'Hộp 60 viên', price: 195000, compareAtPrice: 265000, optionValues: { 'size': 'Hộp 60 viên' } },
    ],
  },
  {
    name: 'Xương Khớp Vàng', slug: 'xuong-khop-vang',
    description: 'Xương Khớp Vàng là sự kết hợp hoàn hảo giữa Glucosamine, Chondroitin và thảo dược, giúp tái tạo sụn khớp.',
    categoryCode: 'XK', seq: 3,
    variants: [
      { sku: 'LH-XK-003-30V', name: 'Hộp 30 viên', price: 155000, compareAtPrice: 210000, optionValues: { 'size': 'Hộp 30 viên' } },
      { sku: 'LH-XK-003-60V', name: 'Hộp 60 viên', price: 270000, compareAtPrice: 370000, optionValues: { 'size': 'Hộp 60 viên' } },
    ],
  },

  // ── Tiêu Hóa ────────────────────────────────────────────────
  {
    name: 'Tràng Phục Linh', slug: 'trang-phuc-linh',
    description: 'Tràng Phục Linh hỗ trợ giảm các triệu chứng viêm đại tràng, rối loạn tiêu hóa, đầy hơi, khó tiêu.',
    categoryCode: 'TH', seq: 1,
    variants: [
      { sku: 'LH-TH-001-30V', name: 'Hộp 30 viên', price: 95000, compareAtPrice: 130000, optionValues: { 'size': 'Hộp 30 viên' } },
      { sku: 'LH-TH-001-60V', name: 'Hộp 60 viên', price: 165000, compareAtPrice: 225000, optionValues: { 'size': 'Hộp 60 viên' } },
    ],
  },
  {
    name: 'Tiêu Hóa Khang', slug: 'tieu-hoa-khang',
    description: 'Tiêu Hóa Khang hỗ trợ tăng cường chức năng tiêu hóa, giảm đầy bụng, khó tiêu sau bữa ăn.',
    categoryCode: 'TH', seq: 2,
    variants: [
      { sku: 'LH-TH-002-30V', name: 'Hộp 30 viên', price: 75000, compareAtPrice: 100000, optionValues: { 'size': 'Hộp 30 viên' } },
      { sku: 'LH-TH-002-60V', name: 'Hộp 60 viên', price: 130000, compareAtPrice: 175000, optionValues: { 'size': 'Hộp 60 viên' } },
    ],
  },
  {
    name: 'Bình Vị Thái', slug: 'binh-vi-thai',
    description: 'Bình Vị Thái hỗ trợ giảm đau dạ dày, trung hòa acid, bảo vệ niêm mạc dạ dày khỏi viêm loét.',
    categoryCode: 'TH', seq: 3,
    variants: [
      { sku: 'LH-TH-003-30V', name: 'Hộp 30 viên', price: 85000, compareAtPrice: 115000, optionValues: { 'size': 'Hộp 30 viên' } },
      { sku: 'LH-TH-003-60V', name: 'Hộp 60 viên', price: 150000, compareAtPrice: 205000, optionValues: { 'size': 'Hộp 60 viên' } },
    ],
  },

  // ── An Thần Ngủ Ngon ────────────────────────────────────────
  {
    name: 'Ngủ Ngon Thảo Mộc', slug: 'ngu-ngon-thao-moc',
    description: 'Ngủ Ngon Thảo Mộc giúp cải thiện chất lượng giấc ngủ, giảm căng thẳng, mệt mỏi với các thảo dược tự nhiên.',
    categoryCode: 'AT', seq: 1,
    variants: [
      { sku: 'LH-AT-001-30V', name: 'Hộp 30 viên', price: 110000, compareAtPrice: 150000, optionValues: { 'size': 'Hộp 30 viên' } },
      { sku: 'LH-AT-001-60V', name: 'Hộp 60 viên', price: 195000, compareAtPrice: 265000, optionValues: { 'size': 'Hộp 60 viên' } },
    ],
  },
  {
    name: 'An Thần Tâm Bình', slug: 'an-than-tam-binh',
    description: 'An Thần Tâm Bình hỗ trợ an thần, giảm lo âu, giúp tinh thần thư thái và dễ đi vào giấc ngủ.',
    categoryCode: 'AT', seq: 2,
    variants: [
      { sku: 'LH-AT-002-30V', name: 'Hộp 30 viên', price: 125000, compareAtPrice: 170000, optionValues: { 'size': 'Hộp 30 viên' } },
      { sku: 'LH-AT-002-60V', name: 'Hộp 60 viên', price: 220000, compareAtPrice: 300000, optionValues: { 'size': 'Hộp 60 viên' } },
    ],
  },
  {
    name: 'Dưỡng Tâm An Thần', slug: 'duong-tam-an-than',
    description: 'Dưỡng Tâm An Thần bồi bổ tâm huyết, giúp ngủ sâu giấc, giảm hồi hộp trống ngực do suy nhược thần kinh.',
    categoryCode: 'AT', seq: 3,
    variants: [
      { sku: 'LH-AT-003-30V', name: 'Hộp 30 viên', price: 135000, compareAtPrice: 185000, optionValues: { 'size': 'Hộp 30 viên' } },
      { sku: 'LH-AT-003-60V', name: 'Hộp 60 viên', price: 235000, compareAtPrice: 320000, optionValues: { 'size': 'Hộp 60 viên' } },
    ],
  },
]

async function main() {
  // Xóa data cũ (chỉ catalog, không xóa users/orders)
  await prisma.productAttributeValue.deleteMany()
  await prisma.stockItem.deleteMany()
  await prisma.productVariant.deleteMany()
  await prisma.productImage.deleteMany()
  await prisma.product.deleteMany()
  await prisma.attributeDefinition.deleteMany()
  await prisma.category.deleteMany()

  // Categories
  const categoryMap: Record<string, string> = {}
  for (const cat of CATEGORIES) {
    const { code, ...data } = cat
    const created = await prisma.category.create({ data })
    categoryMap[code] = created.id
  }

  // Warehouse
  let warehouse = await prisma.warehouse.findFirst()
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: { name: 'Kho Hà Nội', address: 'Hà Nội', isActive: true },
    })
  }

  for (const p of PRODUCTS) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        categoryId: categoryMap[p.categoryCode],
        description: p.description,
        thumbnailUrl: `https://placehold.co/400x400/1b4332/ffffff?text=${encodeURIComponent(p.name)}`,
        isPublished: true,
      },
    })

    const variants = await Promise.all(
      p.variants.map((v) =>
        prisma.productVariant.create({
          data: {
            productId: product.id,
            sku: v.sku,
            name: v.name,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            optionValues: v.optionValues,
          },
        }),
      ),
    )

    // Stock cho mỗi variant
    for (const v of variants) {
      await prisma.stockItem.create({
        data: {
          warehouseId: warehouse.id,
          productVariantId: v.id,
          qtyOnHand: 100,
          qtyReserved: 0,
          reorderThreshold: 10,
        },
      })
    }

    // Product image
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: `https://placehold.co/600x600/1b4332/ffffff?text=${encodeURIComponent(p.name)}`,
        sortOrder: 0,
      },
    })
  }

  // ── Reference Prices ──────────────────────────────────────────
  const referencePrices: { productName: string; minPrice: number; maxPrice: number; source: string; category: string }[] = [
    // Từ seed products
    { productName: 'Ích Tâm Khang', minPrice: 150000, maxPrice: 180000, source: 'Nhà thuốc Long Châu, Pharmacity', category: 'Tim Mạch' },
    { productName: 'Hạnh Phúc Huyết Áp', minPrice: 110000, maxPrice: 135000, source: 'Nhà thuốc Long Châu', category: 'Tim Mạch' },
    { productName: 'Hoạt Huyết Dưỡng Não', minPrice: 130000, maxPrice: 160000, source: 'Nhà thuốc Pharmacity, An Khang', category: 'Tim Mạch' },
    { productName: 'Cốt Thoái Vương', minPrice: 120000, maxPrice: 150000, source: 'Nhà thuốc Long Châu, Pharmacity', category: 'Xương Khớp' },
    { productName: 'Khớp Tâm Bình', minPrice: 100000, maxPrice: 125000, source: 'Nhà thuốc An Khang', category: 'Xương Khớp' },
    { productName: 'Xương Khớp Vàng', minPrice: 140000, maxPrice: 170000, source: 'Nhà thuốc Long Châu', category: 'Xương Khớp' },
    { productName: 'Tràng Phục Linh', minPrice: 85000, maxPrice: 110000, source: 'Nhà thuốc Pharmacity, An Khang', category: 'Tiêu Hóa' },
    { productName: 'Tiêu Hóa Khang', minPrice: 65000, maxPrice: 85000, source: 'Nhà thuốc Long Châu', category: 'Tiêu Hóa' },
    { productName: 'Bình Vị Thái', minPrice: 75000, maxPrice: 100000, source: 'Nhà thuốc An Khang', category: 'Tiêu Hóa' },
    { productName: 'Ngủ Ngon Thảo Mộc', minPrice: 100000, maxPrice: 125000, source: 'Nhà thuốc Pharmacity', category: 'An Thần' },
    { productName: 'An Thần Tâm Bình', minPrice: 110000, maxPrice: 135000, source: 'Nhà thuốc Long Châu, An Khang', category: 'An Thần' },
    { productName: 'Dưỡng Tâm An Thần', minPrice: 120000, maxPrice: 150000, source: 'Nhà thuốc Pharmacity', category: 'An Thần' },
    // Thuốc OTC phổ biến
    { productName: 'Panadol Extra', minPrice: 25000, maxPrice: 45000, source: 'Nhà thuốc Long Châu, Pharmacity', category: 'Giảm đau hạ sốt' },
    { productName: 'Panadol Extra Caffeine', minPrice: 30000, maxPrice: 50000, source: 'Nhà thuốc Long Châu', category: 'Giảm đau hạ sốt' },
    { productName: 'Panadol 500mg', minPrice: 15000, maxPrice: 35000, source: 'Nhà thuốc Pharmacity, An Khang', category: 'Giảm đau hạ sốt' },
    { productName: 'Efferalgan 500mg', minPrice: 20000, maxPrice: 40000, source: 'Nhà thuốc Long Châu', category: 'Giảm đau hạ sốt' },
    { productName: 'Tiffy', minPrice: 15000, maxPrice: 25000, source: 'Nhà thuốc Pharmacity', category: 'Cảm cúm' },
    { productName: 'Decolgen', minPrice: 12000, maxPrice: 22000, source: 'Nhà thuốc An Khang', category: 'Cảm cúm' },
    { productName: 'Augmentin 625mg', minPrice: 80000, maxPrice: 150000, source: 'Nhà thuốc Long Châu', category: 'Kháng sinh' },
    { productName: 'Amoxicillin 500mg', minPrice: 20000, maxPrice: 50000, source: 'Nhà thuốc Pharmacity', category: 'Kháng sinh' },
    { productName: 'Omeprazole 20mg', minPrice: 15000, maxPrice: 40000, source: 'Nhà thuốc An Khang', category: 'Dạ dày' },
    { productName: 'Nexium Mups 20mg', minPrice: 80000, maxPrice: 150000, source: 'Nhà thuốc Long Châu', category: 'Dạ dày' },
    // TPCN bổ sung
    { productName: 'Tinh dầu hoa anh thảo', minPrice: 180000, maxPrice: 350000, source: 'Nhà thuốc Pharmacity', category: 'Thực phẩm chức năng' },
    { productName: 'Glucosamine 1500mg', minPrice: 200000, maxPrice: 400000, source: 'Nhà thuốc Long Châu', category: 'Xương Khớp' },
    { productName: 'Vitamin C 1000mg', minPrice: 80000, maxPrice: 200000, source: 'Nhà thuốc An Khang', category: 'Vitamin' },
    { productName: 'Omega 3 EPA/DHA', minPrice: 150000, maxPrice: 350000, source: 'Nhà thuốc Pharmacity', category: 'Tim Mạch' },
    { productName: 'Canxi cá tuyết', minPrice: 120000, maxPrice: 280000, source: 'Nhà thuốc Long Châu', category: 'Xương Khớp' },
    { productName: 'Bổ não PQA', minPrice: 85000, maxPrice: 150000, source: 'Nhà thuốc Pharmacity, An Khang', category: 'Thần kinh' },
    { productName: 'Hoạt huyết thông mạch', minPrice: 95000, maxPrice: 160000, source: 'Nhà thuốc Long Châu', category: 'Tim Mạch' },
    { productName: 'Sâm nhung bổ thận', minPrice: 200000, maxPrice: 350000, source: 'Nhà thuốc Pharmacity', category: 'Thận' },
    { productName: 'Ích mẫu thảo', minPrice: 60000, maxPrice: 100000, source: 'Nhà thuốc An Khang', category: 'Phụ khoa' },
    { productName: 'Diệp hạ châu', minPrice: 50000, maxPrice: 90000, source: 'Nhà thuốc Long Châu', category: 'Gan' },
  ]

  for (const rp of referencePrices) {
    await prisma.referencePrice.upsert({
      where: { productName: rp.productName },
      update: { minPrice: rp.minPrice, maxPrice: rp.maxPrice, source: rp.source, category: rp.category },
      create: rp,
    })
  }

  // ── Page Builder: Trang "Về chúng tôi" (about-us) ──────────────────────
  const ABOUT_PAGE = 'about-us'
  const pageBlocks: { type: string; content: Record<string, unknown>; order: number }[] = [
    {
      type: 'hero',
      content: {
        title: 'LocHerbal — Thảo dược thiên nhiên',
        subtitle: 'Kết hợp bài thuốc cổ truyền với công nghệ hiện đại, mang sức khỏe xanh đến từng gia đình Việt.',
        backgroundImageUrl: 'https://placehold.co/1920x720/1b4332/ffffff?text=LocHerbal',
        ctaText: 'Khám phá sản phẩm',
        ctaLink: '/products',
      },
      order: 0,
    },
    {
      type: 'text',
      content: {
        heading: 'Câu chuyện thương hiệu',
        body: 'LocHerbal được thành lập với sứ mệnh mang tinh hoa y học cổ truyền Việt Nam đến gần hơn với người dùng hiện đại. Chúng tôi tuyển chọn các dược liệu sạch từ vùng trồng uy tín trên cả nước, kết hợp nghiên cứu khoa học hiện đại để tạo ra những sản phẩm chăm sóc sức khỏe an toàn và hiệu quả.',
      },
      order: 1,
    },
    {
      type: 'stats',
      content: {
        items: [
          { number: '200+', label: 'Dòng sản phẩm' },
          { number: '50K+', label: 'Khách hàng tin dùng' },
          { number: '10+', label: 'Năm kinh nghiệm' },
          { number: '98%', label: 'Đánh giá hài lòng' },
        ],
      },
      order: 2,
    },
    {
      type: 'image-text',
      content: {
        imageUrl: 'https://placehold.co/800x600/2d6a4f/ffffff?text=Thao%20duoc',
        imagePosition: 'left',
        heading: 'Cam kết từ nhà sản xuất',
        body: 'Mọi sản phẩm LocHerbal đều đạt chuẩn GMP, nguyên liệu có nguồn gốc rõ ràng, được kiểm nghiệm chất lượng trước khi đến tay người dùng.',
      },
      order: 3,
    },
    {
      type: 'timeline',
      content: {
        milestones: [
          { year: '2016', title: 'Thành lập', description: 'LocHerbal ra đời từ đam mê y học cổ truyền.' },
          { year: '2019', title: 'Mở rộng sản xuất', description: 'Nhà máy đạt chuẩn GMP-WHO, đáp ứng nhu cầu toàn quốc.' },
          { year: '2024', title: 'Thương mại điện tử', description: 'Ra mắt nền tảng bán hàng trực tuyến LocHerbal.' },
        ],
      },
      order: 4,
    },
  ]

  // Chỉ tạo lại blocks cho about-us (không đụng các trang khác)
  await prisma.pageBlock.deleteMany({ where: { page: ABOUT_PAGE } })
  await prisma.pageBlock.createMany({
    data: pageBlocks.map((b) => ({ page: ABOUT_PAGE, type: b.type, content: b.content as object, order: b.order })),
  })

  console.log(`✅ Seed hoàn tất: ${CATEGORIES.length} categories, ${PRODUCTS.length} products, ${PRODUCTS.reduce((s, p) => s + p.variants.length, 0)} variants, ${referencePrices.length} reference prices, ${pageBlocks.length} page blocks (${ABOUT_PAGE})`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
