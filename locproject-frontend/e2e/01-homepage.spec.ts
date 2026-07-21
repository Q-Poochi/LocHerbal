import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('hiển thị đầy đủ sections', async ({ page }) => {
    await page.goto('/')
    
    // Hero section
    await expect(
      page.getByText(/chăm sóc sức khỏe/i)
        .or(page.getByText(/phương thuốc cổ truyền/i))
    ).toBeVisible()
    await expect(page.getByRole('link', { name: /khám phá sản phẩm/i }))
      .toBeVisible()
    
    // Trust badges / features
    await expect(
      page.getByText(/chính hãng|miễn phí|vận chuyển|tự nhiên/i).first()
    ).toBeVisible()
    
    // Category section
    await expect(page.getByText(/danh mục/i).first()).toBeVisible()
    
    // Featured products
    await expect(page.getByText(/nổi bật|sản phẩm/i).first()).toBeVisible()
  })

  test('navbar hiển thị khi đã đăng nhập', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('LocHerbal').first()).toBeVisible()
    await expect(
      page.getByText('Test User')
        .or(page.getByRole('link', { name: /tài khoản/i }))
    ).toBeVisible()
  })

  test('click logo về trang chủ', async ({ page }) => {
    await page.goto('/products')
    await page.getByText('LocHerbal').first().click()
    await expect(page).toHaveURL('/')
  })

  test('navigation links hoạt động', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /danh mục/i }).first().click()
    await expect(page).toHaveURL(/\/products/)
  })
})
