import http from 'k6/http'
import { check } from 'k6'
import { Trend, Rate, Counter } from 'k6/metrics'
import { createHMAC } from 'k6/crypto'
import { BASE_URL } from '../k6.config.js'
import { TEST_DATA } from '../helpers/data.js'

const checkoutLatency = new Trend('race_checkout_latency')
const ipnLatency = new Trend('race_ipn_latency')
const errorRate = new Rate('race_errors')
const okIpn = new Counter('race_ipn_ok')
const allocFailedLog = new Counter('race_alloc_failed')

export const options = {
  // đủ VUs để chen ngang microtasks allocate, nhưng không đốt hết stock CT-001 (avail 538)
  vus: 10,
  iterations: 200,
  thresholds: {
    'race_errors': ['rate<0.1'],
  },
}

const VNP_SECRET = __ENV.VNP_HASH_SECRET || ''

function sortObject(obj) {
  const sorted = {}
  Object.keys(obj).sort().forEach((k) => { sorted[k] = String(obj[k]) })
  return sorted
}

function hmacSha512(data, secret) {
  const h = createHMAC('sha512', secret)
  h.update(data)
  return h.digest('hex')
}

export function setup() {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: TEST_DATA.testEmail, password: TEST_DATA.testPassword }),
    { headers: { 'Content-Type': 'application/json' } }
  )
  return { token: res.json()?.accessToken || '' }
}

export function handleSummary(data) {
  const ipnOk = data.metrics?.race_ipn_ok?.values?.count ?? 0
  const total = data.metrics?.race_errors?.values?.passes ?? false
  console.log(`\n======== RACE RESULT ========`)
  console.log(`Iterations total: ${data.metrics?.iterations?.values?.count ?? 'n/a'}`)
  console.log(`IPN success (deduct trigger): ${ipnOk}`)
  console.log(`Error rate: ${data.metrics?.race_errors?.values?.rate ?? 'n/a'}`)
  return { stdout: '' }
}

export default function (data) {
  // CSRF fail-closed: request đã có csrf cookie (k6 giữ cookie từ lần trước) phải kèm header khớp
  const jar = http.cookieJar()
  const cookies = jar.cookiesForURL(`${BASE_URL}/`)
  const csrf = (cookies && cookies['csrf_token'] && cookies['csrf_token'][0]) || ''

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
    'x-csrf-token': csrf,
  }
  const variantId = TEST_DATA.variantIds[0] // CT-001 rich, 538 avail

  // 1. Reset giỏ: xóa item variant này nếu còn (tránh P2002 unique) — request đầu sẽ gắn csrf cookie
  http.del(`${BASE_URL}/cart/items/${variantId}`, null, { headers })

  // 2. Đọc lại csrf cookie từ jar (được set từ response trước) — bắt buộc cho các POST sau
  const cookies2 = http.cookieJar().cookiesForURL(`${BASE_URL}/`)
  const csrf2 = (cookies2 && cookies2['csrf_token'] && cookies2['csrf_token'][0]) || ''
  const headers2 = { ...headers, 'x-csrf-token': csrf2 }

  let res = http.post(
    `${BASE_URL}/cart/items`,
    JSON.stringify({ productVariantId: variantId, qty: 1 }),
    { headers: headers2 }
  )
  if (res.status !== 201 && res.status !== 200 && res.status !== 409) {
    console.log('add to cart failed:', res.status, res.body?.slice(0, 150))
    check(res, { 'add to cart ok': (r) => r.status === 201 || r.status === 200 || r.status === 409 })
    return
  }

  // 3. Checkout (COD để tạo order nhưng thanh toán bằng IPN hợp lệ sau này)
  res = http.post(
    `${BASE_URL}/cart/checkout`,
    JSON.stringify({ addressId: TEST_DATA.addressId }),
    { headers: headers2 }
  )
  const orderOk = res.status === 201 || res.status === 200
  checkoutLatency.add(res.timings.duration)
  errorRate.add(!orderOk)
  check(res, { 'checkout ok': (r) => r.status === 201 || r.status === 200 })

  let order;
  try { order = res.json() } catch (_) {}
  if (!orderOk || !order?.id) {
    console.log('checkout failed:', res.status, res.body?.slice(0, 200))
    return
  }

  // 3. IPN thanh toán thành công ngay lập tức (đủ chữ ký) — giá trị vnp_Amount phải đúng
  const amountVnd = Math.round(Number(order.totalAmount || 0) * 100)
  const ipnParams = {
    vnp_Amount: String(amountVnd),
    vnp_ResponseCode: '00',
    vnp_TxnRef: order.id,
    vnp_TransactionNo: `K6RACE${__ITER}`,
  }
  const sortedParams = sortObject(ipnParams)
  const signData = Object.keys(sortedParams)
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(sortedParams[k])}`)
    .join('&')
  const secureHash = hmacSha512(signData, VNP_SECRET)
  const qs = `${signData}&vnp_SecureHash=${secureHash}`

  res = http.get(`${BASE_URL}/payment/vnpay-ipn?${qs}`)
  ipnLatency.add(res.timings.duration)
  const ipnBody = res.json?.()
  const ipnOk = res.status === 200 && ipnBody?.RspCode === '00'
  if (ipnOk) okIpn.add(1)
  check(res, { 'ipn ok': (r) => r.json()?.RspCode === '00' ,})

  if (!ipnOk) {
    console.log('ipn failed:', res.status, res.body?.slice(0, 300))
  }
}