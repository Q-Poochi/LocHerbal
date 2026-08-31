/* saga-test.cjs — SAGA W1 thật trên production: register→login→cart→checkout COD
 * → GET /orders/:id (allocationStatus) → VNPay URL → IDOR check → cancel */
const BASE = 'https://backend-production-ebe64.up.railway.app';
let cookies = {}, csrfToken = '';

async function req(method, path, { body, token, csrf = true } = {}) {
  const attempt = async () => {
    const h = { 'Content-Type': 'application/json' };
    const c = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
    if (c) h['Cookie'] = c;
    if (csrf && csrfToken) h['x-csrf-token'] = csrfToken;
    if (token) h['Authorization'] = 'Bearer ' + token;
    return fetch(BASE + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  };
  let res = await attempt();
  if (res.status === 403 && (await res.text()).includes('CSRF')) {
    const rr = await fetch(BASE + '/auth/csrf');
    csrfToken = JSON.parse(await rr.text()).csrfToken;
    cookies['csrf_token'] = csrfToken; // đồng bộ jar với header, nếu không server sẽ thấy mismatch
    res = await attempt();
  }
  for (const sc of res.headers.getSetCookie ? res.headers.getSetCookie() : []) {
    const [pair] = sc.split(';');
    const eq = pair.indexOf('=');
    cookies[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
  }
  return { status: res.status, body: await res.text() };
}

(async () => {
  await req('GET', '/auth/csrf', { csrf: false });
  const stamp = Date.now();
  const email = `saga_${stamp}@test.local`;

  const reg = await req('POST', '/auth/register', { body: { email, password: 'Xyz12345!', fullName: 'Saga Test' } });
  console.log(`register -> ${reg.status}: ${reg.body.slice(0, 120)}`);
  const lg = await req('POST', '/auth/login', { body: { email, password: 'Xyz12345!' } });
  const token = JSON.parse(lg.body).accessToken;
  console.log(`login -> ${lg.status}, token OK`);

  const prods = await req('GET', '/products?limit=3', { csrf: false });
  const arr = JSON.parse(prods.body).data ?? JSON.parse(prods.body);
  const p = arr[0];
  const variantId = p.variants?.[0]?.id;
  console.log(`SP: ${p.name} | variantId=${variantId} | price=${p.variants?.[0]?.price}`);

  const add = await req('POST', '/cart/items', { token, body: { productVariantId: variantId, qty: 2 } });
  console.log(`add to cart (qty=2) -> ${add.status}: ${add.body.slice(0, 150)}`);

  const co = await req('POST', '/cart/checkout', {
    token,
    body: {
      fullName: 'Saga Test', phone: '0987654999', email,
      province: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Bến Nghé',
      address: '123 Test Street', paymentMethod: 'COD',
    },
  });
  console.log(`checkout COD -> ${co.status}: ${co.body.slice(0, 250)}`);
  const coj = JSON.parse(co.body);
  const order = coj.data ?? coj;
  console.log(`orderId=${order.id} | status=${order.status} | paymentStatus=${order.paymentStatus} | total=${order.total ?? order.grandTotal ?? '?'}`);

  const od = await req('GET', `/orders/${order.id}`, { token });
  const o = (JSON.parse(od.body).data ?? JSON.parse(od.body));
  console.log(`GET /orders/:id -> ${od.status}`);
  console.log(`>>> allocationStatus: ${o.allocationStatus ?? '(khong co field)'}`);
  console.log(`>>> items: ${JSON.stringify((o.items ?? []).map((i) => ({ qty: i.qty, alloc: i.allocationStatus ?? i.status })))}`);
  console.log(`>>> paymentMethod: ${o.paymentMethod ?? '?'} | orderStatus: ${o.status}`);

  const vp = await req('GET', `/payment/vnpay-url?orderId=${order.id}`, { token, csrf: false });
  console.log(`vnpay-url -> ${vp.status}: ${vp.body.slice(0, 250)}`);

  const idor = await req('GET', '/orders/00000000-0000-0000-0000-000000000001', { token });
  console.log(`IDOR orders cua nguoi khac -> ${idor.status}: ${idor.body.slice(0, 120)}`);

  const cancel = await req('POST', `/orders/${order.id}/cancel`, { token });
  console.log(`cancel don test -> ${cancel.status}: ${cancel.body.slice(0, 120)}`);
})().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });