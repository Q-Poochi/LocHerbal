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
| | Sales | ✅ Xong + test | 14/14 unit test pass + Cart/Order controllers | Cart + Order controllers created |
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
| Project setup | ✅ Xong | Next.js 16.2.10, build pass 11 routes |
| Tailwind v4 config | ✅ Verified | 13/13 class pass visual test |
| API client (axios) | ✅ Xong | Interceptor JWT + auto-refresh 401 |
| Zustand stores | ✅ Xong | auth.store (persist chỉ `user`, accessToken in-memory + refresh trên reload), cart.store |
| Stitch → React convert | ✅ Xong | Phase B hoàn tất: File 2-4 build pass |
| Trang chủ | ✅ Xong | File 2/10 — build pass |
| Danh sách sản phẩm | ✅ Xong | File 3/10 — build pass, ISR 60s, fallback mock data |
| Chi tiết sản phẩm | ✅ Xong | File 4/10 — build pass, Server/Client split |
| Giỏ hàng | ✅ Xong | File 5/10 — build pass, useCart full URL + auth persist |
| Checkout | ⬜ Chưa bắt đầu | File 6/10 |
| Order success | ⬜ Chưa bắt đầu | File 7/10 |
| Admin Dashboard | ⬜ Chưa bắt đầu | File 8/10 |
| Admin Products | ⬜ Chưa bắt đầu | File 9/10 |
| Admin Product Form | ⬜ Chưa bắt đầu | File 10/10 |
| Gắn API (Phase C) | ✅ Xong | React Query hooks + auth flow + error/loading states |

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
  trang_ch_locherbal/                ← File 2: Trang chủ (ĐANG LÀM)
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

**Trạng thái: ⏳ Chưa thể test — thiếu cấu hình VNPay sandbox trong .env**

Yêu cầu cấu hình (chưa có):
- `VNP_TMN_CODE` — Mã website tại VNPay
- `VNP_HASH_SECRET` — Chuỗi bí mật để tạo checksum
- `VNP_URL` — URL sandbox hoặc production của VNPay

Để test, cần:
1. Đăng ký tài khoản VNPay sandbox tại https://sandbox.vnpayment.vn
2. Thêm các biến vào `.env`:
```env
VNP_TMN_CODE=your_tmn_code
VNP_HASH_SECRET=your_hash_secret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:3000/payment/vnpay-return
```
3. Test flow:
   - `GET /payment/vnpay-url?orderId=<order_id>` → trả về URL VNPay
   - Dùng URL đó trong browser → VNPay sandbox hiển thị form thanh toán
   - Nhập thẻ test (có sẵn trên VNPay sandbox) → redirect về `/payment/vnpay-return`
   - VNPay gửi IPN callback đến `/payment/vnpay-ipn`
   - Check DB: `order.paymentStatus` = PAID, `order.status` = CONFIRMED

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

**Phase B đang thực hiện:** Convert Stitch HTML → React components
- File đã xong: File 2 (trang chủ), File 3 (danh sách SP), File 4 (chi tiết SP)
- Quy tắc bắt buộc: giữ nguyên 100% className, CHƯA gắn API
- Sau mỗi file: `npm run build` phải pass trước khi chuyển file tiếp
- Thứ tự: File 2 ✅ → 3+3b ✅ → 4+4b ✅ → 5 → 6 → 7 → 8 → 9 → 10

**Server/Client split pattern (đã chốt từ File 3):**
- Server Component: ProductGallery, ProductInfo, RelatedProducts, ProductReviews, ProductTabs, FeaturedProducts, HeroBanner, CategoryGrid, Footer
- Client Component (islands): GalleryThumbnails, ProductDetailClient, WriteReviewButton, AddToCartButton, ConsultationForm, Navbar, FilterSidebar, SortBar, ProductGrid
- Nguyên tắc: Component không có state/event handler → Server. Component có state/event handler → Client island nhỏ nhất có thể.

**File 4 (chi tiết SP) — components đã tạo:**
```
src/components/storefront/product/
  ProductDetail.tsx          (Server) — layout chính, breadcrumb, mock data
  ProductGallery.tsx         (Server) — wrapper, delegates to GalleryThumbnails
  GalleryThumbnails.tsx      (Client) — image switching với useState
  ProductInfo.tsx            (Server) — tên SP, giá, rating, trust badges, share
  ProductDetailClient.tsx    (Client) — variant selector, quantity, add-to-cart
  ProductTabs.tsx            (Client) — tab switching (Mô tả/Chi tiết/Hướng dẫn/Đánh giá)
  ProductReviews.tsx         (Server) — rating summary, distribution, review list
  WriteReviewButton.tsx      (Client) — nút "Viết đánh giá"
  RelatedProducts.tsx        (Server) — 4 related product cards
  AddToCartButton.tsx        (Client) — đã tạo từ File 3, tái sử dụng
```

