import { test, expect, Page } from '@playwright/test'
import path from 'path'

// Dùng session đã login từ auth setup
test.use({ 
  storageState: path.join(__dirname, '../.playwright/auth.json') 
})

async function addProductToCart(page: Page, slug: string) {
  await page.goto(`/products/${slug}`)
  const addBtn = page.getByRole('button', { name: /thêm vào giỏ/i })
  await addBtn.waitFor({ timeout: 10000 })
  await addBtn.click()
  // Chờ cart update
  await page.waitForTimeout(1000)
}

test.describe('Cart & Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cart trước mỗi test bằng API call
    await page.request.delete('http://localhost:3000/cart/clear', {
      headers: { 
        'Content-Type': 'application/json'
      }
    }).catch(() => {}) // Ignore nếu endpoint chưa có
  })

  test('thêm sản phẩm vào giỏ hàng', async ({ page }) => {
    await page.goto('/products/ich-tam-khang')
    
    // Chờ trang load
    const addBtn = page.getByRole('button', { 
      name: /thêm vào giỏ/i 
    })
    await addBtn.waitFor({ timeout: 10000 })
    
    // Click thêm vào giỏ
    await addBtn.click()
    
    // Thông báo thành công hoặc cart count tăng
    await expect(
      page.getByText(/đã thêm|thành công/i)
        .or(page.locator('[data-testid="cart-count"]')).first()
    ).toBeVisible({ timeout: 5000 })
  })

  test('xem giỏ hàng hiển thị đúng', async ({ page }) => {
    await addProductToCart(page, 'ich-tam-khang')
    await page.goto('/cart')
    
    await expect(page.getByText('Ích Tâm Khang').first()).toBeVisible({
      timeout: 10000
    })
    // Nút tiến hành thanh toán
    await expect(
      page.getByRole('link', { name: /tiến hành thanh toán/i })
        .or(page.getByRole('button', { name: /tiến hành thanh toán/i }))
    ).toBeVisible()
  })

  test('navigate từ cart sang checkout', async ({ page }) => {
    await addProductToCart(page, 'ich-tam-khang')
    await page.goto('/cart')
    
    const checkoutBtn = page.getByRole('link', { name: /tiến hành thanh toán/i })
      .or(page.getByRole('button', { name: /tiến hành thanh toán/i }))
    await checkoutBtn.waitFor({ timeout: 10000 })
    await checkoutBtn.click()
    
    await expect(page).toHaveURL('/checkout', { timeout: 10000 })
    await expect(page.getByText(/thông tin/i).first()).toBeVisible()
  })

  test('checkout form validation', async ({ page }) => {
    await page.goto('/checkout')
    
    // Bấm submit khi form trống
    const submitBtn = page.getByRole('button', { 
      name: /tiếp tục thanh toán|đặt hàng|thanh toán/i 
    }).first()
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      // Phải hiện lỗi validation
      await expect(
        page.getByText(/bắt buộc|required|không được để trống/i).first()
      ).toBeVisible({ timeout: 3000 })
    }
  })
})
