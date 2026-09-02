const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const BAD = /\?\?/;
(async () => {
  const prods = await p.product.findMany({ include: { variants: true }, orderBy: { createdAt: 'desc' } });
  console.log('TOTAL_PRODUCTS:', prods.length);
  const badP = prods.filter(x => BAD.test(x.name || '') || BAD.test(x.description || ''));
  console.log('CORRUPTED_PRODUCTS:', badP.length);
  badP.forEach(x => console.log('BAD_PRODUCT:', JSON.stringify({ id: x.id, name: x.name, slug: x.slug, createdAt: x.createdAt, variantCount: (x.variants||[]).length })));
  console.log('--- NEWEST 6 PRODUCTS ---');
  prods.slice(0, 6).forEach(x => console.log(JSON.stringify({ name: x.name, slug: x.slug, createdAt: x.createdAt, price0: (x.variants||[])[0]?.price ?? null })));
  try {
    const cats = await p.category.findMany();
    const badC = cats.filter(x => BAD.test(JSON.stringify(Object.values(x))));
    console.log('CATEGORY_TOTAL:', cats.length, 'CORRUPTED:', badC.length);
  } catch(e){ console.log('CATEGORY_SKIP', e.message.split('\n')[0]); }
  try {
    const blogs = await p.blogPost.findMany();
    const badB = blogs.filter(x => BAD.test(JSON.stringify(Object.values(x))));
    console.log('BLOGPOST_TOTAL:', blogs.length, 'CORRUPTED:', badB.length);
  } catch(e){ console.log('BLOGPOST_SKIP', e.message.split('\n')[0]); }
  await p.$disconnect();
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
