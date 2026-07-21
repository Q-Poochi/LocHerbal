import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('đăng nhập thành công', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('test2@locherbal.com')
    await page.getByLabel(/mật khẩu/i).fill('Test@123456')
    await page.getByRole('button', { name: /đăng nhập/i }).click()
    await page.waitForURL('/', { timeout: 10000 })
    await expect(page.getByText('Test User')).toBeVisible()
  })

  test('đăng nhập sai mật khẩu hiện lỗi', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('test2@locherbal.com')
    await page.getByLabel(/mật khẩu/i).fill('WrongPassword123')
    await page.getByRole('button', { name: /đăng nhập/i }).click()
    // Phải hiện thông báo lỗi, không redirect
    await expect(
      page.locator('[role="alert"]')
        .or(page.locator('.toast'))
        .or(page.locator('[class*="error"]'))
        .or(page.getByText(/không chính xác|sai|lỗi|invalid/i))
    ).toBeVisible({ timeout: 5000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('đăng nhập email không tồn tại hiện lỗi', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('notexist@test.com')
    await page.getByLabel(/mật khẩu/i).fill('Test@123456')
    await page.getByRole('button', { name: /đăng nhập/i }).click()
    await expect(
      page.locator('[role="alert"]')
        .or(page.locator('.toast'))
        .or(page.locator('[class*="error"]'))
        .or(page.getByText(/không chính xác|sai|lỗi|invalid/i))
    ).toBeVisible({ timeout: 5000 })
  })

  test('chặn truy cập /admin khi chưa đăng nhập', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/)
  })
})
