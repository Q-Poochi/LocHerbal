// â”€â”€ Ká»ŠCH Báº¢N 1 â€” Race tá»“n kho: N user Ä‘á»“ng loáº¡t mua variant cÃ²n ÄÃšNG 1 â”€â”€
// N = 5, 10, 20, 50. Äá»‘i chiáº¿u DB trÆ°á»›c/sau tá»«ng N.
const lib = require('./race-lib.cjs');

async function runScenario(N) {
  console.log(`\nâ•â•â•â•â•â•â•â• N=${N} â•â•â•â•â•â•â•â•`);
  await lib.ensureRaceUsers(N);
  const sku = `RACE-S1-${N}`;
  const variantId = await lib.ensureTestVariant(sku, 1); // kho = ÄÃšNG 1
  const before = await lib.getStock(variantId);
  await lib.cleanupCartsByVariant(variantId);

  // add-to-cart cho N user (tuáº§n tá»± â€” add KHÃ”NG reserve nÃªn N-1/N Ä‘á»u OK)
  const clients = await lib.loginAll(N);
  for (const c of clients) await lib.addToCart(c, variantId, 1);

  // Báº¯n N checkout Äá»’NG THá»œI
  const results = await lib.fireSimultaneous(N, (i) => lib.checkout(clients[i], i));

  const success = results.filter((r) => r.status === 200 || r.status === 201);
  const insufficient = results.filter((r) => r.status === 400);
  const other = results.filter((r) => r.status !== 200 && r.status !== 201 && r.status !== 400);

  // Evidence tá»« DB
  const after = await lib.getStock(variantId);
  const okIds = success.map((r) => r.json?.id).filter(Boolean);
  const dbOrders = await lib.orderEvidence(okIds);
  const allocated = dbOrders.filter((o) => o.allocation === 'ALLOCATED').length;
  const statusBreakdown = {};
  results.forEach((r) => { statusBreakdown[r.status] = (statusBreakdown[r.status] || 0) + 1; });
  const failMsg = insufficient[0]?.json?.message || '';

  console.log(`  API breakdown: ${JSON.stringify(statusBreakdown)}`);
  console.log(`  DB: orders=${okIds.length} ALLOCATED=${allocated}`);
  console.log(`  Fail message máº«u: "${String(failMsg).slice(0, 70)}"`);
  lib.printEvidence(`N=${N}`, before, after);

  const pass =
    success.length === 1 &&
    insufficient.length === N - 1 &&
    other.length === 0 &&
    allocated === 1 &&
    after.qtyReserved === before.qtyReserved + 1 &&
    after.qtyOnHand === before.qtyOnHand;
  console.log(`  âŸ¹ N=${N} VERDICT: ${pass ? 'âœ… PASS' : 'ðŸš¨ FAIL'}`);
  return { pass, orderIds: okIds, variantId, sku };
}

(async () => {
  const allOrderIds = [];
  const results = [];
  let allPass = true;
  for (const N of [5, 10, 20, 50]) {
    const r = await runScenario(N);
    results.push({ N, pass: r.pass });
    allOrderIds.push(...r.orderIds);
    if (!r.pass) allPass = false;
  }
  // Cleanup: xÃ³a toÃ n bá»™ order test + reset stock vá» 0
  await lib.cleanupOrders(allOrderIds);
  for (const N of [5, 10, 20, 50]) await lib.ensureTestVariant(`RACE-S1-${N}`, 0);

  console.log('\nâ•â•â•â•â•â•â•â• Tá»”NG Káº¾T Ká»ŠCH Báº¢N 1 â•â•â•â•â•â•â•â•');
  results.forEach((r) => console.log(`  N=${String(r.N).padEnd(3)} ${r.pass ? 'âœ… PASS' : 'ðŸš¨ FAIL'}`));
  console.log(`Tá»”NG: ${allPass ? 'âœ… PASS â€” 0 oversell á»Ÿ má»i N' : 'ðŸš¨ FAIL'}`);
  await lib.prisma.$disconnect();
})().catch((e) => { console.error('FATAL:', e); process.exit(1); });
