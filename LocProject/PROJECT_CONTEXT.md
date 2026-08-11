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
| Shipping | ✅ Có + test | Carrier 8 + Shipment 15 + webhook GHN/GHTK 19 → 37 test. `@Roles('ADMIN')` uppercase bug đã sửa. |
| Admin (module 9) | ⚠️ Không có test | Dashboard có controller/service nhưng 0 spec. |

Tổng: **32 suites / 234 unit tests** (toàn bộ unit test mock Prisma) + **1 e2e saga** (`test/order-saga.e2e-spec.ts`: checkout→allocate→deduct→delivered, chạy `npx jest --config test/jest-e2e.json` với DB `ecommerce_test`).

Trạng thái: ⬜ Chưa bắt đầu / 🟨 Đang làm / ✅ Xong + có test / ⚠️ Có vấn đề cần xem lại

## 3. Việc đang làm dở (để phiên sau tiếp tục đúng chỗ)
- **Saga hardening + webhook GHN/GHTK + CI/CD (11/08/2026, G2-7→G2-9):**
  - **G1-1**: OrderCreatedListener đổi sang `emitAsync` — checkout `await` allocate xong mới trả về.
  - **G1-2**: VNPay IPN idempotent + retry chain; **G1-3**: checkout tách subdomain + gộp cart; **G1-4**: bỏ direct POST /orders; **G1-5**: README rules.
  - **G2-7**: e2e saga test (`test/order-saga.e2e-spec.ts`) PASS — checkout allocate 2 đơn vị, payment deduct, shipment DELIVERED.
  - **G2-8**: webhook GHN (`/api/v1/shipping/webhooks/ghn?token=`) + GHTK (`/api/v1/shipping/webhooks/ghtk?hash=`) — map status idempotent qua `ShipmentService.applyCarrierStatus`, exempt CSRF, nhận form-urlencoded, unit test 19. Chưa live vì thiếu sandbox token.
  - **G2-9**: rà soát Railway/CI-CD — fix case-sensitive `LOCPROJECT`→`LocProject` (backend-ci), fix biến `RAILWAY_*_SERVICE_ID` chưa khai báo (deploy-staging), thêm e2e step, Node 22, secrets GHN/GHTK. Hướng dẫn: mục 0 `DEPLOYMENT_CHECKLIST.md` + `.github/SECRETS_CHECKLIST.md`.
- **W1 — P0 idempotency `allocationStatus` cho saga allocate/deduct (11/08/2026):** ✅ Xong + có test.
  - Migration `20260811000000_add_order_allocation_status`: enum `AllocationStatus` (PENDING|ALLOCATED|FAILED) + cột `orders.allocation_status` default PENDING.
  - `order-created.listener`: set `ALLOCATED` sau khi allocate đủ hết items; set `FAILED` (try/catch không che lỗi gốc) + emit `inventory.allocation.failed` + trả `{success:false}` để checkout chặn đơn.
  - `payment-confirmed.listener`: đọc `allocationStatus` qua `waitForAllocation()` — `ALLOCATED`→deduct, `PENDING`→retry đọc lại DB (max 3 lần, delay 200ms), `FAILED`/hết retry/không thấy order→KHÔNG deduct + ghi audit `orderStatusHistory` (changedBy `WAREHOUSE_AUDIT`). Giữ `isOrderFullyAllocated` như lớp defense-in-depth cuối.
  - Test: `payment-confirmed.listener.spec.ts` 7 case (ALLOCATED deduct / PENDING→ALLOCATED retry deduct / PENDING hết retry không deduct / FAILED không deduct / order không tồn tại / reserve thiếu / deduct fail audit); `order-created.listener.spec.ts` 4 case (ALLOCATED, FAILED + compensation, FAILED không release, lỗi DB không che lỗi gốc).
