const { PrismaClient } = require('C:/Project/LocHerbal/LocProject/node_modules/@prisma/client');
const p = new PrismaClient();
async function run() {
  const stock = await p.stockItem.findMany({
    include: { variant: { select: { sku: true, name: true } } },
    take: 20
  });
  console.log(JSON.stringify(stock, null, 2));
  await p.$disconnect();
}
run();