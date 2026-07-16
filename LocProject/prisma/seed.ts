import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Đếm số records được tạo để báo cáo
const counts = {
    categories: 0,
    products: 0,
    variants: 0,
    images: 0,
    stockItems: 0,
};

async function main() {
    // --------------------------------------------------------------------------
    // 0. Xóa sạch dữ liệu catalog cũ (để chạy seed lại nhiều lần không lỗi unique)
    //    Xóa theo thứ tự con → cha (tránh vi phạm FK).
    // --------------------------------------------------------------------------
    await prisma.stockItem.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.productAttributeValue.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.warehouse.deleteMany();

    // --------------------------------------------------------------------------
    // 1. Kho (StockItem cần warehouseId)
    // --------------------------------------------------------------------------
    const warehouse = await prisma.warehouse.create({
        data: {
            name: 'Kho chính LocHerbal',
            address: 'Số 1, Đường Herbal, Hà Nội',
            isActive: true,
        },
    });

    // --------------------------------------------------------------------------
    // 2. Categories (4 cái)
    // --------------------------------------------------------------------------
    const categoryDefs = [
        { name: 'Xương khớp', slug: 'xuong-khop' },
        { name: 'Tim Mạch', slug: 'tim-mach' },
        { name: 'Tiêu hóa', slug: 'tieu-hoa' },
        { name: 'An thần ngủ ngon', slug: 'an-than-ngu-ngon' },
    ];

    const categories: Record<string, { id: string }> = {};
    for (const c of categoryDefs) {
        const created = await prisma.category.create({
            data: {
                name: c.name,
                slug: c.slug,
                description: `Sản phẩm thảo dược hỗ trợ ${c.name.toLowerCase()}`,
            },
        });
        categories[c.slug] = created;
        counts.categories++;
    }

    // --------------------------------------------------------------------------
    // 3. Products (8 sản phẩm thảo dược mẫu)
    // --------------------------------------------------------------------------
    const productDefs = [
        {
            name: 'Cốt Thoái Vương',
            slug: 'cot-thoai-vuong',
            categorySlug: 'xuong-khop',
            price: 350000,
            sku: 'CT-001',
            description:
                'Viên uống thảo dược hỗ trợ giảm đau nhức xương khớp, mềm mại gân cốt nhờ thành phần Độc hoạt, Tang ký sinh và các dưỡng chất tự nhiên.',
        },
        {
            name: 'Khớp Tâm Bình',
            slug: 'khhop-tam-binh',
            categorySlug: 'xuong-khop',
            price: 280000,
            sku: 'KT-002',
            description:
                'Hỗ trợ tăng cường sụn khớp, giảm viêm và cải thiện vận động hàng ngày với sự kết hợp của Glucosamin và dược liệu quý.',
        },
        {
            name: 'Ích Tâm Khang',
            slug: 'ich-tam-khang',
            categorySlug: 'tim-mach',
            price: 450000,
            sku: 'IT-003',
            description:
                'Giúp tăng cường tuần hoàn máu, hỗ trợ ổn định huyết áp và bảo vệ tim mạch nhờ bài thuốc Đông y gia truyền.',
        },
        {
            name: 'Hạnh Phúc Huyết Áp',
            slug: 'hanh-phuc-huyet-ap',
            categorySlug: 'tim-mach',
            price: 320000,
            sku: 'HP-004',
            description:
                'Thực phẩm chức năng hỗ trợ điều hòa huyết áp, giảm nguy cơ xơ vữa động mạch, an toàn cho dùng dài hạn.',
        },
        {
            name: 'Tiêu Hóa Khang',
            slug: 'tieu-hoa-khang',
            categorySlug: 'tieu-hoa',
            price: 220000,
            sku: 'TH-005',
            description:
                'Hỗ trợ kích thích tiêu hóa, giảm đầy hơi, chướng bụng và cân bằng hệ vi sinh đường ruột tự nhiên.',
        },
        {
            name: 'Bụng Khang An',
            slug: 'bung-khang-an',
            categorySlug: 'tieu-hoa',
            price: 260000,
            sku: 'BK-006',
            description:
                'Giúp bảo vệ niêm mạc dạ dày, hỗ trợ giảm ợ chua, nóng rát và tái tạo hệ tiêu hóa khỏe mạnh.',
        },
        {
            name: 'An Thần Ninh Tâm',
            slug: 'an-than-ninh-tam',
            categorySlug: 'an-than-ngu-ngon',
            price: 300000,
            sku: 'AT-007',
            description:
                'Hỗ trợ an thần, giảm căng thẳng thần kinh, giúp ngủ sâu giấc nhờ các dược liệu như Lá sen, Tâm sen, Bình vôi.',
        },
        {
            name: 'Ngủ Ngon Định Tâm',
            slug: 'ngu-ngon-dinh-tam',
            categorySlug: 'an-than-ngu-ngon',
            price: 380000,
            sku: 'NN-008',
            description:
                'Hỗ trợ cải thiện chất lượng giấc ngủ, giảm mất ngủ kinh niên, tinh thần tỉnh táo sáng khoái khi thức dậy.',
        },
    ];

    for (const p of productDefs) {
        const imageUrls = [
            `https://placehold.co/400x400?text=${encodeURIComponent(p.name)}`,
            `https://placehold.co/400x400?text=${encodeURIComponent(p.name)}+2`,
            `https://placehold.co/400x400?text=${encodeURIComponent(p.name)}+3`,
        ];

        const product = await prisma.product.create({
            data: {
                name: p.name,
                slug: p.slug,
                description: p.description,
                categoryId: categories[p.categorySlug].id,
                isPublished: true,
                thumbnailUrl: imageUrls[0],
            },
        });
        counts.products++;

        // 2-3 ProductImage
        for (let i = 0; i < imageUrls.length; i++) {
            await prisma.productImage.create({
                data: {
                    productId: product.id,
                    url: imageUrls[i],
                    sortOrder: i,
                },
            });
            counts.images++;
        }

        // 1 ProductVariant
        const variant = await prisma.productVariant.create({
            data: {
                productId: product.id,
                sku: p.sku,
                name: p.name,
                price: p.price,
                compareAtPrice: p.price * 1.15,
                optionValues: {},
            },
        });
        counts.variants++;

        // StockItem tương ứng (qtyOnHand: 50)
        await prisma.stockItem.create({
            data: {
                warehouseId: warehouse.id,
                productVariantId: variant.id,
                qtyOnHand: 50,
                qtyReserved: 0,
                reorderThreshold: 10,
            },
        });
        counts.stockItems++;
    }

    // Tạo user test
    const hashedPassword = await bcrypt.hash('Test1234!', 10);
    const customerRole = await prisma.role.upsert({
        where: { name: 'CUSTOMER' },
        update: {},
        create: { name: 'CUSTOMER' }
    });

    // Tạo user (fullName là required)
    const user = await prisma.user.upsert({
        where: { email: 'test@locherbal.com' },
        update: {},
        create: {
            email: 'test@locherbal.com',
            passwordHash: hashedPassword,
            fullName: 'Khách Test',
        }
    });

    // Tạo Customer profile (nếu chưa có)
    await prisma.customer.upsert({
        where: { userId: user.id },
        update: {},
        create: {
            userId: user.id,
            fullName: 'Khách Test',
            phone: '0901234567',
        }
    });

    // Tạo UserRole
    await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: customerRole.id } },
        update: {},
        create: {
            userId: user.id,
            roleId: customerRole.id
        }
    });

    console.log('🌱 Seed hoàn tất:');
    console.log(`   - Categories : ${counts.categories}`);
    console.log(`   - Products   : ${counts.products}`);
    console.log(`   - Variants   : ${counts.variants}`);
    console.log(`   - Images     : ${counts.images}`);
    console.log(`   - StockItems : ${counts.stockItems}`);
    console.log(`   - Users      : 1`);
}

main()
    .catch((e) => {
        console.error('❌ Seed thất bại:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });