import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '../.playwright/auth.json')

setup('authenticate', async ({ page }) => {
  await page.goto('/login')

  // Chờ backend set csrf_token cookie (qua các request khởi tạo phiên) để
  // frontend gắn đúng x-csrf-token header — tránh race 403 "CSRF token không hợp lệ"
  await page.waitForFunction(() => document.cookie.includes('csrf_token'), null, { timeout: 10000 })

  await page.getByLabel(/email/i).fill('test2@locherbal.com')
  await page.getByLabel(/mật khẩu/i).fill('Test@123456')
  await page.getByRole('button', { name: /đăng nhập/i }).click()
  
  // Chờ redirect về trang chủ sau khi login
  await page.waitForURL('/', { timeout: 10000 })
  await expect(page.getByText(/Chào mừng trở lại/i).first()).toBeVisible({ timeout: 5000 })
  await expect(page.getByRole('link', { name: /tài khoản/i }).first()).toBeVisible()
  
  // Lưu session để tái sử dụng
  await page.context().storageState({ path: authFile })
  console.log('✅ Auth setup complete')
})
