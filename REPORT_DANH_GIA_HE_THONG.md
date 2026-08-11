# Báo cáo đánh giá tổng thể hệ thống LocHerbal — Điểm yếu & rủi ro

> Ngày lập: 11/08/2026
> Phạm vi: Toàn bộ monorepo (backend `LocProject/`, frontend `locproject-frontend/`, CI/CD)
> Phương pháp: Rà soát code định hướng theo `.agent-rules/skills/security-checklist` và các ghi chú nợ kỹ thuật trong `PROJECT_CONTEXT.md`, sau đó xác minh bằng đọc file nguồn (không đoán già đoán non).

---

## 1. Tóm tắt điều hành

Dự án ở trạng thái **chất lượng trên trung bình nhưng chưa sẵn sàng production**:

- **Điểm mạnh đã xác minh**: 188 unit test / 22 suites, 10 bộ e2e Playwright, k6 load test, CSRF fail-closed, DTO whitelist + forbidNonWhitelisted, rate-limit đã wire, ConfigModule fail-fast 6 biến cốt lõi, coupon đã nối vào checkout, token refresh rotation, upload allowlist.
- **Vấn đề cấp bách nhất**: (1) luồng saga đặt hàng vẫn fire-and-forget — rò tồn kho khi `payment.confirmed → deduct` chạy trước `allocate`; (2) vi phạm phân lớp nghiêm trọng — 8 controller gọi Prisma trực tiếp; (3) không có e2e backend và 0 test cho toàn bộ 8 listener saga + Admin dashboard; (4) 32 chỗ đọc `process.env` trực tiếp dù ConfigModule đã tồn tại; (5) workflow deploy-staging chỉ là `echo` TODO giả.

> **Lưu ý quan trọng**: File `PROJECT_CONTEXT.md` (mục 5 – technical debt) chứa **nhiều mục đã lỗi thời**. Chi tiết tại mục 3.

---

## 2. Số liệu đã xác minh (11/08/2026)

| Hạng mục | Số liệu |
|---|---|
| Unit test (backend) | 188 `it()` trong 22 spec files (đếm trực tiếp từ source) |
| Spec đã có | jwt-auth.guard (6), roles.guard (7), csrf.middleware (8), inventory.service (8), order.service (22), auth.service (20), consultation (13), purchase-order (12), invoice (10), coupon (10), supplier (9), shipment (7), banner (7), blog (8), vnpay (6), product (5), carrier (8), customer controllers (…) |
| e2e Playwright (frontend) | 10 spec files (`e2e/00-public` → `08-account-redesign`) |
| e2e backend (`test/`) | **0** |
| Schema Prisma | 49 models |
| Listener saga | 8 files — **0 spec** |
| Controller gọi Prisma trực tiếp | **8 controllers / 27 chỗ** |
| Chỗ đọc `process.env` trực tiếp | **32** |
| CI/CD pipeline | 3 (`backend-ci`, `frontend-ci`, `deploy-staging`) |

---

## 3. Nợ kỹ thuật cũ ĐÃ ĐƯỢC SỬA (cần cập nhật PROJECT_CONTEXT)

Những mục sau đây ghi trong PROJECT_CONTEXT là **không còn đúng**, cần sửa để tránh đi sai hướng ở phiên sau:

| Ghi chú cũ (PROJECT_CONTEXT §5) | Thực trạng 11/08/2026 |
|---|---|
| "guards (jwt-auth/roles), CSRF middleware … 0 test" | Đã có `jwt-auth.guard.spec.ts` (6), `roles.guard.spec.ts` (7), `csrf.middleware.spec.ts` (8). |
| "inventory allocate/release/deduct — 0 test" | `inventory.service.spec.ts` phủ đủ: allocate race-lost → InsufficientStockException, deduct thiếu reserved → throw, release dùng `GREATEST(0,…)`. |
| "`order.confirmed` không ai emit → listener chết" | Đã emit ở `order.service.ts:374` (khi admin chuyển CONFIRMED) và `vnpay.service.ts:189` (IPN thành công). |
| "`shipment.delivered` chưa có listener → đơn không tự DELIVERED" | `shipment.service.ts:64` emit `shipment.delivered` và `shipment-delivered.listener.ts` tự cập nhật DELIVERED (idempotent). |
| "Coupon chưa nối vào checkout" | `order.service.checkout` gọi `couponService.validateCode` + `calculateDiscount`, ghi `CouponUsage` và tăng `usedCount` atomic (updateMany có điều kiện) trong cùng transaction. |
| "Compensating saga dùng `error.message.includes()`" | Đã refactor sang `InsufficientStockException.variantId` (`order-created.listener.ts:63-72`). |
| "`CreateCarrierDto` không có validator → POST luôn 400" | Đã có `@IsString/@IsNotEmpty/@IsBoolean`. |
| "Chưa có ConfigModule" | Đã có `env.validation.ts` (fail-fast 6 biến cốt lõi) wire vào `ConfigModule.forRoot({ validate })`. |
| "Chưa có rate limit" | `ThrottlerModule` + global `ThrottlerGuard` đã wire (`app.module.ts`); auth endpoints có `@Throttle` riêng. |

