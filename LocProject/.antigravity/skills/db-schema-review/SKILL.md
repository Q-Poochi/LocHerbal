---
name: db-schema-review
description: Dùng trước khi tạo hoặc sửa bất kỳ migration, entity, hay bảng dữ liệu nào. Bắt buộc với mọi thay đổi liên quan PostgreSQL.
---

# Quy tắc thiết kế & review database schema

## Trước khi viết migration
1. Đối chiếu với ERD hiện có trong `docs/erd.md` — nếu thay đổi làm lệch ERD, phải cập nhật ERD trong cùng PR.
2. **Không tự thêm cột mới vào bảng `product`** cho thuộc tính riêng của từng loại sản phẩm. Thuộc tính riêng theo danh mục phải đi qua `attribute_definition` + `product_attribute_value` (xem mục 6d trong tài liệu kiến trúc). Nếu agent thấy mình sắp thêm cột kiểu `lieu_dung`, `chong_chi_dinh` trực tiếp vào bảng `product` — dừng lại, dùng attribute động.
3. Mọi quan hệ giữa bảng phải có foreign key tường minh, không dùng "quan hệ ngầm" qua ID không ràng buộc.
4. Cột `nullable` phải có comment giải thích lý do tại sao được phép null.
5. Migration phải **reversible** — luôn viết cả `up` và `down`.

## Naming convention
- Tên bảng: snake_case, số nhiều (`orders`, `product_variants`)
- Tên cột: snake_case (`created_at`, `stock_qty`)
- Khóa chính luôn là `id` kiểu UUID, không dùng auto-increment integer cho entity nghiệp vụ chính (Order, Product, User) để tránh lộ số lượng bản ghi qua URL.

## Chống hallucination khi thiết kế schema
- Trước khi đặt tên field mới, agent phải kiểm tra entity tương ứng trong repo tham khảo `vendure-ecommerce/vendure` (ví dụ: Order, Promotion, StockLevel) xem họ đặt tên/cấu trúc thế nào, thay vì tự nghĩ ra field tùy tiện.
- Không tự "đoán" một bảng đã tồn tại — luôn `grep`/tìm trong thư mục `entities/` thực tế của project trước khi tham chiếu tên bảng trong code mới.

## Sau khi tạo migration
- Chạy migration trên môi trường local, xác nhận không lỗi, dán log kết quả chạy migration vào PR description — không báo "migration đã sẵn sàng" khi chưa thực sự chạy thử.
