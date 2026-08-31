// burst150.cjs — burst 150 GET /auth/csrf, thống kê status codes
const base = process.env.BASE_URL || 'http://localhost:4000';
(async () => {
  const c = {};
  for (let i = 0; i < 150; i++) {
    const r = await fetch(base + '/auth/csrf');
    c[r.status] = (c[r.status] || 0) + 1;
  }
  console.log('burst x150:', JSON.stringify(c));
  console.log(c['429'] ? 'PASS: rate limit CHAN DUOC (' + c['429'] + ' x 429)' : 'FAIL: khong co 429');
})().catch((e) => console.log('ERR', e.message));