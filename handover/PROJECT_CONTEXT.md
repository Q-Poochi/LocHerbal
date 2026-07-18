# PROJECT_CONTEXT.md — Trạng thái dự án LocHerbal

> **Bắt buộc:** Đọc file này ĐẦU TIÊN ở mỗi phiên làm việc mới.
> Agent cập nhật file này CUỐI MỖI PHIÊN trước khi đóng.
> File này là "trí nhớ ngoài" — quan trọng hơn trí nhớ của agent trong 1 phiên chat.

---

## 1. Quyết định kiến trúc đã chốt (KHÔNG tự ý đổi)

| Hạng mục | Quyết định |
|---|---|
| Backend | NestJS + TypeScript + Prisma 6.19.3 + PostgreSQL + Redis |
| Frontend | Next.js 16 App Router + TypeScript + Tailwind v4 + Zustand + React Query |
| Kiến trúc BE | Modular Monolith, 8 module, giao tiếp qua Domain Event |
| Catalog schema | EAV động (Category → AttributeDefinition → ProductAttributeValue) |
| Auth | JWT in-memory (15m, CHỈ nằm trong RAM — KHÔNG xuống localStorage) + Refresh Token httpOnly cookie (7d) + Rotation. Khi reload: gọi `POST /auth/refresh` (cookie tự gửi) để lấy accessToken mới. Chỉ `user` (không nhạy cảm) được persist. **QUYẾT ĐỊNH CUỐI: revert về in-memory, bỏ persist accessToken** (xem §12). |
| Thanh toán | VNPay async webhook (IPN = source of truth), MoMo (planned) |
| Vận chuyển VN | GHN / GHTK / Viettel Post (planned) |
| DB connection | App → PgBouncer :6432 | Migration → Direct :5434 |
| Repo tham khảo | vendure-ecommerce/vendure, vercel/commerce, ixartz/Next-js-Boilerplate |

---

## 2. Trạng thái từng module Backend

| Module | Trạng thái | Bằng chứng | Ghi chú |
|---|---|---|---|
| | Core (Auth/RBAC) | ✅ Xong + test | 9/9 unit test pass | UserSession table, RTR, Fail-fast JWT |
| | Catalog | ✅ Xong + test | 5/5 unit test pass | EAV attribute validation |
| | Warehouse | ✅ Xong + test | 9/9 unit test pass | Atomic allocate/release/deduct |
| | Sales | ✅ Xong + test | 14/14 unit test pass + Cart/Order/Payment controllers | VNPay sandbox test PASS, IPN flow CONFIRMED|PAID verified |
| | Accounting | ✅ Xong + test | 8/8 unit test pass | Invoice, PaymentTransaction, revenue report, payment.confirmed listener |
| | Marketing | ✅ Xong + test | 26/26 unit test pass | Banner, Coupon, BlogPost CRUD |
| | Supplier | ⬜ Chưa bắt đầu | — | Giai đoạn vận hành |
| | Shipping | ⬜ Chưa bắt đầu | — | Giai đoạn vận hành |

**Tổng test backend: 70/70 pass (9 suites)**
**API endpoints mới:**
- **Accounting:** GET /accounting/revenue, GET /accounting/invoices, GET /accounting/invoices/:orderId, GET /accounting/transactions/:orderId
- **Marketing:** GET/POST/PATCH/DELETE /marketing/banners, GET/POST/PATCH/DELETE /marketing/coupons, POST /marketing/coupons/validate, GET/POST/PATCH/DELETE /marketing/blog-posts


---

