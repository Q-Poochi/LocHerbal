const { PrismaClient } = require('C:/Project/LocHerbal/LocProject/node_modules/@prisma/client');
const p = new PrismaClient();
async function run() {
  const inv = await p.inventory.findMany({ where: { productVariantId: '2dacd754-6f79-4085-9442-3c3d67574e02' } });
  console.log('Inventory:', inv);
  await p.$disconnect();
}
run();