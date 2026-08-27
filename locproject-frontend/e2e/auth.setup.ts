import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '../.playwright/auth.json')

setup('authenticate', async ({ page }) => {
  await page.goto('/login')

  const emailInput = page.locator('#email')
  await emailInput.waitFor({ state: 'visible', timeout: 15000 })
  await emailInput.fill('test2@locherbal.com')

  const passwordInput = page.locator('#password')
  await passwordInput.fill('Test@123456')
  await passwordInput.press('Enter')
  
  // Chờ redirect về trang chủ sau khi login
  await page.waitForURL('/', { timeout: 15000 })
  await expect(page.getByTestId('navbar-account-btn').or(page.getByRole('link', { name: /tài khoản/i })).first()).toBeVisible({ timeout: 10000 })
  
  // Lưu session để tái sử dụng
  await page.context().storageState({ path: authFile })
  console.log('✅ Auth setup complete')
})