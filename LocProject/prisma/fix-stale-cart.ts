import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

async function main() {
    const staleItems: Array<{ id: string; qty: number; available: number }> = await prisma.$queryRaw`
    SELECT ci.id, ci.qty, si.qty_on_hand - si.qty_reserved AS available
    FROM cart_items ci
    JOIN product_variants pv ON ci.product_variant_id = pv.id
    JOIN stock_items si ON si.product_variant_id = pv.id
    WHERE ci.qty > (si.qty_on_hand - si.qty_reserved)
  `;

    console.log(`=== TÌM THẤY ${staleItems.length} CART ITEM VƯỢT TỒN KHO ===`);

    for (const item of staleItems) {
        if (item.available <= 0) {
            // Hết hàng hoàn toàn → xóa item khỏi giỏ
            await prisma.cartItem.delete({ where: { id: item.id } });
            console.log(`XÓA item ${item.id} (qty=${item.qty}, available=${item.available}) — hết hàng`);
        } else {
            // Sửa qty về đúng tồn kho khả dụng
            await prisma.cartItem.update({
                where: { id: item.id },
                data: { qty: item.available },
            });
            console.log(`SỬA item ${item.id}: qty ${item.qty} → ${item.available}`);
        }
    }

    console.log('=== DỌN XONG ===');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());