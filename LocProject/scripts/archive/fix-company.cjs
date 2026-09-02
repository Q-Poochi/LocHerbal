/* fix-company.cjs — Sửa mojibake trong CompanySettings (Bug 1 phần footer).
 * Tái tạo DETERMINISTIC: mỗi cụm '?' khớp đúng 1 ký tự có dấu chuẩn,
 * cấu trúc câu giữ nguyên → không phán đoán mờ, không đổi nội dung khác. */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const before = await prisma.companySettings.findUnique({ where: { id: 'company-default' } });
  if (!before) {
    console.log('Không tìm thấy company-default — bỏ qua');
    return;
  }
  console.log('BEFORE:', JSON.stringify({ tagline: before.tagline, address: before.address }));

  const data = {};
  if (before.tagline === 'Th???o d?????c thi??n nhi??n') data.tagline = 'Thảo dược thiên nhiên';
  else if (before.tagline && /\?/.test(before.tagline)) console.log('WARN tagline khác dự kiến:', before.tagline);

  if (before.address === 'S??? 12, ???????ng Nguy???n Tr??i, Thanh Xu??n, H?? N???i')
    data.address = 'Số 12, đường Nguyễn Trãi, Thanh Xuân, Hà Nội';
  else if (before.address && /\?/.test(before.address)) console.log('WARN address khác dự kiến:', before.address);

  // Quét mọi trường text còn lại để chắc chắn không sót '?'
  ['companyName', 'description', 'about', 'workingHours', 'businessLicense']
    .filter((k) => before[k] && /\?/.test(before[k]))
    .forEach((k) => console.log('WARN trường khác còn ?: ' + k + '=', JSON.stringify(before[k])));

  if (Object.keys(data).length === 0) {
    console.log('Không có trường nào cần sửa');
    return;
  }
  await prisma.companySettings.update({ where: { id: 'company-default' }, data });
  const after = await prisma.companySettings.findUnique({ where: { id: 'company-default' } });
  console.log('AFTER :', JSON.stringify({ tagline: after.tagline, address: after.address }));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());