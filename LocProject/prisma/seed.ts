import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    // Xóa data cũ (chỉ catalog, không xóa users/orders)
    await prisma.productAttributeValue.deleteMany()
    await prisma.stockItem.deleteMany()
    await prisma.productVariant.deleteMany()
    await prisma.product.deleteMany()
    await prisma.attributeDefinition.deleteMany()
    await prisma.category.deleteMany()

    // Categories
    const categories = await Promise.all([
        prisma.category.create({
            data: {
                name: 'Tim Mạch', slug: 'tim-mach',
                description: 'Sản phẩm hỗ trợ sức khỏe tim mạch'
            }
        }),
        prisma.category.create({
            data: {
                name: 'Xương Khớp', slug: 'xuong-khop',
                description: 'Sản phẩm hỗ trợ xương khớp'
            }
        }),
        prisma.category.create({
            data: {
                name: 'Tiêu Hóa', slug: 'tieu-hoa',
                description: 'Sản phẩm hỗ trợ tiêu hóa'
            }
        }),
        prisma.category.create({
            data: {
                name: 'An Thần Ngủ Ngon', slug: 'an-than-ngu-ngon',
                description: 'Sản phẩm hỗ trợ giấc ngủ'
            }
        }),
    ])

    // Warehouse
    let warehouse = await prisma.warehouse.findFirst()
    if (!warehouse) {
        warehouse = await prisma.warehouse.create({
            data: { name: 'Kho Hà Nội', address: 'Hà Nội', isActive: true }
        })
    }

    // Products cho từng category
    const products = [
        // Tim Mạch
        {
            name: 'Ích Tâm Khang', slug: 'ich-tam-khang',
            categoryIdx: 0, price: 450000, compareAt: 517500
        },
        {
            name: 'Hạnh Phúc Huyết Áp', slug: 'hanh-phuc-huyet-ap',
            categoryIdx: 0, price: 320000, compareAt: 368000
        },
        {
            name: 'Hoạt Huyết Dưỡng Não', slug: 'hoat-huyet-duong-nao',
            categoryIdx: 0, price: 380000, compareAt: 437000
        },
        // Xương Khớp
        {
            name: 'Cốt Thoái Vương', slug: 'cot-thoai-vuong',
            categoryIdx: 1, price: 350000, compareAt: 402500
        },
        {
            name: 'Khớp Tâm Bình', slug: 'khop-tam-binh',
            categoryIdx: 1, price: 280000, compareAt: 322000
        },
        {
            name: 'Xương Khớp Vàng', slug: 'xuong-khop-vang',
            categoryIdx: 1, price: 420000, compareAt: 483000
        },
        // Tiêu Hóa
        {
            name: 'Tràng Phục Linh', slug: 'trang-phuc-linh',
            categoryIdx: 2, price: 260000, compareAt: 299000
        },
        {
            name: 'Tiêu Hóa Khang', slug: 'tieu-hoa-khang',
            categoryIdx: 2, price: 180000, compareAt: 207000
        },
        {
            name: 'Bình Vị Thái', slug: 'binh-vi-thai',
            categoryIdx: 2, price: 220000, compareAt: 253000
        },
        // An Thần
        {
            name: 'Ngủ Ngon Thảo Mộc', slug: 'ngu-ngon-thao-moc',
            categoryIdx: 3, price: 290000, compareAt: 333500
        },
        {
            name: 'An Thần Tâm Bình', slug: 'an-than-tam-binh',
            categoryIdx: 3, price: 310000, compareAt: 356500
        },
        {
            name: 'Dưỡng Tâm An Thần', slug: 'duong-tam-an-than',
            categoryIdx: 3, price: 340000, compareAt: 391000
        },
    ]

    for (const p of products) {
        const product = await prisma.product.create({
            data: {
                name: p.name,
                slug: p.slug,
                categoryId: categories[p.categoryIdx].id,
                description: `Sản phẩm thảo dược thiên nhiên ${p.name}, được nghiên cứu bởi các chuyên gia y học cổ truyền.`,
                isPublished: true,
            }
        })

        // 2 variants mỗi sản phẩm
        const variants = await Promise.all([
            prisma.productVariant.create({
                data: {
                    productId: product.id,
                    sku: `${p.slug.toUpperCase()}-30`,
                    name: 'Hộp 30 viên',
                    price: p.price,
                    compareAtPrice: p.compareAt,
                }
            }),
            prisma.productVariant.create({
                data: {
                    productId: product.id,
                    sku: `${p.slug.toUpperCase()}-60`,
                    name: 'Hộp 60 viên',
                    price: p.price * 1.8,
                    compareAtPrice: p.compareAt * 1.8,
                }
            }),
        ])

        // Stock cho mỗi variant
        for (const v of variants) {
            await prisma.stockItem.create({
                data: {
                    warehouseId: warehouse.id,
                    productVariantId: v.id,
                    qtyOnHand: 100,
                    qtyReserved: 0,
                    reorderThreshold: 10,
                }
            })
        }
    }

    console.log('✅ Seed hoàn tất: 4 categories, 12 products, 24 variants, 24 stock items')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())