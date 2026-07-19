import http from 'k6/http'
import { TEST_DATA } from './data.js'

export function login() {
  const res = http.post(
    'http://localhost:3000/auth/login',
    JSON.stringify({ email: TEST_DATA.testEmail, password: TEST_DATA.testPassword }),
    { headers: { 'Content-Type': 'application/json' } }
  )
  const body = res.json()
  return body?.accessToken || ''
}