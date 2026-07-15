# Cách dùng bộ skill này với Antigravity

## Cài đặt
1. Copy toàn bộ thư mục `skills/` này vào project của bạn tại `.antigravity/skills/` (hoặc thư mục skills mà Antigravity đang trỏ tới trong cấu hình project — kiểm tra `AGENTS.md`/config của Antigravity nếu tên thư mục khác).
2. Copy `PROJECT_CONTEXT.template.md` vào gốc repo, đổi tên thành `PROJECT_CONTEXT.md`, điền phần "Quyết định kiến trúc đã chốt".
3. Trong prompt đầu tiên của **mỗi phiên làm việc mới**, luôn mở đầu bằng:
   ```
   Đọc file PROJECT_CONTEXT.md và skill anti-hallucination trước khi bắt đầu.
   ```

## Thứ tự ưu tiên khi agent làm việc
1. `anti-hallucination` — nạp đầu tiên, luôn áp dụng
2. `PROJECT_CONTEXT.md` — đọc để biết trạng thái thật của dự án
3. Skill chuyên biệt theo loại task đang làm: `db-schema-review` (khi đụng migration), `security-checklist` (khi đụng auth/payment), `api-contract` (khi tạo endpoint), `testing-policy` (trước khi báo cáo hoàn thành), `coding-standards` (luôn áp dụng khi viết code), `git-commit-convention` (khi commit/PR)

## Kỷ luật phiên làm việc (quan trọng để không bị "quên")
- **Không chạy 1 phiên agent liên tục nhiều giờ cho nhiều module khác nhau.** Mỗi phiên nên giới hạn trong 1 task/1 module cụ thể — kết thúc phiên, cập nhật `PROJECT_CONTEXT.md`, rồi mới mở phiên mới cho việc tiếp theo.
- Việc liên quan tiền/dữ liệu người dùng (Sales, Accounting, Core-Auth) → luôn dùng **Plan Mode**, tự tay duyệt plan trước khi cho agent thực thi.
- Việc UI nhỏ, không rủi ro (đổi màu, sửa text, style) → dùng Fast Mode cho nhanh.
- Cuối mỗi phase (theo tài liệu lộ trình chính), yêu cầu agent tóm tắt: đã làm gì, test đã chạy chưa (dán output thật), còn thiếu gì — rồi mới merge.