## 3. Trạng thái Frontend (Next.js 16)

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Project setup | ✅ Xong | Next.js 16.2.10, build pass 14 routes |
| Tailwind v4 config | ✅ Verified | All theme tokens mapped from Stitch |
| API client (axios) | ✅ Xong | Interceptor JWT + auto-refresh 401 |
| Zustand stores | ✅ Xong | auth.store (persist chỉ `user`, accessToken in-memory + refresh trên reload), cart.store |
| **Phase B (Stitch → React)** | **✅ HOÀN TẤT 10/10** | **Tất cả 10 file Stitch đã convert** |
| Trang chủ | ✅ Xong | File 2/10 — build pass |
| Danh sách sản phẩm | ✅ Xong | File 3/10 — build pass, ISR 60s, fallback mock data |
| Chi tiết sản phẩm | ✅ Xong | File 4/10 — build pass, Server/Client split |
| Giỏ hàng | ✅ Xong | File 5/10 — build pass, useCart full URL + auth persist |
| **Checkout** | ✅ Xong | **File 6/10** — CheckoutForm + PaymentSelector + OrderSummary |
| **Order success** | ✅ Xong | **File 7/10** — Server Component, SVG checkmark animation (CSS @keyframes), OrderSuccessActions (clear cart via useCartStore) |
| **Admin Dashboard** | ✅ Xong | **File 8/10** — KPI cards, RevenueChart (Recharts LineChart 30 ngày), RecentOrdersTable (sortable), StockAlertCard, LeadCard, AdminSidebar (collapse/expand), middleware.ts |
| **Admin Products** | ✅ Xong | **File 9/10** — ProductsTable (sortable + bulk select + floating bar), ProductFilterBar, ProductStatusBadge, pagination |
| **Admin Product Form** | ✅ Xong | **File 10/10** — ProductForm 4-tab (basic/variants/EAV/SEO), VariantEditor (inline editable), EAVAttributeForm (STRING/NUMBER/BOOLEAN/SELECT), PublishSidebar |
| Gắn API (Phase C) | ✅ Xong | React Query hooks + auth flow + error/loading states |

**Lưu ý kiến trúc:** OrderSummary.tsx ban đầu là Server Component nhưng CheckoutClient (Client) import nó → vi phạm Next.js rule. **Đã sửa:** thêm `'use client'` vào OrderSummary — Client import Client là hợp lệ.

---

## 4. Migrations đã chạy (theo thứ tự)

```
20260713065626_first              ← Schema đầy đủ 42 bảng (tất cả 8 module)
20260713111915_add_user_sessions  ← Bảng UserSession cho RTR auth
```

---

## 5. API Endpoints đã có (Backend)

### Cart (mới)
```
GET    /cart                    ← Lấy giỏ hàng (JWT hoặc ?sessionId)
POST   /cart/items              ← Thêm item (body: productVariantId, qty)
PATCH  /cart/items/:variantId   ← Cập nhật qty
DELETE /cart/items/:variantId   ← Xóa item
POST   /cart/checkout           ← Checkout (JWT required, tạo order từ cart)
```

### Orders (mới)
```
GET    /orders                  ← Danh sách đơn của customer (JWT required)
GET    /orders/:id              ← Chi tiết đơn (JWT, ownership check)
POST   /orders/:id/cancel       ← Hủy đơn (chỉ PENDING/CONFIRMED, idempotent)
```


### Core/Auth
```
POST /auth/register
POST /auth/login         → Set httpOnly cookie refresh_token; response: { accessToken, user: {id,email,fullName} }
GET  /auth/me            → JWT required (@User('userId') decorator); trả về user hiện tại (dùng restore session sau reload)
POST /auth/refresh       → Đọc cookie, rotate token; response: { accessToken }
POST /auth/logout        → Revoke session, clear cookie
```

> Lưu ý: endpoint thực tế là `/auth/...` (AuthController dùng `@Controller('auth')`, không có prefix `/api/v1`).
> Login response GIỜ trả về cả `user` (trước đây chỉ trả `{ accessToken }`). File mới: `src/modules/core/decorators/user.decorator.ts`.

### Catalog
```
GET    /api/v1/categories
POST   /api/v1/categories
GET    /api/v1/categories/:id/attributes
GET    /api/v1/products
GET    /api/v1/products/:slug
POST   /api/v1/products
PATCH  /api/v1/products/:id
DELETE /api/v1/products/:id
```

### Sales (Payment)
```
GET    /payment/vnpay-url?orderId=   ← Tạo URL thanh toán VNPay
GET    /payment/vnpay-ipn           ← @Public(), verify checksum
GET    /payment/vnpay-return        ← @Public(), hiển thị kết quả
```

### Customers
```
GET    /customers/addresses         ← List customer addresses (JWT required)
POST   /customers/addresses         ← Create customer address (JWT required)
PATCH  /customers/addresses/:id/default ← Set default address (JWT required)
DELETE /customers/addresses/:id     ← Delete customer address (JWT required)
```

### Warehouse
```
GET  /api/v1/admin/warehouse/low-stock
```

### Admin (cần role phù hợp)
```
GET  /api/v1/admin/stats/today
GET  /api/v1/admin/stats/revenue?period=30d
GET  /api/v1/admin/orders?limit=&sort=
GET  /api/v1/admin/leads?status=&limit=
```

---

## 6. Cấu trúc thư mục Stitch export (frontend)

```
locproject-frontend/stitch-export/stitch_pylora_design_system/
  th_nh_ph_n_giao_di_n_locherbal/    ← File 1: Design system components
  trang_ch_locherbal/                ← File 2: Trang chủ
  danh_s_ch_s_n_ph_m_tim_m_ch_desktop/ ← File 3: Danh sách SP desktop
  danh_s_ch_s_n_ph_m_tim_m_ch_mobile/  ← File 3b: Danh sách SP mobile
  chi_ti_t_s_n_ph_m_tim_m_ch_desktop/  ← File 4: Chi tiết SP desktop
  chi_ti_t_s_n_ph_m_tim_m_ch_mobile/   ← File 4b: Chi tiết SP mobile
  gi_h_ng_locherbal_desktop/         ← File 5: Giỏ hàng
  thanh_to_n_locherbal_desktop/      ← File 6: Checkout
  t_h_ng_th_nh_c_ng_locherbal_desktop/ ← File 7: Order success
  b_ng_i_u_khi_n_admin_locherbal/   ← File 8: Admin dashboard
  qu_n_l_s_n_ph_m_locherbal_admin/  ← File 9: Admin products list
  th_m_s_a_s_n_ph_m_locherbal_admin/ ← File 10: Admin product form
```

---

## 7. VNPay Sandbox Test Checklist

**Trạng thái: ✅ Đã test PASS**

Kết quả:
- IPN flow: CONFIRMED | PAID verified
- Bug tìm thấy: `VNP_HASH_SECRET` trong `.env` có typo (`NJPO` → `NJP0`) — đã fix

Test flow đã verify:
- `GET /payment/vnpay-url?orderId=<order_id>` → trả về URL VNPay
- Dùng URL trong browser → VNPay sandbox hiển thị form thanh toán
- Nhập thẻ test → redirect về `/payment/vnpay-return`
- VNPay gửi IPN callback đến `/payment/vnpay-ipn`
- DB: `order.paymentStatus` = PAID, `order.status` = CONFIRMED

## 8. Backend hardening — đã hoàn thành

### Global Exception Filter
- File: `src/shared/filters/http-exception.filter.ts` (mới)
- Catch all exceptions, map Prisma error codes (P2002 → 409, P2025 → 404, others → 500)
- Response format: `{ statusCode, message, error, timestamp, path }`
- KHÔNG leak stack trace ra response
- Register global trong `main.ts` với `app.useGlobalFilters()`

### Global Validation Pipe
- Trong `main.ts`: `whitelist: true, forbidNonWhitelisted: true, transform: true`

### InsufficientStockException (refactor nợ #4 cũ)
- File: `src/modules/warehouse/exceptions/insufficient-stock.exception.ts` (mới)
- Extends `BadRequestException`, constructor nhận `variantId, requested, available`
- `inventory.service.ts`: allocate() + deduct() throw `InsufficientStockException` thay vì `BadRequestException`
- `order-created.listener.ts`: dùng `findFailedItemIndex()` đọc `error.variantId` từ `InsufficientStockException`, không còn `error.message.includes()`
- `InventoryAllocationFailedEvent`: thêm `variantId` và `failedItemIndex`
- **Nợ #4 (cũ) đã xóa khỏi danh sách** — compensating saga đã refactor xong

## 9. Việc đang làm dở — tiếp tục từ đây

**Phase B (Stitch → React convert): ✅ HOÀN TẤT 10/10 FILE**

Kiến trúc Server/Client split pattern:
- Server Component: ProductGallery, ProductInfo, RelatedProducts, ProductReviews, ProductTabs, FeaturedProducts, HeroBanner, CategoryGrid, Footer, KPICard, StockAlertCard, LeadCard
- Client Component (islands): GalleryThumbnails, ProductDetailClient, WriteReviewButton, AddToCartButton, ConsultationForm, Navbar, FilterSidebar, SortBar, ProductGrid, CheckoutForm, PaymentSelector, OrderSummary, AdminSidebar, RevenueChart, RecentOrdersTable, ProductsTable, ProductForm, VariantEditor, EAVAttributeForm, PublishSidebar

**File 6 (Checkout) — components đã tạo:**
```
src/app/(storefront)/checkout/
  page.tsx              (Server) — layout grid, renders CheckoutClient
  CheckoutClient.tsx    (Client) — form state, useCart, useCheckout, submit handler
src/components/storefront/checkout/
  CheckoutForm.tsx      (Client) — shipping address form fields
  PaymentSelector.tsx   (Client) — payment method selection (VNPay/MoMo/COD)
  OrderSummary.tsx      (Client) — item list, price breakdown, total
```

**File 7 (Order Success) — components đã tạo:**
```
src/app/(storefront)/order/success/page.tsx    (Server) — searchParams, SVG animation
src/components/storefront/order/
  OrderSuccessActions.tsx  (Client) — 2 CTA buttons, clearCart() on mount
src/lib/store/cart.store.ts     — Zustand store với clearCart()
```

**File 8 (Admin Dashboard) — components đã tạo:**
```
src/app/(admin)/admin/
  layout.tsx    (Server) — sidebar wrapper (ml-64)
  page.tsx      (Server) — KPI cards, RevenueChart, RecentOrdersTable, StockAlertCard, LeadCard
src/components/admin/
  AdminSidebar.tsx    (Client) — collapse/expand, nav groups, active menu highlight, logout
  KPICard.tsx         (Server) — title, value, trend, trendValue, icon
  RevenueChart.tsx    (Client) — Recharts LineChart 30 ngày mock data
  RecentOrdersTable.tsx (Client) — sortable columns, clickable rows
  StockAlertCard.tsx  (Server) — alerts array, critical/urgent styling
  LeadCard.tsx        (Server) — leads array, contact button
src/middleware.ts      — redirect /admin/* → /login nếu không có refresh_token cookie
```

**File 9 (Admin Products List) — components đã tạo:**
```
src/app/(admin)/admin/products/page.tsx   (Server) — page header, breadcrumb, "Thêm SP mới" button
src/components/admin/products/
  ProductsTable.tsx       (Client) — 8 mock products, sort columns, bulk select, floating bar, pagination
  ProductStatusBadge.tsx  (Server) — published→green, draft→gray
  ProductFilterBar.tsx    (Client) — search, category dropdown, status toggle, date
```

**File 10 (Admin Product Form) — components đã tạo:**
```
src/app/(admin)/admin/products/new/page.tsx     (Server) — renders ProductForm
src/app/(admin)/admin/products/[id]/edit/page.tsx (Server) — dynamic route, renders ProductForm
src/components/admin/products/
  ProductForm.tsx       (Client) — 4-tab navigation (basic/variants/EAV/SEO), auto-slug, drop zone
  VariantEditor.tsx    (Client) — inline editable table, add/remove rows
  EAVAttributeForm.tsx (Client) — 6 mock attributes STRING/NUMBER/BOOLEAN/SELECT
  PublishSidebar.tsx   (Client) — publish toggle, save/publish buttons, categories, tags, GACP badge
```

**Giai đoạn tiếp theo: PHASE D — Backend còn lại (2 module)**
- Supplier module: Purchase order, nhà cung cấp
- Shipping module: Tích hợp GHN/GHTK, tracking

**PHASE E — End-to-end testing & VNPay sandbox**
- Test thật VNPay sandbox (open item từ trước)
- E2E test Playwright: luồng mua hàng đầu đến cuối — **CẦN MODEL MẠNH**
- Load test k6: 500 concurrent users trên /products và checkout

**PHASE F — Production readiness**
- ✅ Bước 1: POST /customers/addresses endpoint — **HOÀN TẤT**
  - GET/POST /customers/addresses
  - PATCH /customers/addresses/:id/default
  - DELETE /customers/addresses/:id
- Bước 2: E2E test Playwright cho luồng mua hàng (cần model mạnh trước)
- Bước 3: CI/CD pipeline GitHub Actions (có thể làm song song nếu chưa có model)
- Bước 4: Đổi bitnamilegacy → managed DB (Azure/Supabase)
- Bước 5: Deploy staging

---

## 10. Nợ kỹ thuật đã biết