- **Báo cáo đánh giá tổng thể (11/08/2026)**: `REPORT_DANH_GIA_HE_THONG.md` (repo root) — rà soát toàn bộ điểm yếu với file:line xác minh + khuyến nghị P0-P3. Mục 5 §5 đã đồng bộ theo báo cáo này. P0 đã đóng (idempotency `allocationStatus` cho `payment.confirmed` + spec 8 listener saga & Admin dashboard). Ưu tiên tiếp theo: unit test revenue report/controller (accounting), webhook GHN/GHTK live test với sandbox token.
- **Hoàn tất 3 phase xây dựng tính năng mới (09/08/2026):**
  - **Phase 1 — Marketing (commit `73518ac`)**: Admin CRUD Banner/Blog/Coupon (list + form + ImageUploader + ConfirmDialog), homepage wire public banners/blog/coupons. Fix: banner create nhận `isActive`, blog status lowercase + auto `publishedAt`.
  - **Phase 2 — Settings (commit `0ed635c`)**: `CompanySettings` (default row `company-default`), GET /settings/company public, admin GET/PATCH, `/admin/settings` form, Footer live (hotline, address, email, workingHours), /ve-chung-toi + /lien-he client pages.
  - **Phase 3 — Consultation booking (commit backend + frontend 09/08/2026)**: ConsultaLead → `preferredDate/preferredTime/confirmedAt`; LeadStatus + `CONFIRMED`/`CANCELLED`; migration `20260809110243_add_consultation_preferred_slot`; POST /consultations (public, validate giờ: T2-T6 08:00-17:00, T7 08:00-12:00, CN nghỉ, max 14 ngày), admin GET (filter status + pagination) + PATCH /:id/status (CONFIRMED/CONVERTED ghi confirmedAt). Frontend: storefront ConsultationForm (date picker 14 ngày, Sunday disabled, slot grid), Admin /admin/consultations (filter, tìm kiếm, chuyển trạng thái), sidebar VẬN HÀNH → Lịch tư vấn. Verified Playwright: booking UI + admin confirm flow.
  - **Hotfix hero (commit `6748f8c`)**: Banner admin (Phase 1) ĐÃ ĐÈ MẤT hero 2-cột gốc (chỉ render carousel khi có banner, `StaticHero` chỉ hiện khi không banner). Đã restore hero gốc (stats 200+/10K+/4.8, 2 CTA "Khám phá sản phẩm"/"Tư vấn miễn phí") → luôn render; Banner thành `BannerCarousel` riêng đặt DƯỚI hero. Ảnh vỡ do DB trỏ `test-banner-1/2.png` không tồn tại → đã copy 2 file png thật vào `uploads/products/`.
  - **Tách Hero khỏi Carousel (10/08/2026 commit `4f6b45d`)**: Thiết kế tách hoàn toàn 2 luồng bằng endpoint RIÊNG — KHÔNG gộp 'hero'/'home'. Backend: `GET /hero-banner` → 1 object hoặc null (service `getHeroBanner()` findFirst position='hero'), `PUT`/`DELETE /admin/hero-banner` (upsert/delete 1 bản ghi duy nhất), `GET /banners?position=home` → filter Ở BACKEND (gọi `getCarouselBanners()`). Frontend: `components/storefront/HeroSection.tsx` (toàn bộ khối hero, CHỈ fetch /hero-banner, render DUY NHẤT 1 ảnh — không có hero → fallback icon `local_pharmacy`), `components/storefront/BannerCarousel.tsx` (tự fetch /banners?position=home, không nhận prop banners nữa). 2 file có comment cảnh báo ở đầu. Admin: sidebar tách 2 mục "Ảnh Hero" → `/admin/hero-banner` (1 form: ảnh hiện tại + preview + Đổi ảnh/Xoá ảnh) và "Banner Carousel" → `/admin/banners` (đã BỎ nhãn "Trang chủ — Hero" gây nhầm, chỉ còn Carousel/Khuyến mãi). Verified Playwright: (1) có hero → khối hero hiện ảnh, carousel giữ nguyên 3 slide; (2) xoá hero → về icon, carousel không đổi; (3) Network có ĐÚNG 2 request riêng `GET /hero-banner` + `GET /banners?position=home`.
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
- **Rotate secrets (đang chờ chủ dự án)**: JWT_ACCESS/REFRESH_SECRET và VNPay HASH_SECRET/TMN_CODE trong `.env` là giá trị sandbox thật/guessable. Cần rotate bằng `openssl rand -hex 64` + đổi trong VNPay dashboard. `.env.example` đã bổ sung đầy đủ keys (08/08/2026).
  - **GHI CHÚ VẬN HÀNH (rotate JWT_REFRESH_SECRET)**: Phải đổi **đồng thời, cùng giá trị** ở cả 2 nơi, rồi restart cả 2 service: (1) Backend `LocProject/.env`, (2) Frontend `locproject-frontend/.env.local`. Quên 1 trong 2 sẽ khiến `proxy.ts` (Edge middleware) verify sai `refresh_token` bằng `process.env.JWT_REFRESH_SECRET` → redirect nhầm user hợp lệ về `/login` dù backend token vẫn còn hạn — dễ nhầm thành bug khác.
- **Saga fire-and-forget không bền (ĐÃ ĐÓNG 11/08/2026)**: `checkout` trả về trước khi `order.created→allocate` xong; `payment.confirmed→deduct` chạy không kiểm tra allocate đã xong → rò stock. Đã fix bằng 2 lớp: (1) checkout dùng `emitAsync` chờ allocate xong; (2) cột idempotency `orders.allocation_status` (W1) — deduct chỉ chạy khi `ALLOCATED`, retry nếu `PENDING`, chặn nếu `FAILED`, kèm `isOrderFullyAllocated` defense-in-depth. [Các ghi chú cũ khác đã đóng trước đó: `shipment.delivered` giờ CÓ listener tự chuyển DELIVERED (`shipment-delivered.listener.ts`) và `order.confirmed` CÓ emit từ admin + VNPay IPN → `order-confirmed.listener.ts` sống, chỉ còn TODO tích GHN/GHTK.]
- **Shipping chưa tính phí**: `order.service.ts:102` hardcode `shippingFee=0` — Carrier đã có model nhưng chưa wire vào checkout (Coupon thì ĐÃ wire: validate + ghi CouponUsage + usedCount atomic trong cùng transaction).
- **1 DTO thiếu validator**: `add-tracking-event.dto.ts` (shipping) không có bất kỳ `@Is*()` nào — `whitelist` sẽ chặn các field payload. (CreateCarrierDto đã có validator đầy đủ.)
- **Revenue 2 nguồn khác nhau**: accounting (lọc 1000 invoices) vs dashboard (aggregate orders).
- **ConfigService dùng chưa triệt để**: ConfigModule + `env.validation.ts` fail-fast (DATABASE_URL, JWT_*, VNP_*) ĐÃ có (08/2026) nhưng vẫn còn **32 chỗ đọc `process.env` trực tiếp** (`jwt.strategy.ts`, `otp.service.ts`, `auth.controller.ts`, `upload.controller.ts`, `catalog.module.ts` Redis, `vnpay.service.ts`, `app.module.ts` THROTTLE_LIMIT…). `AUTH_THROTTLE_LIMIT`, `SMS_PROVIDER_API_KEY`, `REDIS_HOST/PORT`, `API_URL`, CORS origins chưa được validate.
- **CORS+base URL hardcode dev**: `main.ts` origin cố định `localhost:3000/3001/4000`; `upload.controller.ts` fallback `http://localhost:4000` — cần theo env cho staging/prod.
- **Controller làm business/Prisma trực tiếp** (shipment, customer 12 chỗ, cart, payment, product, review, order, wishlist — 8 controller/27 chỗ) — vi phạm layering.
- **Test chưa phủ vùng rủi ro (đã đóng đợt 11/08/2026)**: guards (jwt-auth 6, roles 7), CSRF middleware (8), inventory allocate/deduct/release (8), **8 listener saga (đã có spec: order-created, order-cancelled, payment-confirmed ×2, purchase-order-received, inventory-allocation-failed, order-confirmed, shipment-delivered), Admin dashboard 1 spec (`dashboard.service.spec.ts`), e2e saga (`test/order-saga.e2e-spec.ts`)**. Còn thiếu: unit test cho `revenue` report/controller (accounting), `carrier-webhook.controller` (service đã có 19 test).
- **Deploy pipeline chưa thật**: `deploy-staging.yml` các bước deploy chỉ là `echo` TODO; frontend CI không chạy e2e/unit trong pipeline.
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
