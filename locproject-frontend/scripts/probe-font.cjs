/* probe-font.cjs — probe nhanh: class trên h3 + rule CSS có tồn tại? */
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('[data-testid="carousel-track"] h3', { timeout: 30000 });
  const info = await page.evaluate(() => {
    const h3 = document.querySelector('[data-testid="carousel-track"] h3');
    const cs = getComputedStyle(h3);
    // tìm rule .font-serif-classic và .font-light (đệ quy vào @layer blocks)
    let hasSerifRule = false, hasLightRule = false;
    const scan = (rules) => {
      for (const r of rules) {
        if (r.selectorText?.includes('font-serif-classic')) hasSerifRule = true;
        if (r.selectorText === '.font-light') hasLightRule = true;
        if (r.cssRules) scan(r.cssRules);
      }
    };
    for (const sheet of document.styleSheets) {
      let rules; try { rules = sheet.cssRules; } catch { continue; }
      scan(rules);
    }
    // liệt kê TẤT CẢ rule khớp h3 + trạng thái layer (unlayered thắng layered!)
    const h3rules = [];
    const scan2 = (rules, inLayer) => {
      for (const r of rules) {
        const sel = r.selectorText || '';
        if (/(^|,)\s*h3\s*(,|$)/.test(sel) || /(^|,)\s*h1/.test(sel)) {
          h3rules.push({ sel: sel.slice(0, 80), inLayer, css: r.style?.cssText?.slice(0, 100) });
        }
        if (r.cssRules) scan2(r.cssRules, inLayer || r.constructor.name === 'CSSLayerBlockRule');
      }
    };
    for (const sheet of document.styleSheets) {
      let rules; try { rules = sheet.cssRules; } catch { continue; }
      scan2(rules, false);
    }
    return { cls: h3.className, family: cs.fontFamily, weight: cs.fontWeight, hasSerifRule, hasLightRule, h3rules };
  });
  console.log(JSON.stringify(info, null, 1));
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });