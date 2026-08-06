import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '../.playwright/auth-admin.json')

setup('admin authenticate', async ({ page }) => {
  await page.goto('/login')

  await page.getByLabel(/email/i).fill('rbac-admin-test@locherbal.local')
  await page.getByLabel(/mật khẩu/i).fill('Test1234!')
  await page.getByRole('button', { name: /đăng nhập/i }).click()

  // Login admin → redirect về /admin
  await page.waitForURL(/\/admin/, { timeout: 10000 })
  await expect(page.getByText('LocHerbal Admin').first()).toBeVisible()

  // Lưu session admin
  await page.context().storageState({ path: authFile })
  console.log('✅ Admin auth setup complete')
})
