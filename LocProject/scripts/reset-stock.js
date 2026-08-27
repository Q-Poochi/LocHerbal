const { PrismaClient } = require('C:/Project/LocHerbal/LocProject/node_modules/@prisma/client');
const p = new PrismaClient();
async function run() {
  const updated = await p.stockItem.updateMany({
    data: {
      qtyOnHand: 500,
      qtyReserved: 0
    }
  });
  console.log('Reset stock for items count:', updated.count);

  // Xóa sạch giỏ hàng cũ của tất cả users
  const deletedItems = await p.cartItem.deleteMany({});
  console.log('Cleared cart items:', deletedItems.count);

  await p.$disconnect();
}
run();