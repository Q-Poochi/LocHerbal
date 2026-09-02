# Archived one-off scripts

Các script xử lý dữ liệu một lần (data repair / census / probe) đã qua sử dụng.
Không chạy trong CI, không được import vào source. Giữ lại để tham khảo cách
xử lý khi cần repair dữ liệu tương tự trong tương lai.

| Script | Mục đích gốc |
| --- | --- |
| `repair-catalog.cjs` | sửa dữ liệu danh mục/sản phẩm bị lỗi |
| `repair-part-a..d.cjs` | sửa dữ liệu theo từng phần (4 đợt) |
| `fix-blog-thumb.cjs` | sửa thumbnail bài viết blog |
| `fix-cats-banners.cjs` | sửa categories/banners |
| `fix-company.cjs` | sửa thông tin company |
| `garbage-hygiene.cjs` | dọn dữ liệu rác (orphan records) |
| `db-census.cjs` | thống kê/tổng quan dữ liệu DB |
| `check-otp-ttl.cjs` | kiểm tra TTL của OTP |
| `probe-mojibake.cjs` | dò lỗi ký tự (mojibake) trong DB |

Chạy thủ công khi cần: `node scripts/archive/<file>.cjs` (cần `.env` trỏ đúng DB).
