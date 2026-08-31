/* perf-measure.cjs — đo load time thật trên production bằng Chromium (Playwright) */
const { chromium } = require('C:/Project/LocHerbal/locproject-frontend/node_modules/playwright');
(async () => {
  const browser = await chromium.launch();
  for (const path of ['/', '/products/duong-tam-an-than']) {
    const page = await browser.newPage();
    const t0 = Date.now();
    await page.goto('https://frontend-production-d58e.up.railway.app' + path, { waitUntil: 'load', timeout: 60000 });
    const loadMs = Date.now() - t0;
    const nav = await page.evaluate(() => {
      const n = performance.getEntriesByType('navigation')[0];
      return n ? {
        ttfb: Math.round(n.responseStart - n.startTime),
        domContentLoaded: Math.round(n.domContentLoadedEventEnd - n.startTime),
        loadEvent: Math.round(n.loadEventEnd - n.startTime),
        transferKB: Math.round(n.transferSize / 1024),
      } : null;
    });
    /* đếm ảnh tổng + ảnh lazy */
    const imgs = await page.evaluate(() => {
      const all = [...document.querySelectorAll('img')];
      return { total: all.length, lazy: all.filter((i) => i.loading === 'lazy').length };
    });
    console.log(`${path}: load=${loadMs}ms | ttfb=${nav?.ttfb}ms | dcl=${nav?.domContentLoaded}ms | load=${nav?.loadEvent}ms | transfer=${nav?.transferKB}KB | imgs=${imgs.total} (lazy=${imgs.lazy})`);
    await page.close();
  }
  await browser.close();
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });