---
name: coding-standards
description: Dùng khi viết hoặc review bất kỳ code TypeScript/NestJS/Next.js nào trong dự án. Áp dụng cho mọi module Core, Sales, Marketing, Accounting, Warehouse, Supplier, Shipping, Catalog.
---

# Quy ước code bắt buộc

## Cấu trúc thư mục (NestJS module)
Mỗi module nghiệp vụ phải có cấu trúc thống nhất:
```
src/modules/{module-name}/
  {module-name}.module.ts
  controllers/
  services/
  dto/
  entities/
  events/          # domain events module này bắn ra
  listeners/        # domain events module này lắng nghe từ module khác
```

## Quy tắc bắt buộc
1. **Không import trực tiếp service của module khác.** Giao tiếp giữa module chỉ qua Domain Event (`@nestjs/event-emitter`) hoặc qua API nội bộ đã export rõ ràng trong `{module}.module.ts`. Nếu agent thấy mình sắp viết `import { OrderService } from '../sales/order.service'` trong module Warehouse — dừng lại, dùng event thay thế.
2. **Không dùng kiểu `any`.** Mọi DTO, entity, response phải có type rõ ràng. Nếu type chưa biết, tạo interface tạm và đánh dấu `// TODO: xác nhận type với business`.
3. **Naming:** file kebab-case (`order-item.entity.ts`), class PascalCase (`OrderItem`), biến/hàm camelCase, hằng số UPPER_SNAKE_CASE.
4. **Không hardcode giá trị nghiệp vụ** (phí ship, % hoa hồng, ngưỡng tồn kho cảnh báo...) — đưa vào bảng cấu hình (`SystemConfig`) hoặc biến môi trường, không hardcode trong code.
5. **Giới hạn độ phức tạp:** một service method không quá ~40 dòng logic; nếu dài hơn, tách thành các private method có tên mô tả rõ hành vi.
6. **Comment bắt buộc** cho mọi business rule không hiển nhiên (ví dụ: vì sao hoa hồng đại lý tính theo bậc lũy tiến) — comment giải thích "tại sao", không lặp lại "làm gì" đã rõ trong tên hàm.
7. **Absolute imports** dùng path alias (`@modules/sales/...`) thay vì relative path dài (`../../../`).

## Trước khi merge code
- Chạy `npm run lint` và `npm run typecheck` phải pass 100%, không skip bằng `// eslint-disable`.
- Không để lại `console.log` debug trong code merge vào `main`.
