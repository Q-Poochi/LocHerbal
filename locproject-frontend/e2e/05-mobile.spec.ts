import { test, expect } from '@playwright/test'

test.describe('Mobile Responsive', () => {
  test('hamburger menu mở sidebar', async ({ page }) => {
    await page.goto('/')

    const menuIcon = page.getByTestId('mobile-menu-trigger').first()

    // Spec này chạy trên cả chromium (desktop) lẫn mobile project.
    // Mobile: click hamburger mở sidebar (hard assertion).
    // Desktop: hamburger bị ẩn (md:hidden), desktop nav hiển thị thay thế.
    if (await menuIcon.isVisible()) {
      await menuIcon.click()
      await expect(page.getByTestId('mobile-sidebar'))
        .toBeVisible({ timeout: 3000 })
    } else {
      await expect(menuIcon).not.toBeVisible()
      await expect(page.getByRole('navigation', { name: 'Điều hướng chính' })).toBeVisible()
    }
  })

  test('trang chủ responsive trên mobile', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('hero-title')).toBeVisible()
  })

  test('sidebar hiển thị mục Danh mục trên mobile', async ({ page }) => {
    await page.goto('/')

    const menuIcon = page.getByTestId('mobile-menu-trigger').first()

    if (await menuIcon.isVisible()) {
      // Mobile: mở hamburger rồi kiểm tra mục Danh mục trong sidebar
      await menuIcon.click()
      await expect(page.getByTestId('nav-categories')).toBeVisible()
    } else {
      // Desktop: category hiển thị qua mega-dropdown "Sản phẩm"
      await page.getByRole('button', { name: /sản phẩm/i }).hover()
      await expect(page.getByRole('link', { name: /tim mạch/i }).first()).toBeVisible()
    }
  })

  test('product listing hiển thị đúng trên mobile', async ({ page }) => {
    await page.goto('/products')

    // /products dùng ProductGrid → data-testid="product-card-link-{slug}"
    // (product-title-link-* chỉ có ở ProductGridDisplay dùng cho /search)
    const productCard = page.locator('[data-testid^="product-card-link-"]').first()
    await expect(productCard).toBeVisible()
  })
})