**File 3 — Danh sách sản phẩm (đã xong):**
- `src/app/(storefront)/products/page.tsx` — Server Component, fetch `/api/v1/products` với ISR 60s
- `src/components/storefront/ProductGrid.tsx` — Client Component, nhận `products` prop, fallback mock 12 sản phẩm
- `src/components/storefront/FilterSidebar.tsx` — Client Component, collapsible sections: Danh mục, Khoảng giá, Dạng bào chế, Xuất xứ, Đánh giá
- `src/components/storefront/SortBar.tsx` — Client Component, sort dropdown + view mode toggle
- Typography: `text-headline-md` cho tên SP, `text-body-lg` cho giá, `text-body-sm` cho label/badge

**File 4 — Chi tiết sản phẩm (đã xong):**
- `src/app/(storefront)/products/[slug]/page.tsx` — Server Component, dynamic route
- `src/components/storefront/product/ProductDetail.tsx` — Server Component, layout chính, fetch product by slug
- `src/components/storefront/product/ProductGallery.tsx` — Server Component, wrapper cho gallery
- `src/components/storefront/product/GalleryThumbnails.tsx` — Client Component, image switching với useState, thumbnail row
- `src/components/storefront/product/ProductInfo.tsx` — Server Component, category badge, title, rating, price box, trust badges, share/wishlist
- `src/components/storefront/product/ProductDetailClient.tsx` — Client Component, variant selector, quantity selector, add-to-cart buttons
- `src/components/storefront/product/ProductTabs.tsx` — Client Component, tab switching
- `src/components/storefront/product/ProductReviews.tsx` — Server Component, rating summary + distribution + review list
- `src/components/storefront/product/WriteReviewButton.tsx` — Client Component, write review button
- `src/components/storefront/product/RelatedProducts.tsx` — Server Component, 4 related product cards
- Typography: `text-headline-md` cho headings, `text-body-lg` cho body/price, `text-body-sm` cho labels

**Phase C — API Integration (đã xong):**
- `src/lib/hooks/useProducts.ts` — React Query hooks: useProducts, useProduct, useCart, useCheckout, useAddToCart, useUpdateCartItem, useRemoveFromCart
  - `src/lib/store/auth.store.ts` — `persist` với `partialize` CHỈ lưu `user` (không lưu `accessToken`). `login()` gọi `setAuth(accessToken, user)`. `refreshSession()` gọi `POST /auth/refresh` (cookie tự gửi) → lấy accessToken mới + `GET /auth/me` → user. accessToken chỉ sống trong RAM.
  - `src/lib/providers/auth-bootstrap.tsx` (MỚI) — mounted trong `layout.tsx`, gọi `refreshSession()` một lần khi app khởi động nếu chưa có accessToken. Đây là single source of truth để restore phiên.
  - `src/components/storefront/layout/Navbar.tsx` — subscribe trực tiếp `useAuthStore()`: khi login hiện tên user + dropdown "Đăng xuất"; khi chưa login hiện link "Tài khoản" → /login. Không còn hardcoded `<Link href="/login">` gây redirect sai.
  - `src/app/(storefront)/login/page.tsx` — sau login gọi `setAuth(accessToken, user)` + `console.log('[Login] backend response:', data)`
  - `src/components/storefront/product/GalleryThumbnails.tsx` — `alt={selectedImage.alt ?? 'Product image'}` (fix missing alt)
  - `src/lib/hooks/useProducts.ts` — `useCart()` thêm `console.log('Fetching cart from:', url)` với full URL `${baseUrl}/cart?sessionId=...` (baseUrl = NEXT_PUBLIC_API_URL || localhost:3000)
- `src/components/storefront/ErrorFallback.tsx` — Error boundary fallback UI
- ProductGrid.tsx — loading skeleton, error state, empty state
- ProductDetail.tsx — fetch product by slug server-side, null-safe render

**Bước tiếp theo ngay:**
```
File 5 (giỏ hàng) ✅ Đã xong. Chuyển sang File 6 (checkout) — thanh_to_n_locherbal_desktop/code.html
```

## 10. Nợ kỹ thuật đã biết

| # | Nợ | Ưu tiên | Khi xử lý |
|---|---|---|---|
| 1 | bitnamilegacy chỉ dùng local dev | Cao | Trước khi deploy staging |
| 2 | Redis permission cache cho JwtAuthGuard | Trung bình | Sau khi có Redis module |
| 3 | Test thật VNPay sandbox | Cao | Sau khi Storefront tối thiểu xong |
| 4 | Prisma v6.x pin (chưa lên v7) | Thấp | Khi v7 ổn định hơn |

---

## 11. Quyết định đang chờ / Open questions

| Câu hỏi | Trạng thái |
|---|---|
| Phí ship tính theo khu vực hay cân nặng? | ⏳ Chưa quyết định |
| Tích hợp MoMo: sandbox key đã có chưa? | ⏳ Chưa có |
| Domain production sẽ dùng gì? | ⏳ Chưa quyết định |

## 12. QUYẾT ĐỊNH KIẾN TRÚC CUỐI — Auth token storage (2026-07-16)

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
