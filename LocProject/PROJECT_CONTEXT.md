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
| Hạ tầng DB & Migration | ✅ Xong + có test | Postgres Primary/Replica + PgBouncer local. Migration `20260713065626_first` tạo 42 bảng, replication hoạt động. |
| Core (Auth/RBAC) | ✅ Xong + có test | Auth Controller, JWT, Refresh Token Rotation, Role Guards. `auth.service.spec.ts` 12/12. |
| Catalog | ✅ Xong + có test | CRUD Category/Product/Variant, EAV chuẩn Vendure. `product.service.spec.ts` 5/5. |
| Sales | ✅ Xong + có test | Cart/Order/VNPay. `order` 20, `vnpay` 6, customer/admin 20 → 46 tests. Chờ test thật VNPay sandbox. |
| Warehouse | ✅ Xong + có test | InventoryService atomic. `inventory.service.spec.ts` 2 + admin-warehouse 2 → 4. |
| Accounting | ✅ Có + test | InvoiceService `8/8`; revenue report/controller chưa có test. |
| Marketing | ✅ Có + test | Coupon 10, Banner 7, Blog 8 → 25. Coupon chưa nối vào checkout. |
| Settings (module 10) | ✅ Xong + test | `CompanySettings` model + SettingsModule, GET /settings/company (public) + PATCH admin. Admin form + Footer live. |
| Consultation (module 11) | ✅ Xong + test | `ConsultationLead` (preferredDate/preferredTime/confirmedAt) + LeadStatus thêm CONFIRMED/CANCELLED. Booking public theo giờ làm việc (T2-T6 08-17, T7 08-12, CN nghỉ), admin list + status flow. 13 test. |
| Supplier | ✅ Có + test | Supplier 9 + PurchaseOrder 12 → 21. |
| Shipping | ✅ Có + test | Carrier 8 + Shipment 15... `@Roles('ADMIN')` uppercase bug đã sửa. |
| Admin (module 9) | ⚠️ Không có test | Dashboard có controller/service nhưng 0 spec. |

Tổng: **22 suites / 188 unit tests** (toàn bộ unit test mock Prisma, chưa có e2e).

Trạng thái: ⬜ Chưa bắt đầu / 🟨 Đang làm / ✅ Xong + có test / ⚠️ Có vấn đề cần xem lại

## 3. Việc đang làm dở (để phiên sau tiếp tục đúng chỗ)
- **Hoàn tất 3 phase xây dựng tính năng mới (09/08/2026):**
  - **Phase 1 — Marketing (commit `73518ac`)**: Admin CRUD Banner/Blog/Coupon (list + form + ImageUploader + ConfirmDialog), homepage wire public banners/blog/coupons. Fix: banner create nhận `isActive`, blog status lowercase + auto `publishedAt`.
  - **Phase 2 — Settings (commit `0ed635c`)**: `CompanySettings` (default row `company-default`), GET /settings/company public, admin GET/PATCH, `/admin/settings` form, Footer live (hotline, address, email, workingHours), /ve-chung-toi + /lien-he client pages.
  - **Phase 3 — Consultation booking (commit backend + frontend 09/08/2026)**: ConsultaLead → `preferredDate/preferredTime/confirmedAt`; LeadStatus + `CONFIRMED`/`CANCELLED`; migration `20260809110243_add_consultation_preferred_slot`; POST /consultations (public, validate giờ: T2-T6 08:00-17:00, T7 08:00-12:00, CN nghỉ, max 14 ngày), admin GET (filter status + pagination) + PATCH /:id/status (CONFIRMED/CONVERTED ghi confirmedAt). Frontend: storefront ConsultationForm (date picker 14 ngày, Sunday disabled, slot grid), Admin /admin/consultations (filter, tìm kiếm, chuyển trạng thái), sidebar VẬN HÀNH → Lịch tư vấn. Verified Playwright: booking UI + admin confirm flow.
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
- **Rotate secrets (đang chờ chủ dự án)**: JWT_ACCESS/REFRESH_SECRET và VNPay HASH_SECRET/TMN_CODE trong `.env` là giá trị sandbox thật/guessable. Cần rotate bằng `openssl rand -hex 64` + đổi trong VNPay dashboard. `.env.example` đã bổ sung đầy đủ keys (08/08/2026).
  - **GHI CHÚ VẬN HÀNH (rotate JWT_REFRESH_SECRET)**: Phải đổi **đồng thời, cùng giá trị** ở cả 2 nơi, rồi restart cả 2 service: (1) Backend `LocProject/.env`, (2) Frontend `locproject-frontend/.env.local`. Quên 1 trong 2 sẽ khiến `proxy.ts` (Edge middleware) verify sai `refresh_token` bằng `process.env.JWT_REFRESH_SECRET` → redirect nhầm user hợp lệ về `/login` dù backend token vẫn còn hạn — dễ nhầm thành bug khác.
