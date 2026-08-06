import http from 'k6/http'
import { check, sleep } from 'k6'
import { Trend, Rate } from 'k6/metrics'
import { BASE_URL } from '../k6.config.js'
import { TEST_DATA } from '../helpers/data.js'

// TEMP investigate: tách Trend riêng theo từng endpoint để tìm thủ phạm p95
const categoriesLatency = new Trend('categories_latency')
const productsListLatency = new Trend('products_list_latency')
const productDetailLatency = new Trend('product_detail_latency')
const errorRate = new Rate('catalog_errors')

export const options = {
  stages: [
    { duration: '30s', target: 100 },   // ramp up
    { duration: '1m',  target: 500 },   // hold 500 users
    { duration: '30s', target: 0 },     // ramp down
  ],
  thresholds: {
    'categories_latency': ['p(95)<300'],   // p95 < 300ms
    'products_list_latency': ['p(95)<300'],
    'product_detail_latency': ['p(95)<300'],
    'catalog_errors': ['rate<0.01'],    // error rate < 1%
    'http_req_duration': ['p(95)<300'],
  },
}

export default function () {
  // GET categories
  let res = http.get(`${BASE_URL}/categories`)
  categoriesLatency.add(res.timings.duration)
  errorRate.add(res.status !== 200)
  check(res, { 'categories 200': (r) => r.status === 200 })

  sleep(0.5)

  // GET products list
  res = http.get(`${BASE_URL}/products?page=1&limit=12`)
  productsListLatency.add(res.timings.duration)
  errorRate.add(res.status !== 200)
  check(res, { 'products list 200': (r) => r.status === 200 })

  sleep(0.5)

  // GET product detail (cached sau fix Redis)
  res = http.get(`${BASE_URL}/products/slug/${TEST_DATA.existingSlug}`)
  productDetailLatency.add(res.timings.duration)
  check(res, { 'product detail 200': (r) => r.status === 200 })

  sleep(1)
}
