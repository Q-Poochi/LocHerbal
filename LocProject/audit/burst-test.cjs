// burst-test.cjs — kiểm tra global throttler (limit 60/phút): GET /auth/csrf x70
const base = process.env.BASE_URL || 'http://localhost:4000';
(async () => {
  const counts = {};
  for (let i = 0; i < 70; i++) {
    const r = await fetch(base + '/auth/csrf');
    counts[r.status] = (counts[r.status] || 0) + 1;
  }
  console.log('GET /auth/csrf x70:', JSON.stringify(counts));
  console.log(counts['429'] ? 'PASS: global throttler hoat dong' : 'FAIL: global throttler cung KHONG hoat dong');
})().catch((e) => console.log('ERR', e.message));