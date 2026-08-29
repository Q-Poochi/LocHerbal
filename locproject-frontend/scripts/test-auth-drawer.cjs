/* test-auth-drawer.cjs — Kiểm chứng Quick Auth Sidebar:
 * mở từ nút Login → panel ~25% width từ phải, overlay, 3 tab, đóng bằng X / click ngoài / ESC */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const results = [];
  const check = (name, ok, detail = '') => {
    results.push(`${ok ? 'PASS' : 'FAIL'} — ${name}${detail ? ` (${detail})` : ''}`);
  };

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 60000 });

  /* Drawer khi ĐÓNG không biến mất khỏi DOM — nó bị translate-x-full +
   * opacity-0 trên wrapper. Wrapper mang aria-hidden="true" khi đóng,
   * đây mới là state đáng tin để assert (isVisible() luôn true do có bbox). */
  const drawerClosed = () =>
    page
      .locator('[data-testid="auth-drawer"]')
      .evaluate((el) => el.closest('[aria-hidden="true"]') !== null);

  // 1. Mở sidebar từ nút Login trên navbar
  await page.locator('header button:has-text("Đăng nhập")').first().click();
  await page.waitForTimeout(500);
  const drawer = page.locator('[data-testid="auth-drawer"]');
  check('Sidebar mở sau khi click Login', !(await drawerClosed()));

  // 2. Width ≈ 25% viewport (1440 * 0.25 = 360, min-w 380 → kỳ vọng 380–440)
  const box = await drawer.boundingBox();
  const w = box?.width ?? 0;
  check('Width ≈ 25% màn hình (380–440px)', w >= 380 && w <= 440, `w=${w}`);

  // 3. Panel bám mép phải
  check('Bám mép phải', Math.abs(box.x + w - 1440) < 2, `right-edge=${box.x + w}`);

  // 4. Overlay phủ phần còn lại
  const overlayVisible = await page
    .locator('div.fixed.inset-0 > div:first-child')
    .first()
    .isVisible();
  check('Overlay nền hiển thị', overlayVisible);

  // 5. Segmented control 3 tab
  for (const t of ['login', 'register', 'otp']) {
    check(`Tab ${t} tồn tại`, await page.locator(`[data-testid="auth-tab-${t}"]`).isVisible());
  }

  // 6. Chuyển tab Đăng ký → form xác thực danh tính đầy đủ khớp DB
  await page.locator('[data-testid="auth-tab-register"]').click();
  await page.waitForTimeout(200);
  check('Form Đăng ký: ô Họ và tên', await page.locator('[data-testid="auth-drawer"] input[placeholder="Họ và tên"]').isVisible());
  check('Form Đăng ký: ô Email', await page.locator('[data-testid="auth-drawer"] input[type="email"]').isVisible());
  check('Form Đăng ký: ô Số điện thoại', await page.locator('[data-testid="auth-drawer"] input[type="tel"]').isVisible());
  check('Form Đăng ký: 2 ô mật khẩu (khớp + nhập lại)',
    (await page.locator('[data-testid="auth-drawer"] input[type="password"]').count()) === 2);
  check('Form Đăng ký: checkbox điều khoản', await page.locator('[data-testid="auth-drawer"] input[type="checkbox"]').isVisible());

  // 7. Chuyển tab Xác thực SMS OTP → KHÔNG còn switcher đăng ký, chỉ nhập SĐT
  await page.locator('[data-testid="auth-tab-otp"]').click();
  await page.waitForTimeout(200);
  check('OTP: ô số điện thoại', await page.locator('[data-testid="auth-drawer"] input[type="tel"]').isVisible());
  check('OTP: đã bỏ switcher Đăng nhập/Đăng ký trong form',
    (await page.locator('[data-testid="auth-drawer"] input[type="tel"]').count()) === 1 &&
    !!(await page.locator('[data-testid="auth-drawer"] p:has-text("hiệu lực trong 2 phút")').isVisible()));

  // 7b. Gửi OTP (dev backend dùng SMS mock) → bước nhập mã + đếm ngược hết hạn 2 phút
  await page.locator('[data-testid="auth-drawer"] input[type="tel"]').fill('0912345678');
  await page.locator('[data-testid="auth-drawer"] button[type="submit"]:has-text("Gửi mã OTP")').click();
  await page.waitForTimeout(1500);
  const expiryText = await page.locator('[data-testid="otp-expiry"]').textContent().catch(() => null);
  check('OTP: hiển thị đếm ngược hết hạn (~2 phút)', !!expiryText && expiryText.includes('Hết hạn sau'), expiryText ?? 'không thấy');
  check('OTP: nút gửi lại bị khóa ngay sau khi gửi', await page.locator('[data-testid="auth-drawer"] button:has-text("Gửi lại mã")').isDisabled());
  // Trở về bước nhập SĐT cho các test đóng drawer phía dưới
  await page.locator('[data-testid="auth-drawer"] button:has-text("Đổi số khác")').click();
  await page.waitForTimeout(300);

  // 8. Về tab Đăng nhập: email + password + nút submit
  await page.locator('[data-testid="auth-tab-login"]').click();
  await page.waitForTimeout(200);
  check('Form Đăng nhập: ô Email', await page.locator('[data-testid="auth-drawer"] input[type="email"]').isVisible());
  check('Form Đăng nhập: ô Mật khẩu', await page.locator('[data-testid="auth-drawer"] input[type="password"]').isVisible());

  // 9. Đóng bằng X
  await page.locator('[data-testid="auth-drawer-close"]').click();
  await page.waitForTimeout(500);
  check('Đóng bằng nút X', await drawerClosed());

  // 10. Mở lại + đóng bằng click ngoài (overlay)
  await page.locator('header button:has-text("Đăng nhập")').first().click();
  await page.waitForTimeout(400);
  await page.mouse.click(300, 450); // vùng ngoài panel
  await page.waitForTimeout(500);
  check('Đóng bằng click ngoài sidebar', await drawerClosed());

  // 11. Mở lại + đóng bằng ESC
  await page.locator('header button:has-text("Đăng nhập")').first().click();
  await page.waitForTimeout(400);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  check('Đóng bằng phím ESC', await drawerClosed());

  console.log(results.join('\n'));
  const fails = results.filter((r) => r.startsWith('FAIL')).length;
  console.log(fails ? `\n❌ ${fails} test FAIL` : '\n✅ 11/11 PASS');
  await browser.close();
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });