import { test, expect, Page } from '@playwright/test'

async function login(page: Page, mobile = false) {
  await page.goto('/login')
  await page.waitForFunction(() => document.cookie.includes('csrf_token'), null, { timeout: 10000 })
  await page.getByLabel(/email/i).fill('test2@locherbal.com')
  await page.getByLabel(/mật khẩu/i).fill('Test@123456')
  await page.locator('form').getByRole('button', { name: /đăng nhập/i }).click()
  if (mobile) {
    const accountLink = page.locator('nav[aria-label="Bottom navigation"] a[href="/account"]')
    await accountLink.waitFor({ timeout: 20000 })
    await page.goto('/account')
    await page.getByText('Địa chỉ', { exact: true }).waitFor({ timeout: 10000 })
  } else {
    await page.getByTestId('navbar-account-btn').waitFor({ timeout: 20000 })
    await page.getByTestId('navbar-account-btn').click()
    await page.getByRole('link', { name: 'Tài khoản của tôi' }).click()
    await page.locator('h3', { hasText: 'Thông tin cá nhân' }).waitFor({ timeout: 10000 })
  }
}

test.describe('Account redesign', () => {
  test('sidebar + profile redesign', async ({ page }) => {
    await login(page)

    await expect(page.locator('span', { hasText: 'photo_camera' }).first()).toBeVisible()

    await expect(page.getByText('Đơn hàng', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Địa chỉ', { exact: true }).first()).toBeVisible()

    const activePill = page.locator('aside button', { hasText: 'Thông tin cá nhân' })
    await expect(activePill).toHaveClass(/bg-primary-100/)

    const verified = page.locator('p', { hasText: 'Đã xác thực' })
    await expect(verified).toBeVisible()
    await expect(verified).toHaveCSS('font-size', '12px')
    const emailInput = page.locator('input[readonly]')
    const emailBox = await emailInput.boundingBox()
    const verifiedBox = await verified.boundingBox()
    if (emailBox && verifiedBox) {
      expect(verifiedBox.y).toBeGreaterThan(emailBox.y + emailBox.height)
    }

    await expect(page.getByRole('button', { name: /^Hủy$/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Lưu thay đổi$/ })).toBeVisible()
  })

  test('orders tab vẫn hoạt động', async ({ page }) => {
    await login(page)
    await page.locator('aside button', { hasText: 'Đơn hàng của tôi' }).click()
    await page.waitForTimeout(1500)
    await expect(page.locator('h3', { hasText: 'Đơn hàng của tôi' })).toBeVisible()
  })

  test('address tab không còn icon location_off', async ({ page }) => {
    await login(page)
    await page.locator('aside button', { hasText: 'Địa chỉ' }).click()
    await page.waitForTimeout(1500)
    const off = await page.locator('span', { hasText: 'location_off' }).count()
    expect(off).toBe(0)
  })

  test('password tab vẫn hoạt động', async ({ page }) => {
    await login(page)
    await page.locator('aside button', { hasText: 'Đổi mật khẩu' }).click()
    await expect(page.getByRole('button', { name: /^Đổi mật khẩu$/ })).toBeVisible()
    const pwInputs = page.locator('form input[type=password]')
    await pwInputs.nth(0).fill('Test@123456')
    await pwInputs.nth(1).fill('NewTest@123456')
    await pwInputs.nth(2).fill('NewTest@123456')
    await page.getByRole('button', { name: /^Đổi mật khẩu$/ }).click()
    await expect(page.getByText('Đổi mật khẩu thành công')).toBeVisible({ timeout: 10000 })
    // đổi lại mật khẩu củ để không phá session test user
    await pwInputs.nth(0).fill('NewTest@123456')
    await pwInputs.nth(1).fill('Test@123456')
    await pwInputs.nth(2).fill('Test@123456')
    await page.getByRole('button', { name: /^Đổi mật khẩu$/ }).click()
    await expect(page.getByText('Đổi mật khẩu thành công')).toBeVisible({ timeout: 10000 })
  })

  test('responsive: mobile ẩn sidebar, hiện mobile tabs', async ({ page }) => {
    await login(page)
    await page.setViewportSize({ width: 375, height: 800 })
    await expect(page.locator('aside')).toBeHidden()
    const mobileTabs = page.locator('.md\\:hidden button', { hasText: 'Địa chỉ' })
    await expect(mobileTabs).toBeVisible()
    await mobileTabs.click()
    await page.waitForTimeout(1500)
    await expect(page.locator('span', { hasText: 'location_off' })).toHaveCount(0)
  })
})