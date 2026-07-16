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
- Repo tham khảo chính thức: vendure-ecommerce/vendure, vercel/commerce, medusajs/medusa, ixarty/Next-js-Boilerplate

## 2. Trạng thái từng module

| Module | Trạng thái | Ghi chú |
|---|---|---|
| Hạ tầng DB & Migration | ✅ Xong + có test | Postgres Primary/Replica + PgBouncer local. Bằng chứng: migration `20260713065626_first` tạo 42 bảng thành công, replication hoạt động (xác nhận qua `pg_stat_replication`). |
| Core (Auth/RBAC) | ✅ Xong + có test | Đã triển khai Auth Controller, JWT, Refresh Token Rotation, Role Guards. Bằng chứng: migration `20260713111915_add_user_sessions`, 9/9 unit test pass (`auth.service.spec.ts`). |
| Catalog | ✅ Xong + có test | CRUD Category/Product/Variant, thiết kế EAV chuẩn Vendure. Bằng chứng: 5/5 unit test pass (`product.service.spec.ts`) |
| Sales | 🟨 Đang làm | CartService, OrderService, VNPayService. Bằng chứng: unit test 14/14 pass (`order.service.spec.ts`, `vnpay.service.spec.ts`), chờ test thật VNPay sandbox. |
| Warehouse | ✅ Xong + có test | InventoryService: allocate/release/deduct atomic chống race condition. Bằng chứng: 9/9 unit test pass (`inventory.service.spec.ts`) |
| Accounting | ⬜ Chưa bắt đầu | |
| Marketing | ⬜ Chưa bắt đầu | |
| Supplier | ⬜ Chưa bắt đầu | |
| Shipping | ⬜ Chưa bắt đầu | |

Trạng thái: ⬜ Chưa bắt đầu / 🟨 Đang làm / ✅ Xong + có test / ⚠️ Có vấn đề cần xem lại

## 3. Việc đang làm dở (để phiên sau tiếp tục đúng chỗ)
- Backend Core hoàn tất.
- Storefront (Next.js): đang thực hiện Phase B — Convert HTML → React, từng file build pass mới chuyển tiếp.
  - File 1 (Design system / Tailwind config): ✅ Xong — đã xác minh 13/13 class đúng màu.
  - File 2 (Trang chủ): ✅ Xong — build pass, 10 component đã tạo, typography đã điều chỉnh.
  - File 3 (Danh sách SP): ⏳ Đang làm.
- Sau khi có storefront tối thiểu: chạy test thật VNPay sandbox để đóng open item cuối cùng của Sales module.

## 4. Quyết định/giả định cần xác nhận với chủ dự án
- Không có.

## 5. Vấn đề/nợ kỹ thuật đã biết (technical debt)
- **Local-Only Docker Images**: `docker-compose.yml` sử dụng hình ảnh `bitnamilegacy/postgresql:15` và `bitnamilegacy/pgbouncer:latest` vì các tag `bitnami/` tương ứng đã bị gỡ bỏ khỏi Docker Hub công cộng. Các hình ảnh legacy này bị đóng băng, không nhận bản vá bảo mật và chỉ dùng duy nhất cho môi trường phát triển cục bộ (local development). Ở môi trường staging/production, bắt buộc sử dụng dịch vụ cơ sở dữ liệu được quản lý (Managed Database Services) của đám mây (ví dụ: Azure Database for PostgreSQL Flexible Server hoặc GCP Cloud SQL).
- **Prisma Pinned to v6.x (v6.19.3)**: Dự án đang ghim phiên bản Prisma ở `6.19.3` để tránh độ phức tạp cấu hình của Prisma 7 (driver adapters, config file mới). Cần lên kế hoạch nâng cấp lên Prisma 7 khi hệ sinh thái ổn định hơn và cấu hình driver adapter được tích hợp mượt mà.
- **Redis Permission Cache**: Cần triển khai cơ chế cache quyền hạn vào Redis (key: `permissions:{userId}`, TTL 15 phút) tại các NestJS Guards để giảm tải truy vấn DB và tránh lỗi thời khi dùng JWT payload quá lớn.
- **Test thật VNPay sandbox**: Chưa test thật VNPay sandbox — thực hiện sau khi có Storefront tối thiểu để đóng open item cuối cùng của Sales module.
- **Compensating Saga Error Check**: Cơ chế compensating saga trong `order-created.listener.ts` đang dùng `error.message.includes()` để tìm `failedItemIndex` — dễ bị lỗi (fragile) khi format lỗi thay đổi. Cần refactor sang custom `InsufficientStockException` có chứa field `variantId` riêng sau khi hoàn thành các module còn lại.

## 6. Lịch sử quyết định quan trọng (ADR rút gọn)
| Ngày | Quyết định | Lý do |
|---|---|---|
| 2026-07-13 | Sử dụng Prisma v6.19.3 và tách biệt DATABASE_URL / DIRECT_URL | Tránh các rào cản cấu hình phức tạp của Prisma 7 (driver adapters) và đảm bảo các câu lệnh migration không đi qua cổng PgBouncer. |
| 2026-07-13 | Chuyển sang dùng `bitnamilegacy/*` cho local dev | Nhóm hình ảnh `bitnami/` mặc định cho Postgres 15 và PgBouncer đã không còn được phân phối công cộng trên Docker Hub. |
| 2026-07-15 | Typography scale convention cho Frontend | Text quá nhỏ trên trang chủ. Scale up lên 1 bậc: body text dùng text-body-lg, label/tag dùng text-body-sm, hệ heading dùng text-display-lg (không dùng -mobile suffix trừ khi cần responsive riêng biệt). |

## 7. Frontend Typography Convention (bắt buộc áp dụng khi convert các trang tiếp theo)

| Vị trí | Class phải dùng | Class CẤM dùng |
|---|---|---|
| Heading trang (h1/h2 hero) | `text-display-lg` | `text-display-lg-mobile` |
| Heading section (h2/h3) | `text-headline-lg` | `text-headline-md` (trừ card) |
| Tên sản phẩm card | `text-headline-md` | `text-label-bold` |
| Body text chính (mô tả) | `text-body-lg` | `text-body-md` |
| Label / tag / badge text | `text-body-sm` | `text-caption` |
| Footnote / meta / thời gian | `text-caption` | (giữ nguyên) |

**Responsive rule:** Mobile class giữ nguyên, `md:` trở lên scale up 1 bậc nếu container hẹp. 
Ví dụ: `text-body-lg md:text-headline-md` cho tên sản phẩm ở sidebar.
