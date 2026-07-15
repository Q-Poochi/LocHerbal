# PROJECT_CONTEXT.md

> **Bắt buộc:** đọc file này ĐẦU TIÊN ở mỗi phiên làm việc mới với Antigravity, trước khi nhận bất kỳ task nào.
> Sau khi hoàn thành mỗi task/phase, agent phải CẬP NHẬT lại file này trước khi kết thúc phiên.
> File này là "trí nhớ ngoài" của dự án — nó quan trọng hơn trí nhớ ngầm của agent trong 1 phiên chat, vì phiên chat sẽ mất khi đóng lại còn file này thì không.

---

## 1. Quyết định kiến trúc đã chốt (không được tự ý đổi)
- Backend: NestJS + TypeScript + PostgreSQL + Redis
- Frontend: Next.js App Router + TypeScript + Tailwind
- Kiến trúc: modular monolith, 8 module (Core, Sales, Marketing, Accounting, Warehouse, Supplier, Shipping, Catalog), giao tiếp qua Domain Event
- Catalog dùng mô hình attribute động (Category → AttributeDefinition → ProductAttributeValue), KHÔNG thêm cột cứng vào bảng `product`
- Repo tham khảo chính thức: vendure-ecommerce/vendure, vercel/commerce, medusajs/medusa, ixartz/Next-js-Boilerplate

*(Cập nhật mục này nếu có ADR mới — ghi rõ ngày và lý do đổi quyết định)*

## 2. Trạng thái từng module

| Module | Trạng thái | Ghi chú |
|---|---|---|
| Core (Auth/RBAC) | ⬜ Chưa bắt đầu | |
| Catalog | ⬜ Chưa bắt đầu | |
| Sales | ⬜ Chưa bắt đầu | |
| Warehouse | ⬜ Chưa bắt đầu | |
| Accounting | ⬜ Chưa bắt đầu | |
| Marketing | ⬜ Chưa bắt đầu | |
| Supplier | ⬜ Chưa bắt đầu | |
| Shipping | ⬜ Chưa bắt đầu | |

Trạng thái: ⬜ Chưa bắt đầu / 🟨 Đang làm / ✅ Xong + có test / ⚠️ Có vấn đề cần xem lại

## 3. Việc đang làm dở (để phiên sau tiếp tục đúng chỗ)
*(Cập nhật cuối mỗi phiên: đang làm gì, còn thiếu gì, bước tiếp theo là gì)*
-

## 4. Quyết định/giả định cần xác nhận với chủ dự án
*(Những chỗ agent đã hỏi nhưng chưa có câu trả lời, hoặc đã tự giả định tạm — liệt kê ở đây để không quên hỏi lại)*
-

## 5. Vấn đề/nợ kỹ thuật đã biết (technical debt)
*(Những chỗ code tạm, cần refactor sau, không được quên)*
-

## 6. Lịch sử quyết định quan trọng (ADR rút gọn)
| Ngày | Quyết định | Lý do |
|---|---|---|
| | | |
