/* throttle-test.cjs — xác nhận /auth/login có throttle thật không (csrf-aware) */
let cookies = {}, csrfToken = '';
async function req(method, path, body) {
  const h = { 'Content-Type': 'application/json' };
  const c = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
  if (c) h['Cookie'] = c;
  if (csrfToken) h['x-csrf-token'] = csrfToken;
  const res = await fetch('https://backend-production-ebe64.up.railway.app' + path, {
    method, headers: h, body: body ? JSON.stringify(body) : undefined,
  });
  for (const sc of res.headers.getSetCookie ? res.headers.getSetCookie() : []) {
    const [pair] = sc.split(';');
    const eq = pair.indexOf('=');
    cookies[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
  }
  return res.status;
}
(async () => {
  let csrfToken2 = '';
  await req('GET', '/auth/csrf');
  for (let i = 1; i <= 8; i++) {
    const r = await fetch('https://backend-production-ebe64.up.railway.app/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'csrf_token=' + csrfToken2,
        'x-csrf-token': csrfToken2,
      },
      body: JSON.stringify({ email: `audit_rl3_${Date.now()}_${i}@test.local`, password: 'Xyz12345!' }),
    });
    const b = await r.text();
    if (!csrfToken2 || r.status === 403) {
      const rr = await fetch('https://backend-production-ebe64.up.railway.app/auth/csrf');
      csrfToken2 = JSON.parse(await rr.text()).csrfToken;
      console.log(`  (refresh csrf token)`);
    }
    console.log(`login ${i}: HTTP ${r.status}${r.status === 429 ? ' <-- RATE LIMITED' : ''} ${r.status !== 401 ? b.slice(0, 100) : ''}`);
  }
})();