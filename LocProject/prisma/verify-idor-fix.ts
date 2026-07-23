import { PrismaClient, OrderStatus, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:4000';
const TEST_PASSWORD = 'Test1234!';
const EMAIL_A = 'idor-customer-a@locherbal.local';
const EMAIL_B = 'idor-customer-b@locherbal.local';

let pass = 0;
let fail = 0;

function report(name: string, condition: boolean, detail: string) {
  if (condition) {
    console.log(`✅ PASS - ${name}`);
    pass++;
  } else {
    console.log(`❌ FAIL - ${name}`);
    fail++;
  }
  console.log(`   ${detail}`);
}

async function login(email: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: TEST_PASSWORD }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Login thất bại cho ${email}: ${JSON.stringify(json)}`);
  return json.accessToken;
}

async function seed() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

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

  const userB = await prisma.user.upsert({
    where: { email: EMAIL_B },
    update: { passwordHash },
    create: { email: EMAIL_B, passwordHash, fullName: 'IDOR Test Customer B', status: 'ACTIVE' },
  });
  await prisma.customer.upsert({
    where: { userId: userB.id },
    update: {},
    create: { userId: userB.id, fullName: 'IDOR Test Customer B', email: EMAIL_B },
  });

  const order = await prisma.order.create({
    data: {
      orderCode: `IDOR-TEST-${Date.now()}`,
      customerId: customerA.id,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      subtotal: 100000,
      discountAmount: 0,
      shippingFee: 0,
      totalAmount: 100000,
    },
  });

  return { orderId: order.id };
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
}

async function main() {
  console.log('=== Bước 1: Seed dữ liệu test ===');
  const { orderId } = await seed();
  console.log(`Order của Customer A: ${orderId}\n`);

  console.log('=== Bước 2: Đăng nhập 2 tài khoản ===');
  const tokenA = await login(EMAIL_A);
  const tokenB = await login(EMAIL_B);
  console.log('Đăng nhập thành công cả A và B\n');

  console.log('=== TEST 1: Customer B GET đơn hàng của A (kỳ vọng 404) ===');
  const res1 = await fetch(`${BASE_URL}/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const body1 = await res1.json();
  report('GET /orders/{id} bị chặn đúng', res1.status === 404, `Status: ${res1.status} | Body: ${JSON.stringify(body1)}`);

  console.log('\n=== TEST 2: Customer B hủy đơn hàng của A (kỳ vọng 404) ===');
  const res2 = await fetch(`${BASE_URL}/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
    body: JSON.stringify({ note: 'idor-test-attempt' }),
  });
  const body2 = await res2.json();
  report('POST /orders/{id}/cancel bị chặn đúng', res2.status === 404, `Status: ${res2.status} | Body: ${JSON.stringify(body2)}`);

  console.log('\n=== TEST 3: Xác nhận đơn hàng của A vẫn PENDING (chưa bị B hủy) ===');
  const orderInDb = await prisma.order.findUnique({ where: { id: orderId } });
  report('Đơn hàng vẫn giữ nguyên trạng thái PENDING', orderInDb?.status === 'PENDING', `Status thực tế trong DB: ${orderInDb?.status}`);

  console.log('\n=== TEST 4 (đối chứng): Customer A tự xem đơn của mình (kỳ vọng 200) ===');
  const res4 = await fetch(`${BASE_URL}/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  report('Chủ đơn hàng vẫn xem được bình thường', res4.status === 200, `Status: ${res4.status}`);

  console.log(`\n========================================`);
  console.log(`KẾT QUẢ: ${pass} PASS / ${fail} FAIL`);
  console.log(`========================================`);
}

main()
  .catch((e) => {
    console.error('LỖI KHI CHẠY TEST:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    console.log('\n=== Dọn dẹp dữ liệu test ===');
    await cleanup();
    console.log('Đã xóa sạch dữ liệu test.');
    await prisma.$disconnect();
  });
