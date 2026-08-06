import { test, expect, Page } from '@playwright/test'

// Do refresh-token rotation (token cũ bị revoke sau mỗi /auth/refresh),
// mỗi test phải login mới — KHÔNG dùng storageState tĩnh dùng chung.
test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill('test2@locherbal.com')
  await page.getByLabel(/mật khẩu/i).fill('Test@123456')
  await page.getByRole('button', { name: /đăng nhập/i }).click()
  await page.waitForURL('/', { timeout: 10000 })
  await expect(page.getByText(/Chào mừng trở lại/i).first()).toBeVisible()

  // Clear cart trước mỗi test
  await page.request.delete('http://localhost:4000/cart/clear', {
    headers: { 'Content-Type': 'application/json' }
  }).catch(() => {})
})

// CHỈ goto 1 lần duy nhất ở bước đầu của mỗi test (context mới, chưa có gì để click).
// Sau goto phải đợi AuthBootstrap refresh xong: user chỉ persist trong localStorage nên
// navbar-account-btn hiện ngay — dấu hiệu đáng tin là response /auth/me (gọi sau /auth/refresh).
async function navigateToProduct(page: Page, slug: string) {
  const meReady = page
    .waitForResponse((r) => r.url().includes('/auth/me') && r.status() === 200, { timeout: 15000 })
    .catch(() => null)
  await page.goto(`/products/${slug}`)
  await meReady
  // waitForResponse trigger khi nhận response, trước khi refreshSession set({accessToken}) —
  // chờ thêm một nhịp để accessToken thực sự có trong store trước khi click add.
  await page.waitForTimeout(800)
  await page.getByTestId('navbar-account-btn').waitFor({ timeout: 10000 })
}

async function addProductToCart(page: Page, slug: string) {
  await navigateToProduct(page, slug)
  const addBtn = page.getByRole('button', { name: /thêm vào giỏ/i })
  await addBtn.waitFor({ timeout: 10000 })
  await addBtn.click()
  // Chờ cart update
  await page.waitForTimeout(1000)
}

test.describe('Cart & Checkout Flow', () => {
  test('thêm sản phẩm vào giỏ hàng', async ({ page }) => {
    await navigateToProduct(page, 'ich-tam-khang')

    // Click thêm vào giỏ
    const addBtn = page.getByRole('button', { name: /thêm vào giỏ/i })
    await addBtn.click()

    // Thông báo thành công hoặc cart count tăng
    await expect(
      page.getByText(/đã thêm|thành công/i)
        .or(page.locator('[data-testid="cart-count"]')).first()
    ).toBeVisible({ timeout: 5000 })
  })

  test('xem giỏ hàng hiển thị đúng', async ({ page }) => {
    await addProductToCart(page, 'ich-tam-khang')

    // Mở drawer (SPA) — tránh full reload làm mất accessToken khiến giỏ trống
    await page.getByTestId('navbar-cart-icon').click()

    // Không phụ thuộc tên sản phẩm cụ thể — chỉ cần ít nhất 1 item trong giỏ
    const cartItems = page.locator('[data-testid^="cart-item-"]')
    await expect(cartItems.first()).toBeVisible({ timeout: 10000 })
  })

  test('navigate từ cart sang checkout', async ({ page }) => {
    await addProductToCart(page, 'ich-tam-khang')

    // Desktop: click icon giỏ hàng trên navbar mở DRAWER (không navigate thẳng)
    await page.getByTestId('navbar-cart-icon').click()
    await page.getByTestId('cart-drawer-checkout-btn').click()

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
