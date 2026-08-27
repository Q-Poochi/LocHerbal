const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const hashAdmin = await bcrypt.hash('Test1234!', 10);
  const hashUser = await bcrypt.hash('Test@123456', 10);
  await prisma.user.updateMany({ where: { email: 'rbac-admin-test@locherbal.local' }, data: { passwordHash: hashAdmin } });
  await prisma.user.updateMany({ where: { email: 'test2@locherbal.com' }, data: { passwordHash: hashUser } });
  console.log('Updated passwords successfully');
}
main().finally(() => prisma.$disconnect());