- **Saga fire-and-forget không bền**: `checkout` trả về trước khi `order.created→allocate` xong; `payment.confirmed→deduct` có thể chạy trước allocate → rò stock. Cần outbox/idempotency key. `shipment.delivered` chưa có listener → đơn không tự DELIVERED; `order.confirmed` không ai emit → `order-confirmed.listener.ts` chết.
- **Coupon/Shipping chưa wire**: `order.service.ts` hardcode `discountAmount=0, shippingFee=0`; `coupon.service.ts` không được gọi từ checkout.
- **Nhiều DTO thiếu validator**: e.g. `CreateCarrierDto` không có `@IsString()` → POST luôn 400 (whitelist+forbidNonWhitelisted). Cần bổ sung validator decorator.
- **Revenue 2 nguồn khác nhau**: accounting (lọc 1000 invoices) vs dashboard (aggregate orders).
- **Chưa có ConfigModule**: 28+ chỗ đọc `process.env` trực tiếp; env thiếu fail-silent.
- **Controller làm business/Prisma trực tiếp** (product/order/accounting/customer...) — vi phạm layering.
- **Test chưa phủ vùng rủi ro**: guards (jwt-auth/roles), CSRF middleware, inventory allocate/release/deduct, listeners saga — 0 test. Admin module 0 test. Chưa có e2e/CI.
- **Đã sửa Đợt 1 (08/08/2026)**: `@Roles('ADMIN')`→`admin,staff`; IDOR shipment (ownership fail-closed); upload extension allowlist + ép đuôi theo MIME; bỏ fake product data (rating/soldCount/hardcode health text) → tính từ DB; cache category invalidation đúng key; `.gitignore` + untrack file rác (log/cookies/seed.js/migration_lock); **CSRF fail-closed** (request có dấu browser/Origin hoặc có csrf cookie mà không khớp x-csrf-token → 403; client trần không cookie được qua). Đã verify runtime bằng ma trận 6 case.
- **Frontend phải gửi header `x-csrf-token`**: CSRF cookie `csrf_token` là `httpOnly:false` — frontend (localhost:3000, cross-origin same-site) phải đọc từ `document.cookie` và gửi kèm mọi POST/PATCH/DELETE, nếu không bị 403. Đây là hành vi từ trước nhưng giờ fail-closed chặt hơn.

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

## 8. Auth cookie fix ✅

| Bug | Mô tả | File | Fix |
|---|---|---|---|
| BUG 1 | Frontend gọi API vào 3000 nhưng backend listen 4000 | `src/main.ts` | Frontend phải gọi API vào `http://localhost:4000` |
| BUG 2 | Thiếu cookie-parser middleware, `request.cookies` luôn undefined → refresh token flow fail | `src/main.ts` | Cài `cookie-parser`, thêm `app.use(cookieParser())` trước `app.enableCors()` |
| BUG 3 | NODE_ENV chưa set → secure cookie trên localhost http bị browser từ chối | `.env` | Thêm `NODE_ENV=development` |

**Port mapping chuẩn:**
- Backend NestJS API: `localhost:4000`
- Frontend Next.js: `localhost:3000`
- Playwright e2e baseURL: `http://localhost:3001`
- `NEXT_PUBLIC_API_URL=http://localhost:4000`
- Swagger docs: `http://localhost:4000/api/docs`

### Consultation API (Phase 3, module mới)
```
GET   /consultations/slots?date=YYYY-MM-DD   ← @Public, khung giờ theo ngày (CN → [])
POST  /consultations                        ← @Public, đặt lịch (fullName, phone, preferredDate, preferredTime, email?, note?, productId?)
GET   /consultations?status=&page=&limit=   ← admin/staff, list + filter
GET   /consultations/:id                    ← admin/staff
PATCH /consultations/:id/status             ← admin/staff, body {status}; CONFIRMED/CONVERTED ghi confirmedAt
PATCH /consultations/:id/assign             ← admin, body {assigneeId}
```
- Giờ làm việc: T2-T6 08:00→16:00 (slot giờ chẵn, 9 slot), T7 08:00→11:00 (4 slot), CN nghỉ. Max 14 ngày tới. Config: `src/modules/consultation/slot-config.ts`.

### Settings API (Phase 2)
```
GET    /settings/company          ← Public, company info (name, hotline, email, address, workingHours, ...)
GET    /settings/company/admin    ← admin/staff
PATCH  /settings/company          ← admin, body {field: value}
```
- Auto-create default row `id=company-default` khi module init.

**Verify:** curl POST `/auth/login` trả về `Set-Cookie: refresh_token=...; Path=/auth/refresh; HttpOnly; SameSite=Strict` ✅

### Ghi chú vận hành Phase 3 (09/08/2026)
- DB test có 2 lead demo: "Nguyen Van A" (CONFIRMED), "Nguyen Thi PW" (đã chuyển CONFIRMED khi verify UI) — có thể xóa khỏi `consultation_leads` khi cần dữ liệu sạch.
- `LeadStatus` enum mới: `NEW | CONTACTED | CONFIRMED | CONVERTED | CANCELLED | CLOSED`.
- Backend build sau khi sửa BE: `npx nest build` + restart process port 4000. `prisma generate` dễ EPERM nếu backend đang chạy — dừng trước khi generate/migrate.
