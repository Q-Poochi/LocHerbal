import { test, expect } from '@playwright/test'

test.describe('Mobile Responsive', () => {
  test('hamburger menu mở sidebar', async ({ page }) => {
    await page.goto('/')

    // Icon menu
    const menuIcon = page.getByTestId('mobile-menu-trigger').first()

    // Hard assertion: menu icon phải hiển thị trước khi click
    await expect(menuIcon).toBeVisible()
    await menuIcon.click()

    // Sidebar xuất hiện
    await expect(page.getByTestId('mobile-sidebar'))
      .toBeVisible({ timeout: 3000 })
  })

  test('trang chủ responsive trên mobile', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('hero-title')).toBeVisible()
  })

  test('sidebar hiển thị mục Danh mục trên mobile', async ({ page }) => {
    await page.goto('/')

    // Mở hamburger menu
    const menuIcon = page.getByTestId('mobile-menu-trigger').first()
    await expect(menuIcon).toBeVisible()
    await menuIcon.click()

    // Kiểm tra mục Danh mục trong sidebar
    await expect(page.getByTestId('nav-categories')).toBeVisible()
  })

  test('product listing hiển thị đúng trên mobile', async ({ page }) => {
    await page.goto('/products')

    // Kiểm tra product card xuất hiện (dùng prefix match vì slug không cố định)
    const productTitle = page.getByTestId('product-title-link-').first()
    await expect(productTitle).toBeVisible()
  })
})