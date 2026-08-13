import http from 'k6/http'
import { check } from 'k6'
import { Counter, Rate, Trend } from 'k6/metrics'
import { BASE_URL } from './k6.config.js'

// ============================================================================
// KỊCH BẢN 2 — KHÔNG TRANH CHẤP (KIỂM TRA LOCK KHÔNG QUÁ RỘNG)
// ----------------------------------------------------------------------------
// 2 sản phẩm riêng biệt (TEST-001 = A, KT-002 = B), MỖI sản phẩm stock = 5.
// 10 VU: 5 VU mua A, 5 VU mua B — CÙNG LÚC.
//   - VU 1..5  → TEST-001 (A)
//   - VU 6..10 → KT-002  (B)
//
// Kỳ vọng: KHÔNG có tranh chấp thật (mỗi row stock chỉ bị 5 writer đụng)
//   → TẤT CẢ 10 checkout phải 201/200.
//   → p95 KHÔNG được tăng vọt so với baseline kịch bản 1 (~3.8s do 10 writer
//     đụng chung 1 row). Nếu p95 vẫn cao ngang kịch bản 1 → dấu hiệu lock đang
//     khóa phạm vi RỘNG hơn 1 row (khóa cả bảng).
// ============================================================================

const VARIANT_A = '91e66524-2fd7-4fe0-8fcb-13dda7e92ca3' // TEST-001
const VARIANT_B = '5ab6352a-862b-4f5b-97f1-5cc5e482175c' // KT-002
const PASSWORD = 'Test@123456'
const BASELINE_P95_MS = 3813 // p95 checkout kịch bản 1 (10 writer, cùng row)

const sc2_success = new Counter('sc2_success')
const sc2_other = new Counter('sc2_other')
const sc2_other_rate = new Rate('sc2_other_rate')
const checkoutLatency = new Trend('sc2_checkout_latency')

export const options = {
  vus: 10,
  iterations: 10,
  thresholds: {
    'sc2_success': ['count==10'],
    'sc2_other': ['count==0'],
    'sc2_other_rate': ['rate==0'],
    // Không được phép chậm hơn đáng kể baseline: tối đa 10s (safety) —
    // kết luận về "lock không quá rộng" dựa trên so sánh p95 trong summary.
    'sc2_checkout_latency': ['p(95)<10000'],
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

  const prepped = []

  for (let i = 1; i <= 10; i++) {
    const email = `race-${i}@locherbal.com`
    const variantId = i <= 5 ? VARIANT_A : VARIANT_B

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

    http.del(`${BASE_URL}/cart/items/${variantId}`, null, { headers: headers(token) })

    const addRes = http.post(
      `${BASE_URL}/cart/items`,
      JSON.stringify({ productVariantId: variantId, qty: 1 }),
      { headers: headers(token) }
    )
    if (addRes.status !== 201 && addRes.status !== 200 && addRes.status !== 409) {
      console.log(`[setup] add-to-cart FAILED for ${email}: ${addRes.status} ${addRes.body?.slice(0, 120)}`)
      continue
    }
    prepped.push({ email, token, variantId })
  }

  return { prepped }
}

export default function (data) {
  const entry = data.prepped[__VU - 1]
  if (!entry) {
    sc2_other.add(1)
    console.log(`[VU ${__VU}] no prepped entry — SKIP`)
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
        'Authorization': `Bearer ${entry.token}`,
        'x-csrf-token': csrf,
      },
    }
  )

  checkoutLatency.add(res.timings.duration)

  if (res.status === 201 || res.status === 200) {
    sc2_success.add(1)
    check(res, { 'checkout 2xx': (r) => r.status === 201 || r.status === 200 })
    console.log(`[VU ${__VU}] SUCCESS (${entry.variantId === VARIANT_A ? 'A' : 'B'})`)
    return
  }

  const body = typeof res.body === 'string' ? res.body.slice(0, 200) : ''
  sc2_other.add(1)
  sc2_other_rate.add(1)
  check(res, { 'checkout unexpected': (r) => r.status === 201 || r.status === 200 })
  console.log(`[VU ${__VU}] UNEXPECTED ${res.status}: ${body}`)
}

export function handleSummary(data) {
  const c = (name) => data.metrics?.[name]?.values?.count ?? 0
  const p95 = data.metrics?.sc2_checkout_latency?.values?.['p(95)'] ?? 0
  console.log('\n======== SCENARIO 2 — NO-CONTENTION LOCK SCOPE ========')
  console.log(`Success (2xx):     ${c('sc2_success')}  [expect 10]`)
  console.log(`Other (any non-2xx): ${c('sc2_other')}   [expect 0]`)
  console.log(`Checkout p95: ${p95}ms  | baseline kịch bản 1: ${BASELINE_P95_MS}ms`)
  const ratio = p95 / BASELINE_P95_MS
  const verdict =
    c('sc2_success') === 10 && c('sc2_other') === 0
      ? (ratio <= 1.5
          ? `✅ OK — p95 không chậm hơn baseline đáng kể (x${ratio.toFixed(2)}) → lock phạm vi hợp lý (per-row)`
          : `⚠️ p95 tăng vọt x${ratio.toFixed(2)} so với baseline DÙ không tranh chấp → nghi vấn lock khóa phạm vi quá rộng (cả bảng)`)
      : `🚨 FAIL — ${c('sc2_success')}/10 thành công, ${c('sc2_other')} khác thường!`
  console.log(`VERDICT: ${verdict}`)
  console.log('=======================================================')
  return { stdout: '' }
}
