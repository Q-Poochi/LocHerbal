import { test, expect } from '@playwright/test'

// Do refresh-token rotation, mỗi test phải login mới (không dùng storageState tĩnh dùng chung)
test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill('rbac-admin-test@locherbal.local')
  await page.getByLabel(/mật khẩu/i).fill('Test1234!')
  await page.getByRole('button', { name: /đăng nhập/i }).click()
  await page.waitForURL(/\/admin/, { timeout: 10000 })
  await expect(page.getByText('LocHerbal Admin').first()).toBeVisible()
})

test.describe('Admin Panel', () => {
  test('dashboard hiển thị KPI và stock alert thật', async ({ page }) => {
    await page.goto('/admin')

    await expect(page.getByText('Bảng điều khiển tổng quan')).toBeVisible({ timeout: 10000 })

    // KPI cards: doanh thu hôm nay
    await expect(page.getByText(/doanh thu hôm nay/i)).toBeVisible()

    // StockAlertCard nối dữ liệu thật: có item dạng "Còn X sản phẩm"
    await expect(page.getByText(/còn \d+ sản phẩm/i).first()).toBeVisible({ timeout: 10000 })

    // Không còn empty state của stock card
    await expect(page.getByText('Tồn kho đang ổn định')).toBeHidden()
  })

  test('trang danh sách đơn hàng hiển thị dữ liệu', async ({ page }) => {
    await page.goto('/admin/orders')

    await expect(page.getByText('Quản lý Đơn hàng')).toBeVisible({ timeout: 10000 })

    // Có ít nhất 1 dòng đơn hàng
    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible({ timeout: 10000 })
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)

    // Cột mã đơn hiển thị ORD-
    await expect(page.getByText(/ORD-/).first()).toBeVisible()
  })

  test('tìm kiếm đơn hàng theo tên khách hàng', async ({ page }) => {
    await page.goto('/admin/orders')
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 })

    const searchInput = page.getByPlaceholder(/tìm mã đơn, tên kh/i)
    await searchInput.fill('Khách Test')
    await searchInput.press('Enter')

    // Kết quả lọc chỉ còn khách tên "Khách Test"
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Khách Test').first()).toBeVisible()

    const firstRowText = await page.locator('tbody tr').first().innerText()
    expect(firstRowText).toContain('Khách Test')
  })

  test('lọc đơn hàng theo khoảng ngày', async ({ page }) => {
    await page.goto('/admin/orders')
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 })

    const dateInputs = page.locator('input[type="date"]')
    await dateInputs.nth(0).fill('2026-08-01')
    await dateInputs.nth(1).fill('2026-08-04')

    // Chờ reload và vẫn hiển thị bảng
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/đơn hàng$/).first()).toBeVisible()
  })

  test('trang khách hàng hiển thị dữ liệu', async ({ page }) => {
    await page.goto('/admin/customers')

    await expect(page.getByText(/Quản lý Khách hàng/i)).toBeVisible({ timeout: 10000 })

    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible({ timeout: 10000 })
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
  })

  test('trang tồn kho hiển thị bảng và tổng hợp', async ({ page }) => {
    await page.goto('/admin/warehouse')

    await expect(page.getByText('Quản lý Kho hàng')).toBeVisible({ timeout: 10000 })

    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible({ timeout: 10000 })
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
  })
})
