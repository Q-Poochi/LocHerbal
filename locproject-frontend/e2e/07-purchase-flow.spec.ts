import { test, expect } from '@playwright/test'

// Luồng dài nhất (province API ngoài + nhiều bước) → timeout 45s
test.setTimeout(45000)

// Do refresh-token rotation, login mới mỗi test (không dùng storageState dùng chung).
// Quan trọng: accessToken chỉ sống in-memory (không persist localStorage) nên toàn bộ
// luồng mua hàng phải dùng SPA navigation (click link) — KHÔNG được page.goto giữa các bước.
test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.waitForFunction(() => document.cookie.includes('csrf_token'), null, { timeout: 10000 })
  await page.getByLabel(/email/i).fill('test2@locherbal.com')
  await page.getByLabel(/mật khẩu/i).fill('Test@123456')
  await page.getByRole('button', { name: /đăng nhập/i }).click()
  await page.waitForURL('/', { timeout: 10000 })
  await expect(page.getByText(/Chào mừng trở lại/i).first()).toBeVisible()
})

test.describe('Purchase Flow (COD)', () => {
  test('hoàn tất đặt hàng COD từ đầu đến cuối', async ({ page }) => {
    // 1. Mở trang sản phẩm (reload chấp nhận được — refreshSession tự khôi phục phiên)
    await page.goto('/products/ich-tam-khang')
    const addBtn = page.getByRole('button', { name: /thêm vào giỏ/i })
    await addBtn.waitFor({ timeout: 10000 })

    // Chờ refreshSession hoàn tất rồi mới thêm vào giỏ (tránh nhảy login)
    await page.waitForTimeout(2000)
    await addBtn.click()
    await page.waitForTimeout(1200)

    // 2. Mở giỏ hàng: desktop navbar click mở drawer (SPA, giữ accessToken in-memory)
    await page.locator('a[href="/cart"]:visible').first().click()

    const checkoutBtn = page.getByRole('button', { name: /thanh toán/i })
    await checkoutBtn.waitFor({ timeout: 10000 })
    await checkoutBtn.click()
    await expect(page).toHaveURL('/checkout', { timeout: 10000 })

    // 3. Điền thông tin giao hàng (step 1)
    await page.waitForSelector('[data-testid="checkout-fullName"]', { timeout: 10000 })
    await page.fill('[data-testid="checkout-fullName"]', 'Nguyễn Văn A')
    await page.fill('[data-testid="checkout-phone"]', '0901234567')
    await page.fill('[data-testid="checkout-address"]', '123 Đường Láng, Đống Đa')

    // Chọn Tỉnh/Thành phố - chờ API provinces load (API bên ngoài, có thể chậm)
    const provinceSelect = page.getByText('Tỉnh / Thành phố *').locator('..').locator('select')
    await provinceSelect.waitFor({ timeout: 10000 })
    // Chờ tới khi select có >= 1 tỉnh thật (poll thay vì sleep cứng — chống flake)
    await expect
      .poll(async () => provinceSelect.locator('option').count(), { timeout: 20000 })
      .toBeGreaterThan(1)
    await provinceSelect.selectOption({ index: 1 }) // tỉnh đầu tiên

    // Chờ districts load rồi chọn quận đầu tiên
    const districtSelect = page.getByText('Quận / Huyện *').locator('..').locator('select')
    await page.waitForTimeout(2000)
    await districtSelect.selectOption({ index: 1 })

    // Chờ wards load rồi chọn phường đầu tiên
    const wardSelect = page.getByText('Phường / Xã *').locator('..').locator('select')
    await page.waitForTimeout(2000)
    await wardSelect.selectOption({ index: 1 })

    // 4. Sang bước thanh toán
    await page.getByRole('button', { name: /tiếp tục thanh toán/i }).click()
    await expect(page.getByText(/phương thức thanh toán/i)).toBeVisible({ timeout: 5000 })

    // 5. Chọn COD
    await page.locator('input[name="payment"][value="cod"]').check()

    // 6. Đặt hàng
    await page.getByRole('button', { name: /đặt hàng & thanh toán/i }).click()

    // 7. Màn hình thành công
    await expect(page.getByTestId('order-confirmation-heading')).toBeVisible({ timeout: 15000 })
  })
})
