import { PrismaClient, OrderStatus, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const TEST_PASSWORD = 'Test1234!';
const EMAIL_A = 'idor-customer-a@locherbal.local';
const EMAIL_B = 'idor-customer-b@locherbal.local';

async function main() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  // 1. Tạo User A + Customer A (liên kết qua userId)
  const userA = await prisma.user.upsert({
    where: { email: EMAIL_A },
    update: { passwordHash },
    create: { email: EMAIL_A, passwordHash, fullName: 'IDOR Test Customer A', status: 'ACTIVE' },
  });

  const customerA = await prisma.customer.upsert({
    where: { userId: userA.id },
    update: {},
    create: { userId: userA.id, fullName: 'IDOR Test Customer A', email: EMAIL_A },
  });

  // 2. Tạo User B + Customer B (kẻ tấn công thử nghiệm)
  const userB = await prisma.user.upsert({
    where: { email: EMAIL_B },
    update: { passwordHash },
    create: { email: EMAIL_B, passwordHash, fullName: 'IDOR Test Customer B', status: 'ACTIVE' },
  });

  const customerB = await prisma.customer.upsert({
    where: { userId: userB.id },
    update: {},
    create: { userId: userB.id, fullName: 'IDOR Test Customer B', email: EMAIL_B },
  });

  // 3. Tạo 1 Order thuộc về Customer A, status PENDING
  const orderCode = `IDOR-TEST-${Date.now()}`;
  const order = await prisma.order.create({
    data: {
      orderCode,
      customerId: customerA.id,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      subtotal: 100000,
      discountAmount: 0,
      shippingFee: 0,
      totalAmount: 100000,
    },
  });

  console.log('✅ Seed IDOR test hoàn tất:');
  console.log(`   Customer A → email: ${EMAIL_A} | password: ${TEST_PASSWORD} | customerId: ${customerA.id}`);
  console.log(`   Customer B → email: ${EMAIL_B} | password: ${TEST_PASSWORD} | customerId: ${customerB.id}`);
  console.log(`   Order của A → orderId: ${order.id} | orderCode: ${orderCode} | status: PENDING`);
  console.log('');
  console.log('⚠️  Dọn dẹp sau khi test xong: npx ts-node prisma/seed-idor-test.ts --cleanup');
}

async function cleanup() {
  const users = await prisma.user.findMany({ where: { email: { in: [EMAIL_A, EMAIL_B] } } });
  const userIds = users.map((u) => u.id);
  const customers = await prisma.customer.findMany({ where: { userId: { in: userIds } } });
  const customerIds = customers.map((c) => c.id);

  await prisma.orderStatusHistory.deleteMany({ where: { order: { customerId: { in: customerIds } } } });
  await prisma.order.deleteMany({ where: { customerId: { in: customerIds } } });
  await prisma.customer.deleteMany({ where: { id: { in: customerIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });

  console.log('🗑️  Đã xóa toàn bộ dữ liệu test IDOR (users, customers, orders).');
}

const isCleanup = process.argv.includes('--cleanup');

(isCleanup ? cleanup() : main())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
