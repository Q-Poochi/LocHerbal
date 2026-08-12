import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

async function main() {
    const banners = await prisma.banner.findMany({
        orderBy: { sortOrder: 'asc' },
    });

    console.log('=== TẤT CẢ BANNERS TRONG DB ===');
    if (banners.length === 0) {
        console.log('KHÔNG CÓ banner nào trong DB!');
    } else {
        banners.forEach((b) => {
            console.log(JSON.stringify({
                id: b.id,
                title: b.title,
                position: b.position,
                isActive: b.isActive,
                sortOrder: b.sortOrder,
                imageUrl: b.imageUrl?.substring(0, 80),
                linkUrl: b.linkUrl,
            }, null, 2));
        });
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());