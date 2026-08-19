const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto('https://frontend-production-d58e.up.railway.app/', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'C:/Users/ADMIN/AppData/Local/Temp/opencode/home-before.png', fullPage: true });
  console.log('saved home-before.png');
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