---

## 4. Điểm yếu hiện tại (xác minh từ code)

### 4.1. Rủi ro nghiêm trọng

#### W1. Saga đặt hàng vẫn fire-and-forget — rò tồn kho
- `order.service.checkout()` (`order.service.ts:188`) emit `order.created` rồi **trả về ngay**, không đợi allocate xong.
- `payment-confirmed.listener.ts` (warehouse) gọi `inventoryService.deduct` **không kiểm tra** xem `allocate` đã xong hay chưa, lỗi thì chỉ `logger.error` (line 20) — không bù trừ.
- Kết quả: IPN đến nhanh (khách thanh toán ngay) có thể `deduct` bù trừ trước `allocate`, hoặc allocate thất bại sau khi đơn đã CONFIRMED/thanh toán → không gỡ.
- **Thiếu**: outbox / idempotency key / chờ allocate trước khi nhận payment.

#### W2. Vi phạm phân lớp — controller trực tiếp làm DB access
8 controllers dùng `this.prisma.*` (business logic + query nằm ở tầng HTTP):
- `shipment.controller.ts` (28, 39), `customer.controller.ts` (12 chỗ: 27–168), `cart.controller.ts` (132–142), `payment.controller.ts` (23, 41), `product.controller.ts` (91), `review.controller.ts` (71), `order.controller.ts` (39–161), `wishlist.controller.ts` (44).

Rủi ro: khó unit-test, khó thêm quy tắc nghiệp vụ tập trung, logic kiểm tra quyền sở hữu rải rác theo từng endpoint → dễ sót IDOR khi mở rộng.

#### W3. 0 test cho toàn bộ hệ thống event/saga + Admin
- **8 listener saga không có spec nào** (order-created, order-cancelled, payment-confirmed x2, inventory-allocation-failed, purchase-order-received, order-confirmed, shipment-delivered). Đây chính là vùng rủi ro tiền bạc (tồn kho, trạng thái đơn).
- **Admin module 0 spec** (`dashboard.controller.ts` / `dashboard.service.ts`) — màn hình KPI thật sự không được bảo vệ bằng test.
- Không có **e2e backend** (`test/` rỗng): không test được chuỗi thật `checkout → order.created → allocate → VNPay IPN → deduct → shipment → DELIVERED`.

### 4.2. Rủi ro trung bình

#### W4. Dùng ConfigService không triệt để — 32 chỗ đọc `process.env` trực tiếp
ConfigModule đã có nhưng chỉ 1 file thực sự dùng ConfigService (và đó là để mock). Các chỗ đọc thẳng:
- `app.module.ts:29` (THROTTLE_LIMIT), `jwt.strategy.ts:8` (JWT_ACCESS_SECRET), `otp.service.ts` (23-54), `auth.service.ts:16`, `auth.controller.ts` (21-131), `upload.controller.ts:117` (API_URL), `catalog.module.ts:21-22` (Redis), `vnpay.service.ts:21-24`.
- Rủi ro: test/đa môi trường khó, thiếu type-safety, biến `AUTH_THROTTLE_LIMIT`, `SMS_PROVIDER_API_KEY`, `REDIS_HOST/PORT` **không nằm** trong `env.validation.ts` nên production có thể thiếu mà vẫn chạy sai.

#### W5. CORS & base URL hardcode môi trường dev
- `main.ts:37-41`: `origin` cố định `localhost:3000/3001/4000` — không đọc từ env, deploy staging/production sẽ chặn hoặc phải sửa code.
- `upload.controller.ts:117` fallback `http://localhost:4000`.
- `env.validation.ts` không validate `NODE_ENV` đúng enum nghiêm ngặt theo biến môi trường.

