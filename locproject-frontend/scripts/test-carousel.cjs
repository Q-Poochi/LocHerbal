/* test-carousel.cjs — Kiểm chứng carousel "Sản phẩm nổi bật" trên trang chủ:
 * 1 nhóm SP/lượt, nút prev/next, dots, auto-play 5s + pause khi hover, responsive 2/4 SP */
const { chromium } = require('playwright');

const URL = 'http://localhost:3000/';
const results = [];
const check = (name, ok, detail = '') => {
  results.push(`${ok ? 'PASS' : 'FAIL'} — ${name}${detail ? ` (${detail})` : ''}`);
};

/** Lấy translateX hiện tại của track (px) */
const trackX = (page) =>
  page.evaluate(() => {
    const el = document.querySelector('[data-testid="carousel-track"]');
    if (!el) return null;
    const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return m.m41;
  });

(async () => {
  const browser = await chromium.launch();

  /* ── Desktop 1440px: 4 SP/lượt → 2 nhóm (8 SP) ── */
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  const carousel = page.locator('[data-testid="featured-carousel"]');
  await carousel.waitFor({ state: 'visible', timeout: 30000 });

  const dots = await page.locator('[data-testid^="carousel-dot-"]').count();
  check('Desktop: có đủ dots (8 SP / 4 SP lượt = 2 nhóm)', dots === 2, `dots=${dots}`);

  check('Desktop: nút prev bị khóa ở trang đầu', await page.locator('[data-testid="carousel-prev"]').isDisabled());

  // Chỉ đúng 4 card nằm trong khung nhìn của track
  const visibleCards = await page.evaluate(() => {
    const wrap = document.querySelector('[data-testid="featured-carousel"] .overflow-hidden');
    const cards = wrap.querySelectorAll('a');
    const wRect = wrap.getBoundingClientRect();
    return [...cards].filter((c) => {
      const r = c.getBoundingClientRect();
      return r.left >= wRect.left - 1 && r.right <= wRect.right + 1;
    }).length;
  });
  check('Desktop: đúng 4 sản phẩm hiển thị 1 lượt', visibleCards === 4, `visible=${visibleCards}`);

  // Click next → track trượt đúng 1 trang
  await page.locator('[data-testid="carousel-next"]').click();
  await page.waitForTimeout(700);
  const x1 = await trackX(page);
  const wrapW = await page.evaluate(() =>
    document.querySelector('[data-testid="featured-carousel"] .overflow-hidden').getBoundingClientRect().width);
  check('Click next → track trượt 1 trang', x1 < -wrapW * 0.9, `x=${Math.round(x1)}`);
  check('Ở trang cuối: nút next bị khóa', await page.locator('[data-testid="carousel-next"]').isDisabled());

  // Click dot đầu → về trang 0
  await page.locator('[data-testid="carousel-dot-0"]').click();
  await page.waitForTimeout(700);
  check('Click dot 0 → về đầu', Math.abs(await trackX(page)) < 2, `x=${await trackX(page)}`);

  // Card đồng nhất kích thước: mọi card cùng chiều cao (dung sai 2px)
  const heights = await page.evaluate(() =>
    [...document.querySelectorAll('[data-testid="carousel-track"] a')].map((a) => a.getBoundingClientRect().height));
  const maxH = Math.max(...heights);
  const minH = Math.min(...heights);
  check('Card sản phẩm đồng nhất chiều cao', maxH - minH <= 2, `min=${minH.toFixed(1)} max=${maxH.toFixed(1)}`);

  // Kiểu chữ: tên sản phẩm dùng serif cổ điển mỏng (Cormorant Garamond, weight 300)
  const fontInfo = await page.evaluate(() => {
    const h3 = document.querySelector('[data-testid="carousel-track"] h3');
    if (!h3) return null;
    const cs = getComputedStyle(h3);
    return { family: cs.fontFamily, weight: cs.fontWeight };
  });
  check('Tên sản phẩm dùng serif cổ điển (Cormorant)',
    !!fontInfo && /cormorant/i.test(fontInfo.family), fontInfo?.family?.slice(0, 60));
  check('Tên sản phẩm đậm độ mỏng (weight 300)', fontInfo?.weight === '300', `weight=${fontInfo?.weight}`);

  // Auto-play 5s: đứng yên không hover → tự chuyển trang
  await page.mouse.move(10, 10); // rời khỏi vùng carousel
  const before = await trackX(page);
  await page.waitForTimeout(5800);
  const after = await trackX(page);
  check('Auto-play 5s tự chuyển trang', after !== before, `before=${before} after=${after}`);

  // Pause khi hover: giữ chuột trên carousel → không tự chuyển
  await carousel.hover();
  const hBefore = await trackX(page);
  await page.waitForTimeout(5800);
  const hAfter = await trackX(page);
  check('Hover vào carousel → auto-play tạm dừng', hAfter === hBefore, `before=${hBefore} after=${hAfter}`);
  await page.close();

  /* ── Mobile 390px: 2 SP/lượt → 4 nhóm ── */
  const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mob.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await mob.locator('[data-testid="featured-carousel"]').waitFor({ state: 'visible', timeout: 30000 });
  const mobDots = await mob.locator('[data-testid^="carousel-dot-"]').count();
  check('Mobile: 8 SP / 2 SP lượt = 4 nhóm', mobDots === 4, `dots=${mobDots}`);
  await mob.close();

  console.log(results.join('\n'));
  const fails = results.filter((r) => r.startsWith('FAIL')).length;
  console.log(fails ? `\n❌ ${fails} FAIL` : '\n✅ TẤT CẢ PASS');
  await browser.close();
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });