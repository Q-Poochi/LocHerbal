# BÁO CÁO TRIỂN KHAI BẢO MẬT & TÍNH NĂNG MỚI

**Ngày:** 30/07/2026  
**Dự án:** LocHerbal  
**Backend:** NestJS + Prisma + PostgreSQL  
**Frontend:** Next.js 16 App Router + Tailwind v4  

---

## I. BẢO MẬT (SECURITY)

### 1. Helmet Middleware
- **Mô tả:** Sử dụng `helmet` để thiết lập các HTTP header bảo mật (X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, v.v.)
- **Cấu hình:** `crossOriginResourcePolicy: { policy: 'cross-origin' }` — cho phép tải ảnh từ các origin khác (cần cho upload)
- **File thay đổi:** `LocProject/src/main.ts`

### 2. Rate Limit cho Refresh Token
- **Mô tả:** Giới hạn `POST /auth/refresh` tối đa **5 request/phút** để chống brute-force refresh token
- **File thay đổi:** `LocProject/src/modules/core/controllers/auth.controller.ts`
- **Decorator:** `@Throttle({ default: { limit: 5, ttl: 60000 } })`

### 3. CSRF Protection (Double-Submit Cookie Pattern)
- **Mô tả:** 
  - Middleware tạo cookie `csrf_token` (random 32-byte hex) cho mọi request nếu chưa có
  - Với các method không an toàn (POST, PUT, PATCH, DELETE): so sánh `csrf_token` trong cookie với header `X-CSRF-Token`
  - Không khớp → trả về `403 CSRF token không hợp lệ`
- **Cookie config:** `httpOnly: false` (JS đọc được để gửi header), `sameSite: strict`, `secure: true` ở production
- **File thay đổi:** `LocProject/src/main.ts`

---

## II. TÍNH NĂNG MỚI (NEW FEATURES)

### 4. Audit Log Service
- **Mô tả:** Service ghi lại mọi thay đổi dữ liệu quan trọng vào bảng `audit_logs`:
  - `userId` - người thực hiện
  - `action` - hành động (CREATE, UPDATE, DELETE)
  - `entityType` + `entityId` - đối tượng bị thay đổi
  - `oldValue` + `newValue` - giá trị cũ/mới (dạng JSON)
- **Endpoint:** Không có API riêng, sử dụng qua DI trong các service khác
- **File tạo mới:** `LocProject/src/shared/services/audit.service.ts`

### 5. Wishlist (Danh sách yêu thích)
- **Mô tả:** Cho phép khách hàng lưu sản phẩm yêu thích
- **Model Prisma:**
  - `Wishlist` (1-1 với Customer)
  - `WishlistItem` (n-n với ProductVariant)
- **API Endpoints** (yêu cầu JWT):
  | Method | Endpoint | Mô tả |
  |--------|----------|-------|
  | GET | `/wishlist` | Lấy danh sách yêu thích (kèm thông tin variant + product) |
  | POST | `/wishlist` | Thêm variant vào wishlist (`body: { productVariantId }`) |
  | DELETE | `/wishlist/:productVariantId` | Xoá khỏi wishlist |
- **File tạo mới:**
  - `LocProject/src/modules/sales/controllers/wishlist.controller.ts`
  - `LocProject/src/modules/sales/services/wishlist.service.ts`

### 6. Product Reviews (Đánh giá sản phẩm)
- **Mô tả:** Cho phép khách hàng đánh giá sản phẩm (rating 1-5 + comment)
- **Model Prisma:** `ProductReview` (unique constraint trên `[productId, customerId]`)
- **API Endpoints**:
  | Method | Endpoint | Auth | Mô tả |
  |--------|----------|------|-------|
  | POST | `/reviews/:productId` | JWT | Tạo đánh giá (`body: { rating, comment? }`) |
  | GET | `/reviews/:productId` | Public | Lấy danh sách đánh giá theo product (phân trang) |
  | PATCH | `/reviews/:id` | JWT | Cập nhật đánh giá |
  | DELETE | `/reviews/:id` | JWT | Xoá đánh giá |
- **File tạo mới:**
  - `LocProject/src/modules/catalog/controllers/review.controller.ts`
  - `LocProject/src/modules/catalog/services/review.service.ts`

### 7. Admin Dashboard Stats (Thống kê Dashboard)
- **Mô tả:** API cung cấp số liệu thống kê cho admin
- **API Endpoints** (yêu cầu JWT + role admin/staff):
  | Method | Endpoint | Mô tả |
  |--------|----------|-------|
  | GET | `/admin/dashboard/stats` | Tổng quan: doanh thu (hôm nay + tổng), đơn hàng (hôm nay + tổng), tổng KH, tổng SP, số SP tồn thấp, 10 đơn gần nhất |
  | GET | `/admin/dashboard/revenue-by-day?days=30` | Doanh thu theo ngày (mảng `{ date, revenue }`) |
  | GET | `/admin/dashboard/top-products?limit=10` | Top sản phẩm bán chạy theo số lượng |
- **File tạo mới:**
  - `LocProject/src/modules/admin/admin.module.ts`
  - `LocProject/src/modules/admin/controllers/dashboard.controller.ts`
  - `LocProject/src/modules/admin/services/dashboard.service.ts`

