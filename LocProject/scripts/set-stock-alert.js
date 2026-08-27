const { PrismaClient } = require('C:/Project/LocHerbal/LocProject/node_modules/@prisma/client');
const p = new PrismaClient();
async function run() {
  await p.stockItem.updateMany({
    data: {
      qtyOnHand: 500,
      qtyReserved: 0
    }
  });

  // Đặt 1 item có tồn kho thấp (3 chiếc) để test Stock Alert trên Admin Dashboard
  const firstStock = await p.stockItem.findFirst();
  if (firstStock) {
    await p.stockItem.update({
      where: { id: firstStock.id },
      data: { qtyOnHand: 3, qtyReserved: 0 }
    });
    console.log('Set low stock alert for item:', firstStock.id);
  }

  await p.$disconnect();
}
run();