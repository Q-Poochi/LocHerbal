/**
 * k6 Shared Configuration
 * Import vào scenario nếu muốn dùng config chung
 */

export const BASE_URL = 'http://localhost:3000'

export const COMMON_THRESHOLDS = {
  'http_req_duration': ['p(95)<500'],
  'http_req_failed': ['rate<0.05'],
}

export const STAGES = {
  smoke: [
    { duration: '10s', target: 1 },
    { duration: '20s', target: 5 },
    { duration: '10s', target: 0 },
  ],
  load: [
    { duration: '30s', target: 100 },
    { duration: '1m',  target: 500 },
    { duration: '30s', target: 0 },
  ],
  stress: [
    { duration: '20s', target: 50 },
    { duration: '1m',  target: 200 },
    { duration: '20s', target: 0 },
  ],
  spike: [
    { duration: '10s', target: 1000 },
    { duration: '30s', target: 0 },
  ],
}

export const HEADERS = {
  json: { 'Content-Type': 'application/json' },
}