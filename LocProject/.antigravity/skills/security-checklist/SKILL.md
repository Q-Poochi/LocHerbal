---
name: security-checklist
description: Dùng cho mọi endpoint API mới, đặc biệt các module Sales (thanh toán), Core (auth), Accounting (dữ liệu tài chính). Bắt buộc review trước khi merge.
---

# Checklist bảo mật bắt buộc

## Input & validation
- Mọi DTO nhận từ client phải validate bằng `class-validator` (NestJS) — không tin dữ liệu từ frontend.
- Không dùng raw SQL nối chuỗi; chỉ dùng ORM (TypeORM/Prisma) với parameterized query để chống SQL injection.

## Auth & phân quyền
- Mọi endpoint (trừ endpoint public catalog) phải có Guard kiểm tra JWT + Role/Permission tương ứng module (xem bảng RBAC ở mục 6e tài liệu kiến trúc).
- JWT access token hết hạn ngắn (15-30 phút), refresh token rotation, refresh token lưu ở httpOnly cookie — không lưu ở localStorage.
- Rate limiting bắt buộc trên: endpoint login, endpoint quên mật khẩu, webhook thanh toán (chống spam/brute-force).

## Secrets
- Không hardcode API key, DB password, JWT secret trong code. Tất cả qua biến môi trường (`.env`, không commit `.env` vào git — chỉ commit `.env.example`).
- Secrets ở môi trường production quản lý qua Azure Key Vault / secret manager, không qua file `.env` thô.

## Giao dịch & tiền
- Mọi thao tác ghi liên quan tiền (đơn hàng, thanh toán, hoa hồng đại lý) phải nằm trong DB transaction — rollback toàn bộ nếu một bước fail.
- Webhook thanh toán phải kiểm tra chữ ký (signature) từ cổng thanh toán trước khi xử lý — không tin payload chưa xác thực.
- Idempotency key bắt buộc cho các API tạo giao dịch để tránh xử lý trùng khi client gọi lại.

## Audit & log
- Mọi hành động sửa giá, hủy đơn, đổi trạng thái đơn hàng, điều chỉnh tồn kho phải ghi vào `audit_log` (ai, khi nào, giá trị cũ → mới).
- Không log thông tin nhạy cảm (mật khẩu, số thẻ, token) ra console/log file.

## Trước khi merge
- Chạy dependency scan (`npm audit` hoặc Dependabot) — không merge nếu có lỗ hổng mức High/Critical chưa xử lý.
- CORS chỉ whitelist domain thật của storefront/admin, không để `origin: '*'` ở production.
