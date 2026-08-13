import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter, Rate, Trend } from 'k6/metrics'
import { BASE_URL } from './k6.config.js'

// ============================================================================
// RACE CONDITION — OVERSELL CHECK
// ----------------------------------------------------------------------------
// Kịch bản: kho TEST-001 còn ĐÚNG 2. 10 user (race-1..10@locherbal.com) đồng
// loạt mua qty=1 → atomic UPDATE trong inventory.allocate() chỉ cho phép ĐÚNG
// 2 request thắng. 8 request còn lại PHẢI nhận 400 InsufficientStock.
//
// Quy ước kết quả:
//   - race_success      == 2  (HTTP 201/200, order ALLOCATED)
//   - race_insufficient == 8  (HTTP 400 — "Không đủ tồn kho")
//   - race_other        == 0  (500 / 403 / timeout / bất kỳ status khác)
//
// Nếu race_success > 2 hoặc race_other > 0 → OVERSELL/BUG nghiêm trọng.
// ============================================================================

const TEST_VARIANT_ID = '91e66524-2fd7-4fe0-8fcb-13dda7e92ca3' // SKU TEST-001
const PASSWORD = 'Test@123456'

const race_success = new Counter('race_success')
const race_insufficient = new Counter('race_insufficient')
const race_other = new Counter('race_other')
const race_other_rate = new Rate('race_other_rate')
const checkoutLatency = new Trend('race_checkout_latency')

export const options = {
  // 10 VUs, mỗi VU 1 iteration — tất cả checkout cùng lúc (shared-iterations).
  // Setup đã login + add-to-cart cả 10 user TRƯỚC, nên default() chỉ còn checkout.
  vus: 10,
  iterations: 10,
  thresholds: {
    // Chính xác 2 order thành công, 8 fail rõ ràng, không có trường hợp nào khác
    'race_success': ['count==2'],
    'race_insufficient': ['count==8'],
    'race_other': ['count==0'],
    'race_other_rate': ['rate==0'],
    // Không request nào bị treo: checkout phải trả trong < 10s
    'race_checkout_latency': ['p(95)<10000'],
  },
}

export function setup() {
  const jar = http.cookieJar()

  // Lấy CSRF token + cookie — bắt buộc cho các POST có cookie (fail-closed)
  const csrfRes = http.get(`${BASE_URL}/auth/csrf`)
  const csrfToken = (csrfRes.json()?.csrfToken) || ''

  const headers = (token) => ({
    'Content-Type': 'application/json',
    'x-csrf-token': csrfToken,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  })

  const tokens = []
  const prepped = []

  for (let i = 1; i <= 10; i++) {
    const email = `race-${i}@locherbal.com`

    // Login riêng từng user (tránh dùng chung 1 token / session)
    const loginRes = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ email, password: PASSWORD }),
      { headers: headers() }
    )
    const token = loginRes.json()?.accessToken || ''
    if (!token) {
      console.log(`[setup] login FAILED for ${email}: ${loginRes.status} ${loginRes.body?.slice(0, 120)}`)
      continue
    }
    tokens.push(token)

    // Dọn giỏ cũ (nếu lần chạy trước để sót) — best effort, lỗi bỏ qua
    http.del(`${BASE_URL}/cart/items/${TEST_VARIANT_ID}`, null, { headers: headers(token) })

    // Add to cart qty=1 — add KHÔNG reserve tồn kho nên cả 10 đều thành công.
    const addRes = http.post(
      `${BASE_URL}/cart/items`,
      JSON.stringify({ productVariantId: TEST_VARIANT_ID, qty: 1 }),
      { headers: headers(token) }
    )
    if (addRes.status !== 201 && addRes.status !== 200 && addRes.status !== 409) {
      console.log(`[setup] add-to-cart FAILED for ${email}: ${addRes.status} ${addRes.body?.slice(0, 120)}`)
      continue
    }
    prepped.push({ email, token })
  }

  return { tokens, prepped }
}

export default function (data) {
  // VU `__VU` lấy đúng user của mình (race-{__VU}) — đảm bảo mỗi user 1 lần
  const entry = data.prepped[__VU - 1]
  if (!entry) {
    race_other.add(1)
    console.log(`[VU ${__VU}] no prepped entry — SKIP`)
    return
  }

  // CSRF: GET /auth/csrf lấy token (server set cookie khớp trong cùng response).
  const csrfRes = http.get(`${BASE_URL}/auth/csrf`)
  const csrf = (csrfRes.json()?.csrfToken) || ''

  // Các VU bắt đầu iteration gần như cùng thời điểm → checkout đồng loạt.
  // Kho còn 2, 10 user cùng bắn → atomic UPDATE chỉ cho 2 thắng.
  const res = http.post(
    `${BASE_URL}/cart/checkout`,
    JSON.stringify({}),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${entry.token}`,
        'x-csrf-token': csrf,
      },
    }
  )

  checkoutLatency.add(res.timings.duration)

  if (res.status === 201 || res.status === 200) {
    race_success.add(1)
    let order = {}
    try { order = res.json() } catch (_) {}
    check(res, { 'checkout 2xx → order created': (r) => r.status === 201 || r.status === 200 })
    console.log(`[VU ${__VU}] SUCCESS orderId=${order.id} code=${order.orderCode} status=${order.status}`)
    return
  }

  const body = typeof res.body === 'string' ? res.body.slice(0, 200) : ''
  if (res.status === 400) {
    race_insufficient.add(1)
    check(res, { 'checkout 400 → insufficient stock': (r) => r.status === 400 })
    console.log(`[VU ${__VU}] INSUFFICIENT 400: ${body}`)
    return
  }

  // 500 / 403 / timeout / bất kỳ status khác → KHÔNG được phép
  race_other.add(1)
  race_other_rate.add(1)
  check(res, { 'checkout unexpected status': (r) => r.status === 201 || r.status === 200 || r.status === 400 })
  console.log(`[VU ${__VU}] UNEXPECTED ${res.status}: ${body}`)
}

export function handleSummary(data) {
  const c = (name) => data.metrics?.[name]?.values?.count ?? 0
  console.log('\n======== RACE-CONDITION OVERSELL RESULT ========')
  console.log(`Success (2xx, order created):   ${c('race_success')}    [expect 2]`)
  console.log(`Insufficient (400):             ${c('race_insufficient')}  [expect 8]`)
  console.log(`Other (500/403/timeout):        ${c('race_other')}   [expect 0]`)
  console.log(`Checkout p95: ${data.metrics?.race_checkout_latency?.values?.['p(95)'] ?? 'n/a'}ms`)
  const verdict =
    c('race_success') === 2 && c('race_insufficient') === 8 && c('race_other') === 0
      ? '✅ NO OVERSELL — đúng 2 order, 8 fail rõ ràng'
      : c('race_success') > 2 || c('race_other') > 0
        ? '🚨 OVERSELL / BUG — có >2 order thành công hoặc status bất thường!'
        : '⚠️ Kết quả lệch (có thể add-to-cart setup thất bại) — kiểm tra log setup'
  console.log(`VERDICT: ${verdict}`)
  console.log('================================================')
  return { stdout: '' }
}
