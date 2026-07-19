import http from 'k6/http'
import { check, sleep } from 'k6'
import { Trend, Rate } from 'k6/metrics'
import { TEST_DATA } from '../helpers/data.js'

const checkoutLatency = new Trend('checkout_latency')
const errorRate = new Rate('checkout_errors')

export const options = {
  stages: [
    { duration: '10s', target: 1 },
    { duration: '30s', target: 1 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    'checkout_latency': ['p(95)<5000'],
    'checkout_errors': ['rate<0.1'],
  },
}

export function setup() {
  const res = http.post(
    'http://localhost:3000/auth/login',
    JSON.stringify({ email: TEST_DATA.testEmail, password: TEST_DATA.testPassword }),
    { headers: { 'Content-Type': 'application/json' } }
  )
  const body = res.json()
  console.log('Setup login status:', res.status, 'token:', body?.accessToken?.substring(0, 20))
  return { token: body?.accessToken || '' }
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  }

  console.log('Token:', data.token?.substring(0, 20))

  // Thêm vào giỏ
  let res = http.post(
    'http://localhost:3000/cart/items',
    JSON.stringify({ productVariantId: TEST_DATA.variantId, qty: 1 }),
    { headers }
  )
  console.log('Add to cart:', res.status, res.body)
  check(res, { 'add to cart': (r) => r.status === 201 || r.status === 200 })

  sleep(1)

  // Checkout
  res = http.post(
    'http://localhost:3000/cart/checkout',
    JSON.stringify({
      addressId: TEST_DATA.addressId,
      paymentMethod: 'COD'
    }),
    { headers }
  )
  console.log('Checkout:', res.status, res.body)
  checkoutLatency.add(res.timings.duration)
  errorRate.add(res.status >= 400)
  check(res, { 'checkout success': (r) => r.status === 201 || r.status === 200 })

  sleep(2)
}