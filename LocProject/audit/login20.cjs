// login20.cjs — 20 POST /auth/login, kỳ vọng 429 khi mỗi IP (dual-stack = 2 IP) vượt 5
const base = process.env.BASE_URL || 'https://backend-production-ebe64.up.railway.app';
(async () => {
  const rr = await fetch(base + '/auth/csrf');
  const tok = JSON.parse(await rr.text()).csrfToken;
  const c = {};
  for (let i = 1; i <= 20; i++) {
    const r = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': tok, Cookie: 'csrf_token=' + tok },
      body: JSON.stringify({ email: `probe_${Date.now()}_${i}@test.local`, password: 'Xyz12345!' }),
    });
    c[r.status] = (c[r.status] || 0) + 1;
  }
  console.log('login x20:', JSON.stringify(c));
  console.log(c['429'] ? 'PASS: login rate limit CHAN DUOC (' + c['429'] + ' x 429)' : 'FAIL');
})().catch((e) => console.log('ERR', e.message));