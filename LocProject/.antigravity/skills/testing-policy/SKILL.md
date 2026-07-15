---
name: testing-policy
description: Dùng khi viết code có logic nghiệp vụ, hoặc trước khi báo cáo một task đã hoàn thành. Bắt buộc kiểm chứng bằng test thật, không chỉ mô tả bằng lời.
---

# Chính sách testing bắt buộc

## Yêu cầu tối thiểu theo loại module
- **Sales, Accounting, Warehouse** (module liên quan tiền/tồn kho): coverage unit test tối thiểu 80% cho service layer.
- **Marketing, Catalog** (module ít rủi ro tài chính): coverage tối thiểu 60%.
- Mọi API endpoint mới phải có integration test gọi thật qua HTTP (supertest), không chỉ mock toàn bộ service.
- Luồng critical (checkout, thanh toán, tạo đơn hàng, đăng nhập) bắt buộc có E2E test (Playwright).

## Nguyên tắc chống "báo cáo giả"
- **Agent không được báo "đã hoàn thành" hoặc "hoạt động tốt" nếu chưa thực sự chạy test/build và thấy kết quả pass.** Phải dán output thực tế của lệnh chạy test (`npm test`, `npm run build`) vào phần báo cáo, không mô tả suông.
- Nếu test fail, phải nêu rõ fail ở đâu, không được "làm mượt" báo cáo bằng cách bỏ qua phần fail.
- Test phải assert vào hành vi thật (giá trị trả về, trạng thái DB sau khi chạy), không viết test rỗng kiểu `expect(true).toBe(true)` chỉ để đạt coverage.

## CI/CD
- Pull Request không được merge nếu CI (lint + typecheck + test) không pass 100% — không có ngoại lệ "merge trước, fix sau".
