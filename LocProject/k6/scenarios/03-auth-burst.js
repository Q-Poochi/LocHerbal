import http from 'k6/http'
import { check } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const authLatency = new Trend('auth_latency')
const errorRate = new Rate('auth_errors')

export const options = {
  stages: [
    { duration: '10s', target: 50 },
    { duration: '30s', target: 50 },
    { duration: '10s', target: 0 },
  ],
  // Threshold được set dựa trên k6 baseline test 18/07/2026:
  // - bcrypt cost 10: ~380ms/request, scale tuyến tính với concurrency
  // - Stock allocate: PostgreSQL serialize concurrent UPDATE cùng variant
  // Xem k6/README.md để biết thêm chi tiết
  thresholds: {
    'auth_latency': ['p(95)<7000'],  // bcrypt cost 10 ~400ms base × concurrency 50 → ~6.4s p(95)
    'auth_errors': ['rate<0.01'],
  },
}

export default function () {
  const res = http.post(
    'http://localhost:3000/auth/login',
    JSON.stringify({
      email: 'test2@locherbal.com',
      password: 'Test@123456'
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
  authLatency.add(res.timings.duration)
  errorRate.add(res.status !== 200 && res.status !== 201)
  check(res, { 'login success': (r) => r.status === 200 || r.status === 201 })
}