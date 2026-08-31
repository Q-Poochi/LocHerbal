// repro-throttle.cjs — reproduce rate-limit /auth/login (csrf-aware, tham số BASE_URL)
// Cách dùng: node audit/repro-throttle.cjs            -> local http://localhost:4000
//            BASE_URL=https://... node audit/repro-throttle.cjs  -> production
const base = process.env.BASE_URL || 'http://localhost:4000';

(async () => {
  // 1. Lấy CSRF token (double-submit: cookie csrf_token + header x-csrf-token cùng giá trị)
  let tok = '';
  let first = true;
  const codes = [];

  for (let i = 1; i <= 8; i++) {
    if (first || codes[codes.length - 1] === 403) {
      const rr = await fetch(base + '/auth/csrf');
      tok = JSON.parse(await rr.text()).csrfToken;
      first = false;
    }
    const r = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'csrf_token=' + tok,
        'x-csrf-token': tok,
      },
      body: JSON.stringify({
        email: `rlprobe_${Date.now()}_${i}@test.local`,
        password: 'Xyz12345!',
      }),
    });
    const b = await r.text();
    codes.push(r.status);
    console.log(`login ${i}: HTTP ${r.status}${r.status === 429 ? ' <-- RATE LIMITED' : ''}${r.status !== 401 ? ' ' + b.slice(0, 100) : ''}`);
  }

  const n = codes.filter((c) => c === 429).length;
  console.log(n > 0 ? `PASS: throttler hoat dong (${n} x 429)` : 'FAIL: 8 request, khong co 429 nao');
})().catch((e) => console.log('ERR', e.message));