### 8. Export CSV Orders (Xuất đơn hàng CSV)
- **Mô tả:** Cho phép admin/staff xuất danh sách đơn hàng ra file CSV (UTF-8 BOM)
- **API Endpoint:**
  | Method | Endpoint | Auth | Mô tả |
  |--------|----------|------|-------|
  | GET | `/orders/export/csv?from=YYYY-MM-DD&to=YYYY-MM-DD` | JWT + admin/staff | Download CSV |
- **Cột CSV:** Mã ĐH, Khách hàng, SĐT, Email, Tổng tiền, Trạng thái, Thanh toán, Ngày tạo
- **File thay đổi:** `LocProject/src/modules/sales/controllers/order.controller.ts`

---

## III. THAY ĐỔI CƠ SỞ DỮ LIỆU (PRISMA MIGRATION)

### Migration: `20260730140339_add_wishlist_review`
- **Bảng mới:**
  - `product_reviews` — product_id, customer_id, rating (1-5), comment, created_at
  - `wishlists` — customer_id (unique)
  - `wishlist_items` — wishlist_id, product_variant_id (unique theo wishlist)
- **Quan hệ mới trên bảng hiện có:**
  - `Product` → `reviews: ProductReview[]`
  - `Customer` → `reviews: ProductReview[]`, `wishlist: Wishlist?`
  - `ProductVariant` → `wishlistItems: WishlistItem[]`

---

## IV. KIỂM TRA (TEST RESULTS)

| Loại kiểm tra | Kết quả | Chi tiết |
|---------------|---------|----------|
| Unit tests | ✅ 120/120 pass | 14 test suites, không có lỗi |
| Build (NestJS) | ✅ Clean | `npm run build` thành công, không lỗi TypeScript |

---

## V. DANH SÁCH FILE ĐÃ THAY ĐỔI/TẠO

### File đã thay đổi:
| File | Thay đổi |
|------|----------|
| `LocProject/schema.prisma` | Thêm model ProductReview, Wishlist, WishlistItem + quan hệ ngược |
| `LocProject/src/main.ts` | Thêm helmet, CSRF middleware |
| `LocProject/src/app.module.ts` | Thêm AdminModule, AuditService providers |
| `LocProject/src/modules/core/controllers/auth.controller.ts` | Thêm @Throttle cho refresh |
| `LocProject/src/modules/catalog/catalog.module.ts` | Thêm ReviewController, ReviewService |
| `LocProject/src/modules/sales/sales.module.ts` | Thêm WishlistController, WishlistService |
| `LocProject/src/modules/sales/controllers/order.controller.ts` | Thêm GET /orders/export/csv |

### File tạo mới:
| File | Mục đích |
|------|----------|
| `LocProject/src/shared/services/audit.service.ts` | Audit log service (ghi lại mọi thay đổi) |
| `LocProject/src/modules/catalog/services/review.service.ts` | Business logic đánh giá sản phẩm |
| `LocProject/src/modules/catalog/controllers/review.controller.ts` | API endpoints cho đánh giá |
| `LocProject/src/modules/sales/services/wishlist.service.ts` | Business logic wishlist |
| `LocProject/src/modules/sales/controllers/wishlist.controller.ts` | API endpoints cho wishlist |
| `LocProject/src/modules/admin/admin.module.ts` | Module admin |
| `LocProject/src/modules/admin/services/dashboard.service.ts` | Thống kê dashboard |
| `LocProject/src/modules/admin/controllers/dashboard.controller.ts` | API endpoints dashboard |

### Migration:
| File | Mục đích |
|------|----------|
| `LocProject/prisma/migrations/20260730140339_add_wishlist_review/` | Migration thêm bảng product_reviews, wishlists, wishlist_items |

---

## VI. HƯỚNG DẪN SỬ DỤNG

### Frontend Wishlist:
```typescript
// Lấy danh sách
const res = await apiClient.get('/wishlist');

// Thêm sản phẩm
await apiClient.post('/wishlist', { productVariantId: '...' });

// Xoá
await apiClient.delete(`/wishlist/${productVariantId}`);
```

### Frontend Reviews:
```typescript
// Tạo đánh giá
await apiClient.post(`/reviews/${productId}`, { rating: 5, comment: 'Tốt' });

// Xem đánh giá (public)
const res = await apiClient.get(`/reviews/${productId}?page=1&limit=10`);
```

### Frontend Dashboard (admin):
```typescript
const stats = await apiClient.get('/admin/dashboard/stats');
const revenue = await apiClient.get('/admin/dashboard/revenue-by-day?days=30');
const topProducts = await apiClient.get('/admin/dashboard/top-products?limit=10');
```

### Export CSV (admin):
```typescript
// Mở tab mới để download
window.open('/api/orders/export/csv?from=2026-01-01&to=2026-12-31');
```

### CSRF Token (frontend):
```typescript
// Tự động gửi X-CSRF-Token header với mọi request không an toàn
import Cookies from 'js-cookie';

apiClient.interceptors.request.use(config => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(config.method!.toUpperCase())) {
    const csrfToken = Cookies.get('csrf_token');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }
  return config;
});
```
