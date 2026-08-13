import http from 'k6/http'
import { check } from 'k6'
import { Counter, Rate } from 'k6/metrics'
import { BASE_URL } from './k6.config.js'

// ============================================================================
// KỊCH BẢN 3 — CHECKOUT GIỎ NHIỀU ITEM, 1 ITEM HẾT HÀNG GIỮA CHỪNG
// ----------------------------------------------------------------------------
// Setup: sản phẩm C (TEST-001) stock=3, sản phẩm D (KT-002) stock=10.
//   race-1 (target): giỏ 2 dòng — C qty=2, D qty=2.
//
// "Hết hàng giữa chừng" được mô phỏng trong setup(): sau khi race-1 add xong
// (C còn đủ), một user PHỤ race-3 checkout MUA HẾT C trước khi race-1 checkout.
//   → Lúc race-1 checkout: C không đủ 2 → TOÀN BỘ giỏ (C + D) phải fail.
//
// Kỳ vọng:
//   - race-1 checkout: 400 — cả giỏ fail, KHÔNG được allocate D một phần
//     (không được tạo order thành công với D rồi treo C).
//   - Verify DB sau: stock_items của cả C và D đều KHÔNG bị thay đổi so với
//     trạng thái ngay sau khi race-3 mua hết (rollback hoàn toàn).
//   - race-3 (helper) phải checkout 201 — nếu helper fail thì C chưa hết,
//     kịch bản mất hiệu lực → báo lỗi.
// ============================================================================

const VARIANT_C = '91e66524-2fd7-4fe0-8fcb-13dda7e92ca3' // TEST-001 — stock=3
const VARIANT_D = '5ab6352a-862b-4f5b-97f1-5cc5e482175c' // KT-002  — stock=10
const QTY_C = 2
const QTY_D = 2
const PASSWORD = 'Test@123456'

const sc3_fail_expected = new Counter('sc3_fail_expected')
const sc3_success = new Counter('sc3_success')
const sc3_other = new Counter('sc3_other')
const sc3_other_rate = new Rate('sc3_other_rate')

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    'sc3_fail_expected': ['count==1'],
    'sc3_other': ['count==0'],
    'sc3_other_rate': ['rate==0'],
  },
}

export function setup() {
  const jar = http.cookieJar()
  const csrfRes = http.get(`${BASE_URL}/auth/csrf`)
  const csrfToken = (csrfRes.json()?.csrfToken) || ''

  const headers = (token) => ({
    'Content-Type': 'application/json',
    'x-csrf-token': csrfToken,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  })

  const login = (email) => {
    const res = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ email, password: PASSWORD }),
      { headers: headers() }
    )
    return res.json()?.accessToken || ''
  }

  // --- race-1: dựng giỏ 2 dòng (C qty=2, D qty=2) — C lúc này còn đủ 3 ---
  const token1 = login('race-1@locherbal.com')
  if (!token1) throw new Error('login race-1 failed')
  http.del(`${BASE_URL}/cart/items/${VARIANT_C}`, null, { headers: headers(token1) })
  http.del(`${BASE_URL}/cart/items/${VARIANT_D}`, null, { headers: headers(token1) })

  const add1c = http.post(
    `${BASE_URL}/cart/items`,
    JSON.stringify({ productVariantId: VARIANT_C, qty: QTY_C }),
    { headers: headers(token1) }
  )
  const add1d = http.post(
    `${BASE_URL}/cart/items`,
    JSON.stringify({ productVariantId: VARIANT_D, qty: QTY_D }),
    { headers: headers(token1) }
  )
  if ((add1c.status !== 201 && add1c.status !== 200 && add1c.status !== 409)
    || (add1d.status !== 201 && add1d.status !== 200 && add1d.status !== 409)) {
    throw new Error(`race-1 add failed: C=${add1c.status} D=${add1d.status}`)
  }

  // --- race-3 (helper): mua hết C — làm C hết hàng giữa chừng ---
  const token3 = login('race-3@locherbal.com')
  if (!token3) throw new Error('login race-3 failed')
  http.del(`${BASE_URL}/cart/items/${VARIANT_C}`, null, { headers: headers(token3) })
  const add3 = http.post(
    `${BASE_URL}/cart/items`,
    JSON.stringify({ productVariantId: VARIANT_C, qty: 3 }),
    { headers: headers(token3) }
  )
  if (add3.status !== 201 && add3.status !== 200 && add3.status !== 409) {
    throw new Error(`race-3 add failed: ${add3.status}`)
  }
  const co3 = http.post(
    `${BASE_URL}/cart/checkout`,
    JSON.stringify({}),
    { headers: headers(token3) }
  )
  if (co3.status !== 201 && co3.status !== 200) {
    throw new Error(`race-3 checkout phải thành công để làm hết C — thực tế ${co3.status}: ${co3.body?.slice(0, 150)}`)
  }
  console.log(`[setup] race-3 đã mua hết C (3) — C giờ còn 0, race-1 sẽ fail khi checkout`)

  return { token1 }
}

export default function (data) {
  if (!data.token1) {
    sc3_other.add(1)
    console.log('[VU 1] no token — SKIP')
    return
  }

  const csrfRes = http.get(`${BASE_URL}/auth/csrf`)
  const csrf = (csrfRes.json()?.csrfToken) || ''

  const res = http.post(
    `${BASE_URL}/cart/checkout`,
    JSON.stringify({}),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.token1}`,
        'x-csrf-token': csrf,
      },
    }
  )

  const body = typeof res.body === 'string' ? res.body.slice(0, 240) : ''
  const orderAllocated = (() => {
    try { const o = res.json(); return !!(o && o.allocationStatus === 'ALLOCATED') } catch (_) { return false }
  })()

  if (res.status === 400 && !orderAllocated) {
    sc3_fail_expected.add(1)
    check(res, { 'checkout 400 → cả giỏ fail': (r) => r.status === 400 })
    console.log(`[VU 1] EXPECTED FAIL 400: ${body}`)
    return
  }

  sc3_other.add(1)
  sc3_other_rate.add(1)
  check(res, { 'không được tạo order khi C hết hàng': (r) => r.status === 400 })
  console.log(`[VU 1] UNEXPECTED ${res.status} (không được phép): ${body}`)
}

export function handleSummary(data) {
  const c = (name) => data.metrics?.[name]?.values?.count ?? 0
  console.log('\n======== SCENARIO 3 — MULTI-ITEM, 1 ITEM OUT-OF-STOCK ========')
  console.log(`Checkout fail đúng (400, cả giỏ):  ${c('sc3_fail_expected')}  [expect 1]`)
  console.log(`Other:                             ${c('sc3_other')}   [expect 0]`)
  const verdict =
    c('sc3_fail_expected') === 1 && c('sc3_other') === 0
      ? '✅ API ĐÚNG — cả giỏ fail, không allocate một phần. Tiếp theo verify DB rollback stock C & D.'
      : '🚨 LỆCH — xem log + verify DB'
  console.log(`VERDICT: ${verdict}`)
  console.log('==============================================================')
  return { stdout: '' }
}