#### W6. `shippingFee` hardcode 0 ở checkout
`order.service.ts:102`: `const shippingFee = 0; // chưa có config`. Carrier đã có model nhưng không tính phí → doanh thu thiếu, không có cơ chế phí theo trọng lượng/khu vực.

#### W7. Deploy pipeline chưa thật
`deploy-staging.yml`: bước "Deploy to staging" chỉ `echo` TODOs, không deploy thật; `needs: []` cho backend. Frontend CI chỉ build, không test e2e trong pipeline.

#### W8. Revenue hai nguồn không thống nhất
Accounting lọc `Invoice` trong khi Dashboard aggregate `Order` — báo cáo doanh thu có thể lệch (đã ghi nhận trong PROJECT_CONTEXT, chưa được giải quyết).

### 4.3. Rủi ro thấp / xử lý đúng nơi khác

- **CSRF cookie `httpOnly:false`** (`csrf.middleware.ts:14`): bắt buộc vì frontend JS phải đọc để gửi `x-csrf-token`; HĐT lựa chọn có chủ đích nhưng cần biết là không chống được XSS đọc cookie (JWT access token vẫn phải để ngoài cookie mới an toàn).
- **1 DTO thiếu validator toàn bộ**: `add-tracking-event.dto.ts` (shipping) — không có bất kỳ `@Is*()` nào, `whitelist` sẽ chặn mọi field khác.
- **Prisma pinned v6.19.3** + image `bitnamilegacy/*` local: chủ ý (ADR) nhưng phải có kế hoạch thoát.
- **Secrets sandbox chưa rotate** (`JWT_*`, `VNP_*`): ghi nhận là guessable — ưu tiên rotate trước khi public.
- **Redis permission cache chưa triển khai** (ghi nhận trong PROJECT_CONTEXT, chưa code).

---

## 5. Khuyến nghị ưu tiên

| Ưu tiên | Hành động | Địa điểm |
|---|---|---|
| P0 | Thêm idempotency/outbox cho `payment.confirmed`; block deduct khi allocate chưa xong | `warehouse/listeners/payment-confirmed.listener.ts`, `sales/services/order.service.ts` |
| P0 | Viết spec cho 8 listener saga + Admin dashboard | `modules/**/listeners/`, `modules/admin/` |
| P1 | Nghiên cứu migrate Prisma access ra khỏi 8 controller (Service layer) | `sales/controllers/*`, `shipping/shipment.controller.ts`, `catalog/product|review.controller.ts` |
| P1 | Đưa THROTTLE_LIMIT, SMS_PROVIDER_API_KEY, REDIS_HOST/PORT, API_URL, CORS origins vào `env.validation.ts` + dùng ConfigService | `shared/config/env.validation.ts`, `main.ts`, `app.module.ts` |
| P1 | E2E backend cho chuỗi checkout→VNPay (sandbox thật) | `LocProject/test/` |
| P2 | Wire phí vận chuyển (Carrier) vào checkout; bỏ hardcode `shippingFee=0` | `order.service.ts:102` |
| P2 | Hoàn thiện `deploy-staging.yml` bằng deploy thật (Azure/Railway) | `.github/workflows/deploy-staging.yml` |
| P2 | Sửa budget: bổ sung validator cho `add-tracking-event.dto.ts` | `shipping/dto/` |
| P3 | Cập nhật `PROJECT_CONTEXT.md` §5 — gỡ các mục đã sửa (mục 3 ở trên) | `LocProject/PROJECT_CONTEXT.md` |
| P3 | Rotation secrets (JWT/VNPay) trước khi nhận traffic thật | `.env`, VNPay dashboard |

---

## 6. Kết luận

Hệ thống đã đạt nền tảng bảo mật và test hợp lý cho giai đoạn dev (user xác thực, CSRF, DTO, rate-limit, 188 unit test, coupon wire, saga bù trừ đã cứu được phần lõi). Chặn để về production được là: **đóng saga ordering atomic (W1)**, **test hết vùng event/Admin (W3)**, **tách DB access khỏi controller (W2)** và **cấu hình env/CORS theo môi trường (W4/W5)** — cùng với việc xóa/migration những mục nợ đã hết hạn trong PROJECT_CONTEXT để không làm sai kế hoạch các phiên sau.