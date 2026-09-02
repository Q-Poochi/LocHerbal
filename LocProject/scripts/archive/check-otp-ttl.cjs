/* check-otp-ttl.cjs — xác minh bản ghi OTP mới nhất có TTL đúng 2 phút */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.otpCode.findFirst({ orderBy: { createdAt: 'desc' } })
  .then((r) => {
    if (!r) { console.log('NO OTP ROWS'); return; }
    const ttlMin = (new Date(r.expiresAt) - new Date(r.createdAt)) / 60000;
    console.log(`phone=${r.phone} purpose=${r.purpose} TTL=${ttlMin} phút`);
    if (Math.round(ttlMin) !== 2) { console.error('❌ TTL sai (mong đợi 2 phút)'); process.exit(1); }
    console.log('✅ Backend ghi expiry đúng 2 phút');
  })
  .then(() => p.$disconnect())
  .catch((e) => { console.error(e.message); process.exit(1); });