// ── Shared library cho race-condition suite (Kịch bản 1-7) ──────────────
// API client (fetch + cookie jar + CSRF) + Prisma evidence/cleanup.
// Chạy: node audit/<script>.cjs
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const prisma = new PrismaClient();
const PASSWORD = 'Test@123456';

// ── HTTP helper với cookie jar + CSRF retry (pattern từ saga-test.cjs) ───
const jars = {}; // jar theo index user (cookie không dùng chung giữa các user)

function newJar(key) { jars[key] = { cookies: {}, csrfToken: '' }; return jars[key]; }

async function req(jar, method, path, { token, body } = {}) {
  const attempt = async () => {
    const h = { 'Content-Type': 'application/json' };
    const cookie = Object.entries(jar.cookies).map(([k, v]) => `${k}=${v}`).join('; ');
    if (cookie) h.Cookie = cookie;
    if (jar.csrfToken) h['x-csrf-token'] = jar.csrfToken;
    if (token) h.Authorization = `Bearer ${token}`;
    return fetch(`${BASE_URL}${path}`, {
      method,
      headers: h,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };
  let res = await attempt();
  if (res.status === 403 && (await res.text()).includes('CSRF')) {
    const rr = await fetch(`${BASE_URL}/auth/csrf`);
    jar.csrfToken = JSON.parse(await rr.text()).csrfToken;
    jar.cookies['csrf_token'] = jar.csrfToken;
    res = await attempt();
  }
  for (const sc of res.headers.getSetCookie ? res.headers.getSetCookie() : []) {
    const [pair] = sc.split(';');
    const eq = pair.indexOf('=');
    jar.cookies[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
  }
  let json = null;
  const text = await res.text();
  try { json = JSON.parse(text); } catch { /* empty */ }
  return { status: res.status, json, body: text.slice(0, 250) };
}

// ── API helpers ───────────────────────────────────────────────────────────
function newClient(key) { return { jar: newJar(key), token: null }; }

async function login(client, email) {
  const r = await req(client.jar, 'POST', '/auth/login', { token: client.token, body: { email, password: PASSWORD } });
  if (r.status !== 200 && r.status !== 201) throw new Error(`login ${email} → ${r.status}: ${r.body}`);
  client.token = r.json.accessToken;
  return client;
}

async function addToCart(client, variantId, qty = 1) {
  return req(client.jar, 'POST', '/cart/items', { token: client.token, body: { productVariantId: variantId, qty } });
}

async function checkout(client, i = 0) {
  return req(client.jar, 'POST', '/cart/checkout', {
    token: client.token,
    body: {
      fullName: `Race Tester ${i}`,
      phone: '0900000001',
      email: `race-${(i % 50) + 1}@locherbal.com`,
      province: 'TP. Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Bến Nghé',
      address: '123 Race Test Street',
      paymentMethod: 'COD',
    },
  });
}

async function clearCart(client, variantId) {
  return req(client.jar, 'DELETE', `/cart/items/${variantId}`, { token: client.token });
}

// ── User/Customer setup (Prisma — nhanh cho N lớn) ────────────────────────
async function ensureRaceUsers(n) {
  const hash = await bcrypt.hash(PASSWORD, 10);
  for (let i = 1; i <= n; i++) {
    const email = `race-${i}@locherbal.com`;
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { email, passwordHash: hash, fullName: `Race Tester ${i}`, emailVerified: true },
      });
    }
    const cust = await prisma.customer.findFirst({ where: { email } });
    if (!cust) {
      await prisma.customer.create({
        data: { userId: user.id, fullName: user.fullName, email, phone: `09000000${String(i).padStart(2, '0')}`.slice(0, 11) },
      });
    }
  }
}

async function loginAll(n) {
  // Dùng CHUNG 1 csrf token cho cả batch — middleware chỉ so khớp cookie vs
  // header (token không gắn với user) → tiết kiệm GET /auth/csrf, tránh dính
  // rate limit 60/phút/IP của endpoint csrf khi login >30 user liên tiếp.
  const csrfRes = await fetch(`${BASE_URL}/auth/csrf`);
  const sharedCsrf = (await csrfRes.json())?.csrfToken || '';
  const clients = [];
  for (let i = 1; i <= n; i++) {
    const c = newClient(`u${i}`);
    c.jar.csrfToken = sharedCsrf;
    c.jar.cookies['csrf_token'] = sharedCsrf;
    await login(c, `race-${i}@locherbal.com`);
    clients.push(c);
  }
  return clients;
}

