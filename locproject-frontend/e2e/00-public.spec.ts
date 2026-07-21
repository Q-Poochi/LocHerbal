import { test, expect } from '@playwright/test'

test.describe('Public pages (no auth)', () => {
  test('navbar hiển thị link tài khoản khi chưa đăng nhập', async ({ page }) => {
    // Clear cookies để đảm bảo không có session
    await page.context().clearCookies()
    await page.goto('/')
    // Tìm link/button dẫn đến login
    await expect(
      page.getByRole('link', { name: /tài khoản|đăng nhập/i })
        .or(page.locator('[href="/login"]'))
    ).toBeVisible()
  })

  test('click logo về trang chủ', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/products')
    await page.getByText('LocHerbal').first().click()
    await expect(page).toHaveURL('/')
  })
})