| # | Nợ | Ưu tiên | Khi xử lý |
|---|---|---|---|
| 1 | bitnamilegacy chỉ dùng local dev | Cao | Trước khi deploy staging |
| 2 | Redis permission cache cho JwtAuthGuard | Trung bình | Sau khi có Redis module |
| 3 | Test thật VNPay sandbox | ✅ Đã xong | VNPay sandbox test PASS |
| 4 | Prisma v6.x pin (chưa lên v7) | Thấp | Khi v7 ổn định hơn |
| 5 | POST /customers/addresses chưa có endpoint | ✅ Đã giải quyết | GET/POST /customers/addresses, PATCH /customers/addresses/:id/default, DELETE /customers/addresses/:id |
| 6 | **Auth rate limiting + bcrypt optimization** — bcrypt cost=10 block event loop ở 50 concurrent → p(95)=6.4s | **Cao** | Trước launch production |
| 7 | **Stock allocation Redis Lua Script** — PostgreSQL serialize concurrent UPDATE cùng variant | **Cao** | Trước launch production |
 
 ---
 
 ## 11. Quyết định đang chờ / Open questions

| Câu hỏi | Trạng thái |
|---|---|
| Phí ship tính theo khu vực hay cân nặng? | ⏳ Chưa quyết định |
| Tích hợp MoMo: sandbox key đã có chưa? | ⏳ Chưa có |
| Domain production sẽ dùng gì? | ⏳ Chưa quyết định |

 ## 12. k6 Load Test — Baseline 18/07/2026

 **Trạng thái: ✅ Hoàn tất baseline**

 | Scenario | Metric | Threshold | Actual p(95) | Trạng thái |
 |---|---|---|---|---|
 | Catalog (đã chạy trước) | p(95) latency | <100ms | 13.4ms | ✅ Production-ready |
 | Checkout stress (add_to_cart) | p(95) latency | <3500ms | 2,797ms | ⚠️ Chấp nhận được local |
 | Auth burst (login) | p(95) latency | <7000ms | 6,390ms | ⚠️ Chấp nhận được local |

 **Bottleneck đã xác định — PHẢI xử lý trước launch production:**

 1. **Auth latency cao** do bcrypt cost=10 block event loop
    - Fix: thêm rate-limit auth endpoint + cân nhắc bcrypt cost=8 (NIST 2024 vẫn chấp nhận cost=8 nếu có rate-limit bảo vệ)
    - Hoặc: chạy bcrypt trong worker_threads để không block event loop

 2. **Stock allocation serialize** tại PostgreSQL
    - Fix long-term: Redis Lua Script reservation trước DB write
    - Fix short-term: giảm thời gian giữ lock (tối ưu transaction)

 **Files liên quan:**
 - `k6/scenarios/02-checkout-stress.js` — add_to_cart stress test, p(95)<3500
 - `k6/scenarios/03-auth-burst.js` — auth burst test, p(95)<7000
 - `k6/README.md` — chi tiết kết quả và phân tích

 ---

 ## 13. QUYẾT ĐỊNH KIẾN TRÚC CUỐI — Auth token storage (2026-07-16)

**Bối cảnh:** Phiên trước auth.store dùng `persist` toàn bộ state → accessToken bị ghi xuống
localStorage. Vi phạm quyết định gốc (in-memory only) vì localStorage có thể bị XSS đọc.

**Quyết định CUỐI: revert về IN-MEMORY, bỏ persist accessToken.**

- `accessToken` (JWT 15m) **chỉ sống trong RAM** (Zustand state), KHÔNG bao giờ xuống localStorage.
- `refreshToken` vẫn nằm trong **httpOnly cookie** (không đọc được bằng JS → an toàn XSS).
- Khi reload app: `AuthBootstrap` (mounted trong `layout.tsx`) gọi `refreshSession()`
  → `POST /auth/refresh` (cookie tự gửi kèm) → nhận accessToken mới. Nếu cookie hết hạn
  → user coi như chưa đăng nhập (clearAuth).
- Chỉ `user` (id/email/fullName — không nhạy cảm) được persist vào localStorage để tránh
  flash UI trắng khi chờ refresh. Dùng `partialize: (state) => ({ user: state.user })`.

**Trade-off đã cân nhắc:**
- IN-MEMORY (chọn): an toàn hơn (refresh token httpOnly chống XSS); reload bắt buộc gọi
  /auth/refresh 1 lần (chi phí nhỏ, cookie tự gửi).
- LOCALSTORAGE (bác bỏ): tiện (không cần refresh call) nhưng accessToken có thể bị XSS đọc
  nếu có lỗ hổng XSS → chiếm quyền user. Rủi ro cao hơn nên KHÔNG dùng trước khi launch.

**File liên quan:** `src/lib/store/auth.store.ts` (persist + partialize), `src/lib/providers/auth-bootstrap.tsx`,
`src/app/layout.tsx` (mount AuthBootstrap), `src/app/(storefront)/login/page.tsx` (setAuth).