// ── Test product/variant/stock (dedicated, cleanup bằng product.delete) ──
async function ensureTestVariant(sku, stockQty) {
  const warehouse = await prisma.warehouse.findFirst({ where: { isActive: true } });
  let variant = await prisma.productVariant.findUnique({ where: { sku } });
  if (!variant) {
    const cat = await prisma.category.findFirst();
    const product = await prisma.product.create({
      data: {
        categoryId: cat.id,
        name: `RACE-TEST ${sku}`,
        slug: `race-test-${sku.toLowerCase()}`,
        isPublished: true,
        variants: { create: { sku, price: 135000 } },
      },
      include: { variants: true },
    });
    variant = product.variants[0];
  }
  const stock = await prisma.stockItem.findFirst({ where: { productVariantId: variant.id } });
  if (!stock) {
    await prisma.stockItem.create({
      data: { warehouseId: warehouse.id, productVariantId: variant.id, qtyOnHand: stockQty, qtyReserved: 0 },
    });
  } else {
    await prisma.stockItem.update({ where: { id: stock.id }, data: { qtyOnHand: stockQty, qtyReserved: 0 } });
  }
  return variant.id;
}

async function getStock(variantId) {
  const s = await prisma.stockItem.findFirst({ where: { productVariantId: variantId } });
  return { qtyOnHand: s.qtyOnHand, qtyReserved: s.qtyReserved };
}

// ── Evidence ──────────────────────────────────────────────────────────────
async function orderEvidence(orderIds) {
  const orders = await prisma.order.findMany({ where: { id: { in: orderIds } }, include: { items: true } });
  return orders.map((o) => ({
    code: o.orderCode, status: o.status, allocation: o.allocationStatus,
    discount: Number(o.discountAmount),
    items: o.items.map((it) => ({ sku: it.skuSnapshot, qty: it.qty })),
  }));
}

// ── Barrier: bắn N request cùng lúc ──────────────────────────────────────
async function fireSimultaneous(count, makeRequest) {
  const go = new Promise((resolve) => setTimeout(resolve, 30));
  const jobs = Array.from({ length: count }, (_, i) =>
    go.then(() => makeRequest(i)).catch((e) => ({ status: 0, error: String(e.message || e) })),
  );
  return Promise.all(jobs);
}

// ── Cleanup ───────────────────────────────────────────────────────────────
async function cleanupOrders(orderIds) {
  if (!orderIds.length) return;
  await prisma.couponUsage.deleteMany({ where: { orderId: { in: orderIds } } });
  await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
}

async function cleanupCartsByVariant(variantId) {
  await prisma.cartItem.deleteMany({ where: { productVariantId: variantId } });
}

function printEvidence(title, before, after) {
  console.log(`  [DB] ${title} BEFORE: onHand=${before.qtyOnHand} reserved=${before.qtyReserved}`);
  console.log(`  [DB] ${title} AFTER : onHand=${after.qtyOnHand} reserved=${after.qtyReserved}`);
}

// ── Bổ sung cho kịch bản 2-7 ─────────────────────────────────────────────
// CSRF token dùng chung cho cả batch (middleware chỉ so khớp cookie vs header,
// token KHÔNG gắn với user) → tránh dính rate-limit 60/phút của GET /auth/csrf.
let sharedCsrfCache = null;
async function fetchCsrfToken() {
  if (sharedCsrfCache) return sharedCsrfCache;
  const r = await fetch(`${BASE_URL}/auth/csrf`);
  sharedCsrfCache = (await r.json())?.csrfToken || '';
  return sharedCsrfCache;
}

function bareClient(key, csrf) {
  const c = newClient(key);
  if (csrf) {
    c.jar.csrfToken = csrf;
    c.jar.cookies['csrf_token'] = csrf;
  }
  return c;
}

