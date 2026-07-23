import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('=== Backfill Missing Customers ===\n');

    const usersWithoutCustomer = await prisma.user.findMany({
        where: {
            customer: null,
        },
        select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
        },
    });

    console.log(`Tìm thấy ${usersWithoutCustomer.length} user chưa có Customer liên kết\n`);

    if (usersWithoutCustomer.length === 0) {
        console.log('Không cần backfill, thoát.');
        await prisma.$disconnect();
        return;
    }

    let backfilled = 0;
    let failed = 0;

    for (const user of usersWithoutCustomer) {
        try {
            await prisma.customer.create({
                data: {
                    userId: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    phone: user.phone,
                },
            });
            backfilled++;
            console.log(`✅ Đã tạo Customer cho user: ${user.email} (${user.id})`);
        } catch (error) {
            failed++;
            console.error(`❌ Lỗi khi tạo Customer cho user ${user.email}:`, error);
        }
    }

    console.log(`\n=== KẾT QUẢ BACKFILL ===`);
    console.log(`Tổng user đã xử lý: ${usersWithoutCustomer.length}`);
    console.log(`Thành công: ${backfilled}`);
    console.log(`Thất bại: ${failed}`);
}

main()
    .catch((error) => {
        console.error('LỖI KHI CHẠY BACKFILL:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });