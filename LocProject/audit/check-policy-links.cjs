/* check-policy-links.cjs — href thật của các mục "Chính sách/Điều khoản" + trang tồn tại? */
(async () => {
  const r = await fetch('https://frontend-production-d58e.up.railway.app/');
  const t = await r.text();
  for (const label of ['Chính sách bảo mật', 'Chính sách đổi trả', 'Chính sách vận chuyển', 'Điều khoản dịch vụ', 'Tuyển dụng', 'Hệ thống phân phối']) {
    const i = t.indexOf(label);
    if (i < 0) { console.log(label, ': KHONG THAY'); continue; }
    const before = t.slice(Math.max(0, i - 300), i);
    const m = [...before.matchAll(/href="([^"]*)"/g)];
    console.log(label, '-> href:', m.length ? m[m.length - 1][1] : '(khong thay href gan)');
  }
  for (const p of ['/lien-he', '/chinh-sach-bao-mat', '/ve-chung-toi']) {
    const rr = await fetch('https://frontend-production-d58e.up.railway.app' + p);
    console.log('GET', p, '->', rr.status);
  }
})();