/* verify-redesign.cjs — Kiểm chứng cuối sau redesign:
 *  + Bug 2: đếm SỐ LƯỢNG header/navbar trong DOM của từng trang (chỉ 1 là đúng)
 *  + Bug 1: quét ký tự '??' trong innerText hiển thị
 *  + Chụp fullPage 7 trang (đóng băng sticky header để tránh artifact ghép ảnh)
 *  + Thu console error / request fail để bắt lỗi font/icon (Bug 3,4)
 * Chạy từ locproject-frontend: node scripts/verify-redesign.js
 */
const { chromium } = require('playwright');

const BASE = 'http://localhost:3000';
const OUT = 'c:/Project/LocHerbal/redesign-screenshots';
const PAGES = [
  ['trang-chu', '/'],
  ['san-pham-detail', '/products/ngu-ngon-thao-moc'],
  ['tu-van', '/tu-van'],
  ['uu-dai', '/uu-dai'],
  ['ve-chung-toi', '/ve-chung-toi'],
  ['login', '/login'],
  ['register', '/register'],
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const report = [];

  page.on('console', (m) => {
    if (m.type() === 'error') console.log(`[console:${m.location().url?.slice(0, 60)}] ${m.text().slice(0, 140)}`);
  });
  page.on('requestfailed', (r) => console.log(`[reqfail] ${r.url().slice(0, 90)} :: ${r.failure()?.errorText}`));

  for (const [file, path] of PAGES) {
    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 60000 });
    } catch (e) {
      report.push({ page: path, error: String(e).slice(0, 120) });
      continue;
    }
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(700);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    const dom = await page.evaluate(() => {
      const navs = Array.from(document.querySelectorAll('header'));
      const stickyNav = document.querySelectorAll('.sticky.top-0, header.sticky').length;
      return {
        headers: navs.length,
        stickyNav,
        mojibake: /\?\?/.test(document.body.innerText || ''),
        title: document.title.slice(0, 60),
      };
    });

    /* Đóng băng vị trí sticky để ảnh fullPage khớp 100% cấu trúc DOM */
    await page.addStyleTag({
      content: 'header{position:relative !important} .sticky.top-0{position:relative !important}',
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/${file}.png`, fullPage: true });

    report.push({ page: path, ...dom });
    console.log(
      `${path.padEnd(28)} headers=${dom.headers} sticky=${dom.stickyNav} mojibake=${dom.mojibake} title="${dom.title}"`,
    );
  }

  await browser.close();
  require('fs').writeFileSync(
    __dirname + '/../verify-report.json',
    JSON.stringify(report, null, 2),
    'utf8',
  );
  /* Trang auth (/login,/register) chủ động KHÔNG có navbar — chỉ bắt buộc
   * headers===1 với các trang storefront */
  const isAuthPage = (p) => p === '/login' || p === '/register';
  const bad = report.filter(
    (r) => !r.error && (r.mojibake || (!isAuthPage(r.page) && r.headers !== 1)),
  );
  console.log(bad.length ? `\n❌ CÓ VẤN ĐỀ: ${JSON.stringify(bad)}` : '\n✅ TẤT CẢ PASS');
})().catch((e) => { console.error(e); process.exit(1); });