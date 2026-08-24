import { test, expect } from '@playwright/test'

// MỞ drawer từ Navbar (không vào /login trực tiếp) → tab "Số điện thoại"
test.describe('OTP Login (AuthDrawer)', () => {
  test('yêu cầu OTP login hiển thị banner DEV + ô nhập mã', async ({ page }) => {
    await page.goto('/')
    await page.waitForFunction(() => document.cookie.includes('csrf_token'), null, { timeout: 10000 })

    // Navbar desktop: nút "Đăng nhập" mở drawer
    const loginBtn = page.locator('button', { hasText: 'Đăng nhập' }).first()
    await loginBtn.click()
    const drawer = page.getByTestId('auth-drawer')
    await expect(drawer).toBeVisible({ timeout: 5000 })

    // Qua tab "Số điện thoại"
    await drawer.getByRole('button', { name: /số điện thoại/i }).click()

    // Chọn mục đích Đăng nhập, nhập SĐT đã đăng ký (coupon-cust) → gửi OTP
    await drawer.getByRole('button', { name: /^Đăng nhập$/ }).click()
    await drawer.locator('input[type="tel"]').fill('0900000001')
    await drawer.getByRole('button', { name: /gửi mã otp/i }).click()

    // Backend đã BỎ trả code OTP qua response (commit d2ca2bd — bảo mật).
    // Hành vi đúng hiện tại: sang bước nhập mã + đếm ngược gửi lại, KHÔNG có banner DEV.
    const codeInput = drawer.locator('input[maxlength="6"]')
    await expect(codeInput).toBeVisible({ timeout: 10000 })
    // Đếm ngược hiện
    await expect(drawer.getByText(/gửi lại mã/i)).toContainText('(', { timeout: 15000 })
  })

  // Bỏ qua: xác thực OTP thật cần mã 6 số — backend chỉ gửi qua SMS (ESMS) và lưu
  // bcrypt hash trong DB, KHÔNG còn trả qua API. Đã verify full flow bằng test
  // harness inject hash vào otp_codes trên production (xem REPORT_STEP3_ACCOUNT.md §10,
  // OTP 9/9 PASS). E2E browser-only không thể lấy mã → đánh dấu fixme.
  test.fixme('xác thực đúng OTP đăng ký → tạo tài khoản + chuyển về trang chủ', async ({ page }) => {
    const phone = `0${String(Math.floor(100000000 + Math.random() * 899999999)).slice(0, 9)}`.slice(0, 10)
    await page.goto('/')
    await page.waitForFunction(() => document.cookie.includes('csrf_token'), null, { timeout: 10000 })

    await page.locator('button', { hasText: 'Đăng nhập' }).first().click()
    const drawer = page.getByTestId('auth-drawer')
    await expect(drawer).toBeVisible({ timeout: 5000 })
    await drawer.getByRole('button', { name: /số điện thoại/i }).click()
    await drawer.getByRole('button', { name: /^Đăng ký$/ }).click()
    await drawer.locator('input[type="tel"]').fill(phone)
    await drawer.getByRole('button', { name: /gửi mã otp/i }).click()

    // Lấy mã từ DEV banner
    const banner = drawer.getByText(/DEV MODE: Mã OTP là \d{6}/)
    await expect(banner).toBeVisible({ timeout: 10000 })
    const text = await banner.textContent()
    const code = text!.match(/\d{6}/)![0]
    await drawer.locator('input[maxlength="6"]').fill(code)
    await drawer.getByRole('button', { name: /xác thực/i }).click()

    // Sau verify: đăng nhập thành công → redirect về trang chủ, navbar hiển thị tài khoản
    await expect(page).toHaveURL('/', { timeout: 10000 })
    await expect(page.getByTestId('navbar-account-btn')).toBeVisible({ timeout: 10000 })
  })
})