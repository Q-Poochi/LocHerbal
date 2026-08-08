import http from 'k6/http'
import { check } from 'k6'
import { Trend, Rate } from 'k6/metrics'
import { createHMAC } from 'k6/crypto'
import { BASE_URL } from '../k6.config.js'

// BƯỚC 2: verify race invoice_number (P2002) — nhiều đơn PAID đồng loạt.
// Mỗi VU dùng tài khoản race-{__VU}@locherbal.com riêng để giỏ không đụng nhau.
// Nếu fix retry chưa đủ, server log sẽ vẫn có "Unique constraint failed (invoice_number)".

const checkoutLatency = new Trend('inv_checkout_latency')
const ipnLatency = new Trend('inv_ipn_latency')
const errorRate = new Rate('inv_errors')

export const options = {
  vus: 12,
  iterations: 60,
  thresholds: {
    'inv_errors': ['rate<0.1'],
  },
}

const VNP_SECRET = __ENV.VNP_HASH_SECRET || ''

// Mỗi VU login 1 lần (bcrypt cost 10) rồi cache token
let perVUToken = ''

function getToken() {
  if (perVUToken) return perVUToken
  const email = `race-${__VU}@locherbal.com`
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password: 'Test@123456' }),
    { headers: { 'Content-Type': 'application/json' } }
  )
  perVUToken = res.json()?.accessToken || ''
  return perVUToken
}

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

export default function () {
  const token = getToken()
  if (!token) { console.log('login failed'); return }

  // CSRF: mỗi VU đọc cookie từ jar của riêng nó
  const jar = http.cookieJar()
  const cookies = jar.cookiesForURL(`${BASE_URL}/`)
  const csrf = (cookies && cookies['csrf_token'] && cookies['csrf_token'][0]) || ''
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'x-csrf-token': csrf,
  }

  // add item (cart riêng trên đã rỗng sau checkout trước nên không P2002)
  let res = http.post(
    `${BASE_URL}/cart/items`,
    JSON.stringify({ productVariantId: 'e5527e1b-ac84-4270-8bd3-b92b78f068c4', qty: 1 }),
    { headers }
  )
  if (res.status !== 201 && res.status !== 200 && res.status !== 409) {
    console.log('add failed:', res.status, res.body?.slice(0, 120))
    errorRate.add(true)
    return
  }

  const cookies2 = http.cookieJar().cookiesForURL(`${BASE_URL}/`)
  const csrf2 = (cookies2 && cookies2['csrf_token'] && cookies2['csrf_token'][0]) || ''
  const headers2 = { ...headers, 'x-csrf-token': csrf2 }

  res = http.post(
    `${BASE_URL}/cart/checkout`,
    JSON.stringify({}),
    { headers: headers2 }
  )
  checkoutLatency.add(res.timings.duration)
  const orderOk = res.status === 201 || res.status === 200 || res.status === 400
  if (!orderOk) { errorRate.add(true); console.log('checkout failed:', res.status, res.body?.slice(0, 150)); return }

  let order
  try { order = res.json() } catch (_) {}
  if (!order?.id) { console.log('no order id:', res.status, res.body?.slice(0, 150)); return }

  const amountVnd = Math.round(Number(order.totalAmount || 0) * 100)
  const ipnParams = {
    vnp_Amount: String(amountVnd),
    vnp_ResponseCode: '00',
    vnp_TxnRef: order.id,
    vnp_TransactionNo: `K6INV${__VU}-${__ITER}`,
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
  check(res, { 'ipn ok': (r) => r.json()?.RspCode === '00' })
  if (ipnBody?.RspCode === '02') console.log('IPN 02 (already):', order.id)

  errorRate.add(!(ipnOk || ipnBody?.RspCode === '02'))
}

export function handleSummary(data) {
  console.log(`\n======== RACE-INVOICE RESULT ========`)
  console.log(`Iterations: ${data.metrics?.iterations?.values?.count ?? 'n/a'}`)
  console.log(`Error rate: ${data.metrics?.inv_errors?.values?.rate ?? 'n/a'}`)
  console.log(`Checkout p95: ${data.metrics?.inv_checkout_latency?.values?.['p(95)'] ?? 'n/a'}ms`)
  console.log(`Kết quả xem bảng log server ở phía server (Invoice created / Unique constraint)`)
  return { stdout: '' }
}