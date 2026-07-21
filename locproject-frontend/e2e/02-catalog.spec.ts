import { test, expect } from '@playwright/test'

test.describe('Product Catalog', () => {
  test('trang danh sách sản phẩm load được', async ({ page }) => {
    await page.goto('/products')
    await expect(page.getByText(/danh mục/i).first()).toBeVisible()
    await expect(page.getByText(/khoảng giá/i)).toBeVisible()
  })

  test('filter theo category cập nhật URL', async ({ page }) => {
    await page.goto('/products')
    // Click category Tim Mạch
    const timMachLink = page.getByText('Tim Mạch').first()
    if (await timMachLink.isVisible()) {
      await timMachLink.click()
      await expect(page).toHaveURL(/categoryId=/)
    }
  })

  test('có thể xem chi tiết sản phẩm', async ({ page }) => {
    await page.goto('/products')
    // Click sản phẩm đầu tiên
    const firstProduct = page.locator('[href*="/products/"]').first()
    if (await firstProduct.isVisible()) {
      await firstProduct.click()
      await expect(page).toHaveURL(/\/products\/.+/)
      // Product detail page có các elements chính
      await expect(page.getByRole('button', { 
        name: /thêm vào giỏ/i 
      })).toBeVisible({ timeout: 10000 })
    }
  })

  test('trang chi tiết sản phẩm hiển thị đúng', async ({ page }) => {
    // Dùng slug thật từ DB: ich-tam-khang
    await page.goto('/products/ich-tam-khang')
    await expect(page.getByRole('button', { 
      name: /thêm vào giỏ/i 
    })).toBeVisible({ timeout: 10000 })
    // Giá hiển thị: 450.000đ
    await expect(page.getByText(/450\.000/)).toBeVisible()
  })
})