async function registerUser(client, { email, phone, fullName }) {
  return req(client.jar, 'POST', '/auth/register', {
    body: { email, password: PASSWORD, fullName, ...(phone ? { phone } : {}) },
  });
}

async function refreshTokens(client) {
  return req(client.jar, 'POST', '/auth/refresh', { token: client.token });
}

async function changePassword(client, currentPassword, newPassword) {
  return req(client.jar, 'POST', '/auth/change-password', {
    token: client.token,
    body: { currentPassword, newPassword },
  });
}

async function cancelOrder(client, orderId) {
  return req(client.jar, 'POST', `/orders/${orderId}/cancel`, { token: client.token });
}

// ── Session evidence (kịch bản 5/6) ──────────────────────────────────────
async function sessionStats(userId) {
  const sessions = await prisma.userSession.findMany({
    where: { userId },
    select: { id: true, jti: true, isRevoked: true },
  });
  return {
    total: sessions.length,
    revoked: sessions.filter((s) => s.isRevoked).length,
    active: sessions.filter((s) => !s.isRevoked).length,
    sessions,
  };
}

// ── Coupon test (kịch bản 2) ─────────────────────────────────────────────
async function ensureTestCoupon(code, usageLimit, discountValue = 50) {
  await prisma.couponUsage.deleteMany({ where: { coupon: { code } } });
  await prisma.coupon.deleteMany({ where: { code } });
  return prisma.coupon.create({
    data: {
      code,
      discountType: 'PERCENTAGE',
      discountValue,
      minOrderValue: 0,
      usageLimit,
      usedCount: 0,
      startDate: new Date(Date.now() - 3600_000),
      endDate: new Date(Date.now() + 86_400_000),
      isActive: true,
    },
  });
}

async function couponEvidence(code) {
  const c = await prisma.coupon.findUnique({
    where: { code },
    include: { usages: true },
  });
  return {
    usageLimit: c.usageLimit,
    usedCount: c.usedCount,
    usageRows: c.usages.length,
    distinctOrders: new Set(c.usages.map((u) => u.orderId)).size,
  };
}

// ── Cleanup người dùng test (kịch bản 4) ─────────────────────────────────
async function cleanupTestUsers(emails) {
  const users = await prisma.user.findMany({ where: { email: { in: emails } } });
  const userIds = users.map((u) => u.id);
  const customers = userIds.length
    ? await prisma.customer.findMany({ where: { userId: { in: userIds } } })
    : [];
  const customerIds = customers.map((c) => c.id);

  let orderIds = [];
  if (customerIds.length) {
    const orders = await prisma.order.findMany({
      where: { customerId: { in: customerIds } },
      select: { id: true },
    });
    orderIds = orders.map((o) => o.id);
    await cleanupOrders(orderIds); // couponUsage + order
    await prisma.paymentTransaction.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.customerAddress.deleteMany({ where: { customerId: { in: customerIds } } });
    const carts = await prisma.cart.findMany({
      where: { customerId: { in: customerIds } },
      select: { id: true },
    });
    const cartIds = carts.map((c) => c.id);
    if (cartIds.length) {
      await prisma.cartItem.deleteMany({ where: { cartId: { in: cartIds } } });
      await prisma.cart.deleteMany({ where: { id: { in: cartIds } } });
    }
    await prisma.customer.deleteMany({ where: { id: { in: customerIds } } });
  }
  if (userIds.length) {
    await prisma.userSession.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.userRole.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
  return { userIds, customerIds, orderIds };
}

async function userByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

async function customerByEmail(email) {
  return prisma.customer.findFirst({ where: { email } });
}

module.exports = {
  BASE_URL, prisma, PASSWORD,
  newClient, login, req, addToCart, checkout, clearCart,
  ensureRaceUsers, loginAll, ensureTestVariant, getStock,
  orderEvidence, fireSimultaneous, cleanupOrders, cleanupCartsByVariant, printEvidence,
  fetchCsrfToken, bareClient, registerUser, refreshTokens, changePassword, cancelOrder,
  sessionStats, ensureTestCoupon, couponEvidence, cleanupTestUsers, userByEmail, customerByEmail,
};