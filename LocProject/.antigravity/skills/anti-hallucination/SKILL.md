---
name: anti-hallucination
description: LUÔN nạp skill này ở đầu mọi phiên làm việc và trước khi agent viết code, đề xuất kiến trúc, hoặc báo cáo kết quả. Đây là quy tắc nền tảng để giảm ảo giác (hallucination) khi vibe-code.
---

# Quy tắc bắt buộc để giảm hallucination

## 1. Không tự bịa API/thư viện
- Trước khi dùng bất kỳ package nào, kiểm tra nó đã có trong `package.json` chưa. Nếu chưa có, phải **đề xuất thêm** và chờ xác nhận, không tự `npm install` rồi code luôn như thể nó đã có sẵn.
- Không tự bịa method/API của thư viện (ví dụ tưởng tượng ra `prisma.order.findByStatus()` khi Prisma không có method này) — luôn kiểm tra doc chính thức hoặc type definition thật trong `node_modules/.../index.d.ts`.

## 2. Luôn bám vào repo tham khảo đã duyệt, không tự sáng tạo domain logic
Danh sách repo tham khảo chính thức của dự án:
| Repo | Dùng cho |
|---|---|
| `vendure-ecommerce/vendure` | Domain model Order/Promotion/Inventory/Tax, cấu trúc plugin mở rộng module |
| `vercel/commerce` | Kiến trúc storefront Next.js production |
| `medusajs/medusa` | Tham khảo module hóa commerce engine |
| `ixartz/Next-js-Boilerplate` | Cấu trúc project Next.js chuẩn, testing, CI/CD |

Khi thiết kế entity/API cho Sales, Catalog, Warehouse — agent phải nêu rõ: *"Tham khảo pattern [tên] từ repo [tên repo], file [đường dẫn]"* trước khi tự đề xuất cấu trúc riêng. Nếu không tìm thấy pattern phù hợp trong các repo trên, phải nói rõ "không có tham khảo trực tiếp, đây là đề xuất tự thiết kế" — không được trình bày như thể đó là pattern đã được kiểm chứng.

## 3. Không báo cáo kết quả chưa kiểm chứng
- Không nói "đã hoạt động", "đã xong", "đã test" nếu chưa thực sự chạy lệnh và thấy output. Phải dán log/output thật.
- Nếu không chắc chắn một thông tin (hành vi API bên thứ 3, quy định pháp lý, tỷ giá, phí cổng thanh toán...), phải nói rõ "cần xác minh lại" thay vì khẳng định chắc như đinh đóng cột.

## 4. Không tự giả định requirement chưa được xác nhận
- Khi thiếu thông tin để quyết định (ví dụ: "phí ship tính theo khu vực hay theo cân nặng?"), agent phải hỏi lại thay vì tự chọn một phương án và code như thể đó là quyết định đã chốt.
- Với các quyết định kiến trúc quan trọng (đổi ORM, đổi cách tính hoa hồng, đổi luồng thanh toán), bắt buộc dùng **Plan Mode**, không dùng Fast Mode.

## 5. Đối chiếu với trạng thái thật của project trước khi code
- Trước khi thêm field/API mới, agent phải đọc code thực tế hiện có (không suy đoán từ trí nhớ phiên trước) — dùng lệnh đọc file/grep để xác nhận entity, endpoint đã tồn tại hay chưa, tránh tạo trùng lặp hoặc mâu thuẫn với code đã có.
- Đọc `PROJECT_CONTEXT.md` ở gốc repo (xem file mẫu đi kèm) ở đầu mỗi phiên làm việc mới để nắm trạng thái dự án, tránh làm lại việc đã làm hoặc quên quyết định kiến trúc đã chốt trước đó.
