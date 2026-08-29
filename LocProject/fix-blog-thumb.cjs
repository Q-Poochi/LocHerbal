const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  // Thumbnail trỏ file đã mất trên đĩa (test-blog-1.png) → null để UI render
  // fallback icon 'article' sạch đẹp thay vì ảnh vỡ.
  const posts = await prisma.blogPost.findMany();
  for (const p of posts) {
    if (p.thumbnailUrl && p.thumbnailUrl.includes('test-blog')) {
      await prisma.blogPost.update({ where: { id: p.id }, data: { thumbnailUrl: null } });
      console.log('CLEARED thumbnail:', p.slug);
    } else {
      console.log('OK:', p.slug, '| thumb=', p.thumbnailUrl ? 'co' : 'null');
    }
  }
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
