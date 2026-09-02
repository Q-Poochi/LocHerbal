/* ═══════════════════════════════════════════════════════════════
 * repair-catalog.cjs — Sửa mojibake tiếng Việt trong DB (Bug 1+6)
 * Nguồn sự thật: prisma/seed.ts (dataset chuẩn, giữ nguyên từng chữ).
 *
 * KHÔNG PHÁ HỦY: seed.ts gốc dùng deleteMany toàn bộ catalog nhưng DB
 * đang có 2642 OrderItem + 3027 StockMovement tham chiếu → không thể
 * chạy nguyên bản. Chiến lược:
 *   1) Category upsert theo slug → sửa tên/mô tả đúng dấu
 *   2) Product  upsert theo slug → giữ ID cũ, FK đơn hàng nguyên vẹn
 *   3) Variant  chỉ TẠO MỚI theo SKU khi thiếu (không đổi giá đã có order)
 *   4) Stock    tạo StockItem qtyOnHand=100 cho variant chưa có (như seed)
 *   5) Image    đảm bảo mỗi product có ≥1 ProductImage
 *   6) Rác      xoá product chứa '??' nếu không còn đơn hàng tham chiếu
 * Chạy: node repair-catalog.cjs   (từ thư mục LocProject)
 * ═══════════════════════════════════════════════════════════════ */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Tim Mạch', slug: 'tim-mach', description: 'Sản phẩm hỗ trợ sức khỏe tim mạch', code: 'TM' },
  { name: 'Xương Khớp', slug: 'xuong-khop', description: 'Sản phẩm hỗ trợ xương khớp', code: 'XK' },
  { name: 'Tiêu Hóa', slug: 'tieu-hoa', description: 'Sản phẩm hỗ trợ tiêu hóa', code: 'TH' },
  { name: 'An Thần Ngủ Ngon', slug: 'an-than-ngu-ngon', description: 'Sản phẩm hỗ trợ giấc ngủ', code: 'AT' },
];

const PRODUCTS = [
  // ── Tim Mạch ──
  {
    name: 'Ích Tâm Khang', slug: 'ich-tam-khang',
    description: 'Ích Tâm Khang hỗ trợ tăng cường tuần hoàn máu, giúp tim mạch khỏe mạnh. Sản phẩm kết hợp bài thuốc cổ truyền với công nghệ hiện đại.',
    categoryCode: 'TM',
    variants: [
      { sku: 'LH-TM-001-30V', name: 'Hộp 30 viên', price: 165000, compareAtPrice: 220000, optionValues: { size: 'Hộp 30 viên' } },
      { sku: 'LH-TM-001-60V', name: 'Hộp 60 viên', price: 295000, compareAtPrice: 400000, optionValues: { size: 'Hộp 60 viên' } },
    ],
  },
  {
    name: 'Hạnh Phúc Huyết Áp', slug: 'hanh-phuc-huyet-ap',
    description: 'Hạnh Phúc Huyết Áp hỗ trợ ổn định huyết áp, giảm các triệu chứng chóng mặt, hoa mắt do huyết áp thất thường.',
    categoryCode: 'TM',
    variants: [
      { sku: 'LH-TM-002-30V', name: 'Hộp 30 viên', price: 125000, compareAtPrice: 170000, optionValues: { size: 'Hộp 30 viên' } },
      { sku: 'LH-TM-002-60V', name: 'Hộp 60 viên', price: 220000, compareAtPrice: 300000, optionValues: { size: 'Hộp 60 viên' } },
    ],
  },
  {
    name: 'Hoạt Huyết Dưỡng Não', slug: 'hoat-huyet-duong-nao',
    description: 'Hoạt Huyết Dưỡng Não giúp tăng cường lưu thông máu lên não, cải thiện trí nhớ và giảm đau đầu hiệu quả.',
    categoryCode: 'TM',
    variants: [
      { sku: 'LH-TM-003-30V', name: 'Hộp 30 viên', price: 145000, compareAtPrice: 195000, optionValues: { size: 'Hộp 30 viên' } },
      { sku: 'LH-TM-003-60V', name: 'Hộp 60 viên', price: 255000, compareAtPrice: 350000, optionValues: { size: 'Hộp 60 viên' } },
    ],
  },
  // ── Xương Khớp ──