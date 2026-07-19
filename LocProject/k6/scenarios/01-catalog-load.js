import http from 'k6/http'
import { check, sleep } from 'k6'
import { Trend, Rate } from 'k6/metrics'
import { TEST_DATA } from '../helpers/data.js'

const catalogLatency = new Trend('catalog_latency')
const errorRate = new Rate('catalog_errors')

export const options = {
  stages: [
    { duration: '30s', target: 100 },   // ramp up
    { duration: '1m',  target: 500 },   // hold 500 users
    { duration: '30s', target: 0 },     // ramp down
  ],
  thresholds: {
    'catalog_latency': ['p(95)<300'],   // p95 < 300ms
    'catalog_errors': ['rate<0.01'],    // error rate < 1%
    'http_req_duration': ['p(95)<300'],
  },
}

export default function () {
  // GET categories
  let res = http.get('http://localhost:3000/categories')
  catalogLatency.add(res.timings.duration)
  errorRate.add(res.status !== 200)
  check(res, { 'categories 200': (r) => r.status === 200 })

  sleep(0.5)

  // GET products list
  res = http.get('http://localhost:3000/products?page=1&limit=12')
  catalogLatency.add(res.timings.duration)
  errorRate.add(res.status !== 200)
  check(res, { 'products list 200': (r) => r.status === 200 })

  sleep(0.5)

  // GET product detail (cached sau fix Redis)
  res = http.get(`http://localhost:3000/products/slug/${TEST_DATA.existingSlug}`)
  catalogLatency.add(res.timings.duration)
  check(res, { 'product detail 200': (r) => r.status === 200 })

  sleep(1)
}