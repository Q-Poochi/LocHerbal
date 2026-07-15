---
name: api-contract
description: Dùng khi tạo hoặc thay đổi bất kỳ API endpoint nào. Áp dụng nguyên tắc contract-first cho toàn bộ 8 module.
---

# Quy tắc API contract-first

## Trước khi code endpoint
1. Viết/cập nhật đặc tả OpenAPI (`openapi.yaml`) trước — mô tả request, response, mã lỗi. **Không viết code controller trước khi có contract.**
2. Nếu endpoint trả về danh sách, bắt buộc theo chuẩn pagination chung của dự án: `{ data: [], meta: { page, limit, total } }` — không tự sáng tạo format phân trang riêng cho từng module.
3. Response lỗi theo format thống nhất: `{ statusCode, message, error, timestamp, path }`.

## Versioning
- Tất cả endpoint nằm dưới `/api/v1/...`. Thay đổi phá vỡ tương thích (breaking change) phải tạo `/api/v2/...`, không sửa trực tiếp v1 đang được frontend dùng.

## Đồng bộ contract với code thật
- Sau khi implement, chạy `openapi-typescript` để sinh lại TypeScript client cho frontend — nếu có sai lệch giữa contract và code thực tế, agent phải báo rõ thay vì tự "sửa ngầm" một bên.
- Không giả định một endpoint đã tồn tại chỉ vì "nghe hợp lý" — luôn kiểm tra `openapi.yaml` hiện tại hoặc grep trong `controllers/` trước khi gọi API đó từ frontend.

## Swagger
- NestJS phải bật `@nestjs/swagger` tự sinh doc tại `/api/docs` từ decorator trong code, để đối chiếu contract khai báo và code thực thi luôn khớp nhau.
