/* analyze-css.cjs — fetch CSS chunk từ dev server, liệt kê TẤT CẢ rule h1-h6
 * và trạng thái layer của chúng (unlayered thắng layered trong CSS cascade) */
const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

(async () => {
  const html = await get('http://localhost:3000/');
  const cssUrls = [...html.matchAll(/href="([^"]+\.css[^"]*)"/g)].map((m) => m[1]);
  console.log('CSS chunks:', cssUrls);

  for (const u of [...new Set(cssUrls)]) {
    const css = await get('http://localhost:3000' + u);
    console.log(`\n=== ${u} (${css.length} bytes) ===`);
    // tìm mọi vị trí "h1" đứng đầu selector
    let idx = 0;
    while ((idx = css.indexOf('h1', idx)) !== -1) {
      // chỉ nhận nếu trông như selector: trước nó là {, }, ;, @layer hoặc đầu file
      const prev = css[idx - 1];
      if (prev === undefined || '{;}\n\r '.includes(prev)) {
        if (/^h[1-6]/.test(css.slice(idx, idx + 3))) {
          console.log('--- @' + idx + ' ---');
          // in thêm 200 ký tự TRƯỚC để thấy block opener (@layer base {...)
          console.log('BEFORE: ' + css.slice(Math.max(0, idx - 200), idx).replace(/\n/g, ' | '));
          console.log('RULE: ' + css.slice(idx, idx + 220).replace(/\n/g, ' | '));
        }
      }
      idx += 2;
    }
  }
})().catch((e) => { console.error(e.message); process.exit(1); });