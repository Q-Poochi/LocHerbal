import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '../.playwright/auth-admin.json')

setup('admin authenticate', async ({ page }) => {
  await page.goto('/login')

  const emailInput = page.locator('#email')
  await emailInput.waitFor({ state: 'visible', timeout: 15000 })
  await emailInput.fill('rbac-admin-test@locherbal.local')

  const passwordInput = page.locator('#password')
  await passwordInput.fill('Test1234!')
  await passwordInput.press('Enter')

  // Login admin → redirect về /admin
  await page.waitForURL(/\/admin/, { timeout: 15000 })
  await expect(page.getByText('LocHerbal Admin').first()).toBeVisible({ timeout: 10000 })

  // Lưu session admin
  await page.context().storageState({ path: authFile })
  console.log('✅ Admin auth setup complete')
})