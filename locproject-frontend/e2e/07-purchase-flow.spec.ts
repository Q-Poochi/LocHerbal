import { test, expect } from '@playwright/test'

test.setTimeout(60000)

test.describe('Purchase Flow (COD)', () => {
  test('hoàn tất đặt hàng COD từ đầu đến cuối', async ({ page }) => {
    // 1. Login
    await page.goto('/login')
    await page.waitForFunction(() => document.cookie.includes('csrf_token'), null, { timeout: 10000 })
    await page.locator('#email').fill('test2@locherbal.com')
    await page.locator('#password').fill('Test@123456')
    await page.locator('form').getByRole('button', { name: /đăng nhập/i }).click()
    await page.getByTestId('navbar-account-btn').waitFor({ timeout: 20000 })

    // 2. Mở trang sản phẩm & Bấm Mua ngay
    await page.goto('/products/ich-tam-khang')
    await page.getByTestId('navbar-account-btn').waitFor({ timeout: 10000 })

    const buyNowBtn = page.getByRole('button', { name: /mua ngay/i })
    await buyNowBtn.waitFor({ state: 'visible', timeout: 10000 })
    await buyNowBtn.click()

    // 3. Tại giỏ hàng -> Bấm Tiến hành thanh toán
    await expect(page).toHaveURL(/\/cart/, { timeout: 10000 })
    const checkoutBtn = page.getByRole('button', { name: /tiến hành thanh toán|thanh toán/i }).first()
    await checkoutBtn.waitFor({ state: 'visible', timeout: 10000 })
    await checkoutBtn.click()
    await expect(page).toHaveURL(/\/checkout/, { timeout: 10000 })

    // 4. Điền thông tin giao hàng
    await page.waitForSelector('[data-testid="checkout-fullName"]', { timeout: 10000 })
    await page.fill('[data-testid="checkout-fullName"]', 'Nguyễn Văn A')
    await page.fill('[data-testid="checkout-phone"]', '0901234567')
    await page.fill('[data-testid="checkout-address"]', '123 Đường Láng, Đống Đa')

    // Chọn Tỉnh/Thành phố
    const provinceSelect = page.getByText(/Tỉnh \/ Thành phố/i).locator('..').locator('select')
    await provinceSelect.waitFor({ timeout: 10000 })
    await expect
      .poll(async () => provinceSelect.locator('option').count(), { timeout: 20000 })
      .toBeGreaterThan(1)
    await provinceSelect.selectOption({ index: 1 })

    // Quận / Huyện
    const districtSelect = page.getByText(/Quận \/ Huyện/i).locator('..').locator('select')
    await page.waitForTimeout(2000)
    await districtSelect.selectOption({ index: 1 })

    // Phường / Xã
    const wardSelect = page.getByText(/Phường \/ Xã/i).locator('..').locator('select')
    await page.waitForTimeout(2000)
    await wardSelect.selectOption({ index: 1 })

    // 5. Tiếp tục thanh toán
    await page.getByRole('button', { name: /tiếp tục thanh toán/i }).click()
    await expect(page.getByText(/phương thức thanh toán/i)).toBeVisible({ timeout: 5000 })

    // 6. Chọn COD
    await page.locator('input[name="payment"][value="cod"]').check()

    // 7. Đặt hàng
    await page.getByRole('button', { name: /đặt hàng & thanh toán/i }).click()

    // 8. Xác nhận thành công
    await expect(page.getByTestId('order-confirmation-heading').first()).toBeVisible({ timeout: 15000 })
  })
})