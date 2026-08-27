import { test, expect, Page } from '@playwright/test'

async function loginUser(page: Page) {
  await page.goto('/login')
  await page.waitForFunction(() => document.cookie.includes('csrf_token'), null, { timeout: 10000 })
  await page.locator('#email').fill('test2@locherbal.com')
  await page.locator('#password').fill('Test@123456')
  await page.locator('form').getByRole('button', { name: /đăng nhập/i }).click()
  await page.getByTestId('navbar-account-btn').waitFor({ timeout: 20000 })

  // Clear cart
  await page.request.delete('http://localhost:4000/cart/clear', {
    headers: { 'Content-Type': 'application/json' }
  }).catch(() => {})
}

test.describe('Cart & Checkout Flow', () => {
  test('thêm sản phẩm vào giỏ hàng', async ({ page }) => {
    await loginUser(page)
    await page.goto('/products/ich-tam-khang')
    await page.getByTestId('navbar-account-btn').waitFor({ timeout: 10000 })

    const addBtn = page.locator('[data-testid="product-detail-add-to-cart"]').or(page.getByRole('button', { name: /thêm vào giỏ hàng/i })).first()
    await addBtn.waitFor({ state: 'visible', timeout: 10000 })
    await addBtn.click()

    await expect(
      page.getByText(/đã thêm/i)
        .or(page.locator('[data-testid="cart-count"]'))
        .or(page.locator('.toast'))
        .first()
    ).toBeVisible({ timeout: 8000 })
  })

  test('xem giỏ hàng hiển thị đúng', async ({ page }) => {
    await loginUser(page)
    await page.goto('/products/ich-tam-khang')
    await page.getByTestId('navbar-account-btn').waitFor({ timeout: 10000 })

    // Bấm Mua ngay để thêm vào giỏ và điều hướng client-side sang /cart
    const buyNowBtn = page.getByRole('button', { name: /mua ngay/i })
    await buyNowBtn.waitFor({ state: 'visible', timeout: 10000 })
    await buyNowBtn.click()

    await expect(page).toHaveURL(/\/cart/, { timeout: 10000 })
    const cartItems = page.locator('[data-testid^="cart-item-"]').or(page.getByText(/Ích Tâm Khang/i))
    await expect(cartItems.first()).toBeVisible({ timeout: 10000 })
  })

  test('navigate từ cart sang checkout', async ({ page }) => {
    await loginUser(page)
    await page.goto('/products/ich-tam-khang')
    await page.getByTestId('navbar-account-btn').waitFor({ timeout: 10000 })

    const buyNowBtn = page.getByRole('button', { name: /mua ngay/i })
    await buyNowBtn.waitFor({ state: 'visible', timeout: 10000 })
    await buyNowBtn.click()

    await expect(page).toHaveURL(/\/cart/, { timeout: 10000 })
    const checkoutBtn = page.getByRole('button', { name: /tiến hành thanh toán|thanh toán/i }).first()
    await checkoutBtn.waitFor({ state: 'visible', timeout: 10000 })
    await checkoutBtn.click()

    await expect(page).toHaveURL(/\/checkout/, { timeout: 10000 })
    await expect(page.getByText(/thông tin/i).first()).toBeVisible()
  })

  test('checkout form validation', async ({ page }) => {
    await loginUser(page)
    await page.goto('/checkout')

    const submitBtn = page.getByRole('button', {
      name: /tiếp tục thanh toán|đặt hàng|thanh toán/i
    }).first()
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      await expect(
        page.getByText(/bắt buộc|required|không được để trống/i).first()
      ).toBeVisible({ timeout: 5000 })
    }
  })
})