import { PrismaClient, OrderStatus, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:4000';
const TEST_PASSWORD = 'Test1234!';

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

async function register(email: string, fullName: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: TEST_PASSWORD, fullName, phone: '0900000000' }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(`Đăng ký thất bại cho ${email}: ${JSON.stringify(json)}`);
    return json;
}

async function login(email: string): Promise<{ accessToken: string; refreshCookie: string }> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: TEST_PASSWORD }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(`Login thất bại cho ${email}: ${JSON.stringify(json)}`);

    const setCookie = res.headers.get('set-cookie') || '';
    const refreshCookie = setCookie
        .split(',')
        .map((c) => c.trim())
        .find((c) => c.startsWith('refresh_token='));

    if (!refreshCookie) {
        throw new Error(`Không tìm thấy refresh_token cookie cho ${email}`);
    }

    return { accessToken: json.accessToken, refreshCookie };
}

async function getProducts(): Promise<any> {
    const res = await fetch(`${BASE_URL}/products?limit=1`);
    const json = await res.json();
    if (!res.ok || !Array.isArray(json) || json.length === 0) {
        throw new Error(`Không lấy được sản phẩm: ${JSON.stringify(json)}`);
    }
    return json[0];
}

async function addToCart(accessToken: string, productVariantId: string, qty = 1): Promise<any> {
    const res = await fetch(`${BASE_URL}/cart/items`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ productVariantId, qty }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(`Thêm vào giỏ thất bại: ${JSON.stringify(json)}`);
    return json;
}

async function checkout(accessToken: string, addressId?: string): Promise<any> {
    const body: any = {};
    if (addressId) {
        body.addressId = addressId;
    }

    const res = await fetch(`${BASE_URL}/cart/checkout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
        return { status: res.status, error: json };
    }
    return { status: res.status, data: json };
}

async function createAddressDirect(prismaInstance: typeof prisma, customerId: string) {
    return prismaInstance.customerAddress.create({
        data: {
            customerId,
            recipientName: 'Customer X',
            phone: '0911111111',
            addressLine: '123 Đường ABC',
            ward: 'Phường 1',
            district: 'Quận 1',
            province: 'TP.HCM',
            isDefault: true,
        },
    });
}

async function cleanup(emails: string[]) {
    const users = await prisma.user.findMany({ where: { email: { in: emails } } });
    const userIds = users.map((u) => u.id);
    const customers = await prisma.customer.findMany({ where: { userId: { in: userIds } } });
    const customerIds = customers.map((c) => c.id);

    await prisma.orderStatusHistory.deleteMany({ where: { order: { customerId: { in: customerIds } } } });
    await prisma.order.deleteMany({ where: { customerId: { in: customerIds } } });
    await prisma.cartItem.deleteMany({ where: { cart: { customerId: { in: customerIds } } } });
    await prisma.cart.deleteMany({ where: { customerId: { in: customerIds } } });
    await prisma.customerAddress.deleteMany({ where: { customerId: { in: customerIds } } });
    await prisma.customer.deleteMany({ where: { id: { in: customerIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

async function main() {
    const emailCustomerMain = `checkout-main-${Date.now()}@locherbal.local`;
    const emailCustomerX = `checkout-x-${Date.now()}@locherbal.local`;
    const emailAttacker = `checkout-attacker-${Date.now()}@locherbal.local`;

    const emailsToCleanup = [emailCustomerMain, emailCustomerX, emailAttacker];

    try {
        console.log('=== Bước 1: Đăng ký Customer chính ===');
        const mainUser = await register(emailCustomerMain, 'Checkout Main Customer');
        console.log(`Đăng ký thành công: ${emailCustomerMain}\n`);

        console.log('=== Bước 2: Đăng nhập Customer chính ===');
        const mainSession = await login(emailCustomerMain);
        console.log(`Đăng nhập thành công: ${emailCustomerMain}\n`);

        console.log('=== Bước 3: Lấy sản phẩm ===');
        const product = await getProducts();
        const productVariantId = product.variants[0].id;
        console.log(`Sản phẩm: ${product.name} | Variant: ${productVariantId}\n`);

        console.log('=== Bước 4: Thêm sản phẩm vào giỏ ===');
        const cart = await addToCart(mainSession.accessToken, productVariantId, 1);
        console.log(`Thêm vào giỏ thành công. Cart: ${cart.id || 'OK'}\n`);

        console.log('=== Bước 5: Checkout KHÔNG addressId (kỳ vọng 201, không phải 401) ===');
        const checkoutResult = await checkout(mainSession.accessToken, undefined);
        report(
            'Checkout không addressId thành công',
            checkoutResult.status === 201,
            `Status: ${checkoutResult.status}`
        );

        console.log('\n=== Bước 6: Tạo Customer X + địa chỉ ===');
        const customerX = await register(emailCustomerX, 'Customer X');
        const customerXPrisma = await prisma.customer.findFirst({
            where: { userId: customerX.id },
            select: { id: true },
        });
        if (!customerXPrisma) throw new Error('Không tìm thấy Customer X vừa tạo');
        const addressX = await createAddressDirect(prisma, customerXPrisma.id);
        console.log(`Customer X: ${emailCustomerX} | AddressId: ${addressX.id}\n`);

        console.log('=== Bước 7: Tạo Attacker + thêm giỏ + checkout với addressId của X (kỳ vọng 400) ===');
        const attackerUser = await register(emailAttacker, 'Attacker');
        const attackerSession = await login(emailAttacker);
        await addToCart(attackerSession.accessToken, productVariantId, 1);
        const attackerCheckout = await checkout(attackerSession.accessToken, addressX.id);
        report(
            'Attacker checkout với addressId của người khác bị chặn',
            attackerCheckout.status === 400,
            `Status: ${attackerCheckout.status}`
        );

        console.log('\n=== Bước 8 (bổ sung): Test refresh token với cookie thủ công ===');
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                Cookie: mainSession.refreshCookie,
            },
        });
        const refreshJson = await refreshRes.json();
        report(
            'Refresh token với cookie thủ công thành công',
            refreshRes.status === 200,
            `Status: ${refreshRes.status} | Body: ${JSON.stringify(refreshJson)}`
        );

        console.log(`\n========================================`);
        console.log(`KẾT QUẢ: ${pass} PASS / ${fail} FAIL`);
        console.log(`========================================`);
    } catch (error) {
        console.error('LỖI KHI CHẠY TEST:', error);
        process.exitCode = 1;
    } finally {
        console.log('\n=== Dọn dẹp dữ liệu test ===');
        await cleanup(emailsToCleanup);
        console.log('Đã xóa sạch dữ liệu test.');
        await prisma.$disconnect();
    }
}

main();