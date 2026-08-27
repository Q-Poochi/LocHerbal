const { PrismaClient } = require('C:/Project/LocHerbal/LocProject/node_modules/@prisma/client');
const p = new PrismaClient();
async function run() {
  const pr = await p.product.findUnique({ where: { slug: 'ich-tam-khang' }, include: { variants: true } });
  console.log(JSON.stringify(pr, null, 2));
  await p.$disconnect();
}
run();