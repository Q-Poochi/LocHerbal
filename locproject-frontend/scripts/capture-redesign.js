const { chromium } = require('@playwright/test');
const path = require('path');

const OUT = path.join(__dirname, '..', '..', 'redesign-screenshots');
const PAGES = [
  { file: 'trang-chu', url: 'http://localhost:3000/' },
  { file: 'san-pham-detail', url: 'http://localhost:3000/products/ngn' },
  { file: 'tu-van', url: 'http://localhost:3000/tu-van' },
  { file: 'uu-dai', url: 'http://localhost:3000/uu-dai' },
  { file: 've-chung-toi', url: 'http://localhost:3000/ve-chung-toi' },
  { file: 'login', url: 'http://localhost:3000/login' },
  { file: 'register', url: 'http://localhost:3000/register' },
];

(async () => {
  const fs = require('fs');
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  for (const p of PAGES) {
    try {
      await page.goto(p.url, { waitUntil: 'networkidle', timeout: 60000 });
      // Đợi webfonts (Material Symbols tự host) để icon ligature render đúng,
      // tránh chụp được text thô khi font chưa load xong
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1000);
      // scroll to capture full page
      await page.evaluate(async () => {
        await new Promise((res) => {
          let y = 0;
          const step = () => {
            window.scrollTo(0, y);
            y += 700;
            if (y < document.body.scrollHeight) setTimeout(step, 60);
            else res();
          };
          step();
        });
      });
      await page.waitForTimeout(800);
      // QUAN TRỌNG: cuộn về đầu trước khi fullPage screenshot — nếu không,
      // sticky navbar sẽ bị vẽ lệch vào GIỮA ảnh (artifact của Playwright)
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT, p.file + '.png'), fullPage: true });
      console.log('OK', p.file);
    } catch (e) {
      console.log('FAIL', p.file, e.message.split('\n')[0]);
    }
  }
  await browser.close();
  console.log('DONE');
})();
