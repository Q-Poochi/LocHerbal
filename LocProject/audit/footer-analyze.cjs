/* footer-analyze.cjs — phân tích homepage production: links pháp lý, href=#, footer text */
(async () => {
  const r = await fetch('https://frontend-production-d58e.up.railway.app/');
  const t = await r.text();
  const hrefs = [...t.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
  const legal = [...new Set(hrefs.filter((h) => /chinh|dieu|policy|terms|lien-he|ve-chung/i.test(h)))];
  console.log('Footer/legal links:', legal.length ? legal.join(' | ') : '(KHONG CO link chinh sach/dieu khoan/lien he)');
  console.log('href="#" count:', hrefs.filter((h) => h === '#').length);
  const f = t.match(/<footer[\s\S]{0,6000}?<\/footer>/i);
  if (f) {
    const text = f[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log('FOOTER TEXT:', text.slice(0, 600));
  } else console.log('KHONG tim thay <footer>');
  console.log('Co "Dai ly" / dia chi / GPKD?', /GPKD|Giấy phép|Địa chỉ|địa chỉ/i.test(f ? f[0] : ''));
})();