import http from 'k6/http'
import { check, sleep } from 'k6'
import { Trend, Rate } from 'k6/metrics'
import { login } from '../helpers/auth.js'
import { TEST_DATA } from '../helpers/data.js'

const addToCartLatency = new Trend('add_to_cart_latency')
const errorRate = new Rate('add_to_cart_errors')

export const options = {
  stages: [
    { duration: '20s', target: 20 },
    { duration: '1m', target: 100 },
    { duration: '20s', target: 0 },
  ],
  // Threshold được set dựa trên k6 baseline test 18/07/2026:
  // - bcrypt cost 10: ~380ms/request, scale tuyến tính với concurrency
  // - Stock allocate: PostgreSQL serialize concurrent UPDATE cùng variant
  // Xem k6/README.md để biết thêm chi tiết
  thresholds: {
    'add_to_cart_latency': ['p(95)<3500'],  // chấp nhận 3500ms do DB serialize concurrent UPDATE
    'add_to_cart_errors': ['rate<0.05'],
  },
}

export function setup() {
  return { token: login() }
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  }

  // Pick random variant per iteration to distribute stock load
  const variantId = TEST_DATA.variantIds[Math.floor(Math.random() * TEST_DATA.variantIds.length)]

  // Thêm vào giỏ
  let res = http.post(
    'http://localhost:3000/cart/items',
    JSON.stringify({ productVariantId: variantId, qty: 1 }),
    { headers }
  )
  addToCartLatency.add(res.timings.duration)
  errorRate.add(res.status >= 400)
  check(res, { 'add to cart': (r) => r.status === 201 || r.status === 200 })

  sleep(0.5)
}