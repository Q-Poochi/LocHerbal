import http from 'k6/http'
import { BASE_URL } from '../k6.config.js'
import { TEST_DATA } from './data.js'

export function login() {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: TEST_DATA.testEmail, password: TEST_DATA.testPassword }),
    { headers: { 'Content-Type': 'application/json' } }
  )
  const body = res.json()
  return body?.accessToken || ''
}
