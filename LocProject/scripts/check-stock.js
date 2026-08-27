const { PrismaClient } = require('C:/Project/LocHerbal/LocProject/node_modules/@prisma/client');
const p = new PrismaClient();
async function run() {
  const stock = await p.stockItem.findMany({ where: { productVariantId: '2dacd754-6f79-4085-9442-3c3d67574e02' } });
  console.log('Stock items for ich-tam-khang:', stock);
  await p.$disconnect();
}
run();