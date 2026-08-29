/* probe-mojibake.cjs — Dò CHÍNH XÁC node nào chứa '??' trong DOM */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const path of ['/uu-dai', '/']) {
    await page.goto('http://localhost:3000' + path, { waitUntil: 'networkidle', timeout: 60000 });
    const hits = await page.evaluate(() => {
      const out = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        const t = n.textContent || '';
        if (/\?\?/.test(t)) {
          const el = n.parentElement;
          out.push({
            text: t.trim().slice(0, 120),
            tag: el?.tagName,
            cls: String(el?.className || '').slice(0, 80),
          });
          if (out.length >= 12) break;
        }
      }
      return { hits: out, total: (document.body.innerText.match(/\?\?/g) || []).length };
    });
    console.log(`\n=== ${path} — tổng '??': ${hits.total}`);
    hits.hits.forEach((h, i) => console.log(`${i + 1}. <${h.tag} class="${h.cls}"> → "${h.text}"`));
    if (!hits.hits.length) console.log('(không tìm thấy node văn bản nào chứa ?? — có thể do pseudo/DOM động)');
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });