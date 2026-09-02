// Compare frontend API calls vs backend NestJS routes
const fs = require('fs');
const path = require('path');

const ROOT = 'C:/Project/LocHerbal';
const FE = path.join(ROOT, 'locproject-frontend/src');
const BE = path.join(ROOT, 'LocProject/src');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

// ---- Frontend: extract apiClient.get/post/...('path'`...`) and raw axios calls
const feFiles = walk(FE);
const feCalls = new Map(); // path -> {file, method}
const dynamic = [];
for (const f of feFiles) {
  const src = fs.readFileSync(f, 'utf8');
  const re = /apiClient\s*\.\s*(get|post|put|patch|delete)\s*(?:<[^>]*>)?\s*\(\s*[`'"]([^`'"]+)[`'"]/g;
  let m;
  while ((m = re.exec(src))) {
    const [, method, raw] = m;
    const rel = path.relative(FE, f);
    if (raw.includes('${')) dynamic.push({ method: method.toUpperCase(), raw: raw.replace(/\$\{[^}]*\}/g, 'X'), file: rel });
    else if (!feCalls.has(raw)) feCalls.set(raw, { method: method.toUpperCase(), file: rel });
  }
}

// ---- Backend: extract @Controller('prefix') and @Get/Post/...('sub')
const beFiles = walk(BE);
const beRoutes = [];
for (const f of beFiles) {
  const src = fs.readFileSync(f, 'utf8');
  const rel = path.relative(BE, f);
  const cre = /@Controller\(\s*['"`]([^'"`]*)['"`]\s*\)/g;
  let c;
  const positions = [];
  while ((c = cre.exec(src))) positions.push({ prefix: c[1], start: c.index });
  if (!positions.length) continue;
  for (let i = 0; i < positions.length; i++) {
    const prefix = positions[i].prefix;
    const end = i + 1 < positions.length ? positions[i + 1].start : src.length;
    const segment = src.slice(positions[i].start, end);
    const mre = /@(Get|Post|Put|Patch|Delete|All)\(\s*(?:['"`]([^'"`]*)['"`]\s*)?\)/g;
    let m;
    while ((m = mre.exec(segment))) {
      beRoutes.push({ method: m[1].toUpperCase(), full: ('/' + [prefix, m[2] || ''].filter(Boolean).join('/')).replace(/\/+/g, '/'), file: rel });
    }
  }
}

const beSet = new Map();
for (const r of beRoutes) if (!beSet.has(r.full + ' ' + r.method)) beSet.set(r.full + ' ' + r.method, r);

console.log('=== FRONTEND CALLS (' + feCalls.size + ' static + ' + dynamic.length + ' dynamic) ===');
const unmatch = [];
for (const [p, info] of [...feCalls.entries()].sort()) {
  // match ignoring query strings and with generic param matching
  const clean = p.split('?')[0].replace(/\/+$/, '') || '/';
  const segs = clean.split('/');
  let hit = null;
  for (const [k, r] of beSet) {
    if (r.method !== info.method && info.method !== 'ALL') continue;
    const bsegs = r.full.split('/');
    if (bsegs.length !== segs.length) continue;
    let ok = true;
    for (let i = 0; i < segs.length; i++) {
      if (bsegs[i].startsWith(':')) continue;
      if (bsegs[i] !== segs[i]) { ok = false; break; }
    }
    if (ok) { hit = r.full; break; }
  }
  const tag = hit ? 'OK  ' : 'MISS';
  if (!hit) unmatch.push(clean);
  console.log(`${tag} ${info.method.padEnd(6)} ${p.padEnd(55)} <- ${info.file}`);
}
console.log('\n=== DYNAMIC (param) CALLS ===');
for (const d of dynamic) console.log(`${d.method.padEnd(6)} ${d.raw}`);
console.log('\n=== BACKEND ROUTES (' + beRoutes.length + ') ===');
for (const r of beRoutes.sort((a, b) => a.full.localeCompare(b.full))) console.log(`${r.method.padEnd(6)} ${r.full}`);
console.log('\n=== SUMMARY ===');
console.log('Frontend static calls:', feCalls.size, '| Unmatched:', unmatch.length);
console.log('Unmatched:', unmatch.join(', ') || '(none)');
