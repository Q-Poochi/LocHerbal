import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

async function main() {
    const staleItems: any[] = await prisma.$queryRaw`
    SELECT ci.id, ci.qty, si.qty_on_hand - si.qty_reserved AS available
    FROM cart_items ci
    JOIN product_variants pv ON ci.product_variant_id = pv.id
    JOIN stock_items si ON si.product_variant_id = pv.id
    WHERE ci.qty > (si.qty_on_hand - si.qty_reserved)
  `;

    console.log('=== CART ITEMS VƯỢT TỒN KHO ===');
    if (staleItems.length === 0) {
        console.log('Không có cart item nào vượt tồn kho.');
    } else {
        console.log(JSON.stringify(staleItems, null, 2));
        console.log(`Tổng số: ${staleItems.length}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());