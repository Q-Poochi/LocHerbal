import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const TEST_PASSWORD = 'Test1234!';

async function main() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  // 1. Đảm bảo Role 'admin', 'staff' và 'customer' tồn tại (upsert, không tạo trùng)
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', description: 'Quản trị viên hệ thống' },
  });

  const staffRole = await prisma.role.upsert({
    where: { name: 'staff' },
    update: {},
    create: { name: 'staff', description: 'Nhân viên vận hành' },
  });

  await prisma.role.upsert({
    where: { name: 'customer' },
    update: {},
    create: { name: 'customer', description: 'Khách hàng' },
  });

  // 2. Tạo user ADMIN test (có gán role 'admin')
  const adminUser = await prisma.user.upsert({
    where: { email: 'rbac-admin-test@locherbal.local' },
    update: { passwordHash },
    create: {
      email: 'rbac-admin-test@locherbal.local',
      passwordHash,
      fullName: 'RBAC Test Admin',
      status: 'ACTIVE',
    },
  });

  // Gán role admin cho user này (nếu chưa có)
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });

  // 3. Tạo user STAFF test (gán role 'staff')
  const staffUser = await prisma.user.upsert({
    where: { email: 'rbac-staff-test@locherbal.local' },
    update: { passwordHash },
    create: {
      email: 'rbac-staff-test@locherbal.local',
      passwordHash,
      fullName: 'RBAC Test Staff',
      status: 'ACTIVE',
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: staffUser.id, roleId: staffRole.id } },
    update: {},
    create: { userId: staffUser.id, roleId: staffRole.id },
  });

  // 4. Tạo user CUSTOMER test (KHÔNG gán role nào — đại diện customer thường)
  const customerUser = await prisma.user.upsert({
    where: { email: 'rbac-customer-test@locherbal.local' },
    update: { passwordHash },
    create: {
      email: 'rbac-customer-test@locherbal.local',
      passwordHash,
      fullName: 'RBAC Test Customer',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Seed RBAC test users hoàn tất:');
  console.log(`   ADMIN    → email: ${adminUser.email} | password: ${TEST_PASSWORD} | role: admin`);
  console.log(`   STAFF    → email: ${staffUser.email} | password: ${TEST_PASSWORD} | role: staff`);
  console.log(`   CUSTOMER → email: ${customerUser.email} | password: ${TEST_PASSWORD} | role: (không có)`);
  console.log('');
  console.log('⚠️  Đây là user CHỈ DÙNG ĐỂ TEST — xóa sau khi verify xong bằng:');
  console.log(`   npx ts-node prisma/seed-rbac-test.ts --cleanup`);
}

async function cleanup() {
  const emails = [
    'rbac-admin-test@locherbal.local',
    'rbac-staff-test@locherbal.local',
    'rbac-customer-test@locherbal.local',
  ];
  const users = await prisma.user.findMany({ where: { email: { in: emails } } });
  const userIds = users.map((u) => u.id);

  await prisma.userRole.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });

  console.log('🗑️  Đã xóa toàn bộ RBAC test users.');
}

const isCleanup = process.argv.includes('--cleanup');

(isCleanup ? cleanup() : main())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
