// Test Prisma access cho race-test evidence
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const stock = await prisma.stockItem.findFirst({
    where: { variant: { sku: 'TEST-001' } },
    include: { variant: { select: { sku: true } } },
  });
  console.log('TEST-001 stock:', JSON.stringify(stock && {
    qtyOnHand: stock.qtyOnHand,
    qtyReserved: stock.qtyReserved,
    qtyAvailable: stock.qtyAvailable,
    sku: stock.variant?.sku,
  }));
  const users = await prisma.user.count({ where: { email: { contains: 'race-' } } });
  console.log('seeded race users:', users);
  await prisma.$disconnect();
})().catch((e) => { console.error('ERR:', e.message); process.exit(1); });