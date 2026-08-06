# BÁO CÁO TIẾN ĐỘ — PHASE P0

Dự án: **LocHerbal** · Ngày: 04/08/2026
Phạm vi: 3 task P0 (Admin orders search/filter, nối widget dashboard, E2E Playwright)

---

## TỔNG QUAN

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| P0-1 | Search + lọc ngày **admin orders** | ✅ HOÀN TẤT | backend + frontend + test + verify |
| P0-2 | Nối **StockAlertCard / LeadCard** dashboard | ✅ HOÀN TẤT | dữ liệu thật + empty state |
| P0-3 | **E2E Playwright** (admin + luồng mua COD) | 🔶 ĐANG HOÀN THIỆN | 06-admin 6/6 pass; 07-purchase pass riêng; test cũ 01-05 stale |

- Backend test: **136/136 PASS (18 suites)**
- `tsc --noEmit` + `nest build` backend: **PASS**
- Frontend build + `eslint`: **0 lỗi** (trước khi sửa spec purchase)

---

## P0-1 — SEARCH + LỌC NGÀY ADMIN ORDERS

### Backend
- `order.service.ts findAllForAdmin(page, limit, status?, search?, from?, to?)`:
  - `where: Prisma.OrderWhereInput` (theo RULES cấm `any`)
  - Search theo `orderCode` / customer `fullName` / `phone` / `email` (case-insensitive, OR)
  - `from` (đầu ngày) / `to` (HẾT ngày `23:59:59.999` — fix bug trả 0 đơn vì chỉ phủ 00:00 UTC)
- `order.dto.ts`: thêm `AdminOrderQueryDto extends PaginationDto` (`status`, `search`, `from`, `to`)
  - Bắt buộc vì ValidationPipe toàn cục bật `forbidNonWhitelisted: true` → param lạ bị 400
- `admin-order.controller.ts`: dùng DTO query, bỏ `ParseEnumPipe`
- **Lỗi gặp phải**: lúc đầu dùng `where: any` → vi phạm RULES; dùng `@Query('search')` riêng → 400 do DTO whitelist. Đã sửa cả hai.

### Frontend
- `admin/orders/page.tsx`: ô search (Enter), 2 input date `from`/`to`, nút "Xóa bộ lọc" (reset triệt để)

### Test & Verify
- `order.service.spec.ts`: search OR + date end-of-day
- `admin-order.controller.spec.ts`: assert 6 args
- Verify HTTP thật + UI: **1.425 đơn hàng**; search "Khách Test" → đơn Khách Test; date 08-01..08-04 → 2 đơn

---

## P0-2 — NỐI STOCKALERTCARD / LEADCARD DASHBOARD

### StockAlertCard (dữ liệu THẬT)
- `admin/page.tsx`: fetch `GET /admin/warehouse/stock?limit=100`, filter `isLowStock`,
  map → `StockAlert` (critical = `available <= 1`), sort tăng dần
- `StockAlertCard.tsx`: export interface `StockAlert`, thêm empty state, ẩn badge
  "Cần nhập gấp" khi `criticalCount = 0`
- Verify UI: **"Ngủ Ngon Định Tâm | Còn 2 sản phẩm (Ngưỡng: 10)"** hiển thị thật

### LeadCard (không có nguồn backend)
- Schema Prisma **không có** model `ConsultationLead` → không có API
- `LeadCard.tsx`: empty state "Tính năng tư vấn chưa được bật. Hãy liên hệ quản trị hệ thống."

---

## P0-3 — E2E PLAYWRIGHT

### Việc đã làm
- `playwright.config.ts`: `webServer` → `npx next start -p 3001` (production build)
- `e2e/admin.setup.ts`: mới (auth admin)
- `e2e/auth.setup.ts`: sửa strict-mode (`.first()`) + assert toast `/Chào mừng trở lại/`
- `e2e/06-admin.spec.ts`: **6 test** (dashboard/orders/search/date/customers/warehouse) — **6/6 PASS**
- `e2e/07-purchase-flow.spec.ts`: tạo rồi viết lại (COD mua hàng từ đầu)

### Throttle configurable bằng env (fix 429)
Nguyên nhân: refresh-token rotation + throttler 60 req/phút gây 429 chặn test.
- `app.module.ts`: `THROTTLE_LIMIT` (global, mặc định 60)
- `auth.controller.ts`: `AUTH_THROTTLE_LIMIT` (register/login/refresh)
- Backend production chạy với `THROTTLE_LIMIT=10000, AUTH_THROTTLE_LIMIT=10000`

### Những ràng buộc quan trọng phát hiện (ảnh hưởng cách viết e2e)
1. **Refresh-token rotation**: mỗi `POST /auth/refresh` làm token cũ mất hiệu lực →
   **KHÔNG dùng storageState tĩnh dùng chung**; login mới trong `beforeEach`.
2. **Access token chỉ sống in-memory** (không persist localStorage; zustand chỉ lưu user) →
   **full-page reload mất token** → `/cart` fetch as guest (sessionId) → giỏ rỗng.
   → **Bắt buộc SPA navigation** (click link) giữa các bước.
3. **Desktop navbar click giỏ hàng mở DRAWER** (không navigate `/cart`):
   `Navbar.tsx` `onClick` desktop gọi `openDrawer()` → nút "Thanh toán" trong drawer
   dùng `router.push('/checkout')` → đây là điểm vào checkout.

### Kết quả test
- `07-purchase-flow` chạy riêng: **PASS** (sau khi: dùng SPA nav, click link `a[href="/cart"]:visible`,
  chờ `refreshSession`, click "Thanh toán" trong drawer, assert heading thay vì `getByText` do strict-mode)
- Full suite gần nhất: **28 pass / 9 fail**
  - 06-admin + purchase pass
  - Test cũ **01/03/04/05 fail do selector STALE với UI mới** (commit `a0cf1e6 change UI/UX`):
    + Navbar "Danh mục" là **button dropdown**, không còn link
    + "Test User" hiện ở 3 chỗ (header + sidebar + toast) → strict-mode violation
    + `mobile-menu-trigger` trạng thái hidden
    + Cart page không còn link "tiến hành thanh toán"

### Vấn đề hiện tại (chưa hoàn tất P0-3)
- Backend `:4000` và frontend `:3001` hiện **đã tắt** → setup login `waitForURL('/')` timeout
  (không redirect). Cần khởi động lại backend (kèm env throttle) + frontend production rồi chạy lại suite.

---

## GHI CHÚ VẬN HÀNH
- Backend production phải chạy với `THROTTLE_LIMIT` & `AUTH_THROTTLE_LIMIT` cao khi test e2e.
- `next start` yêu cầu build trước; Playwright config dùng `reuseExistingServer: true`
  (dùng server manual p3001 nếu đang chạy).
- Test accounts: admin `rbac-admin-test@locherbal.local` / `Test1234!`; customer `test2@locherbal.com` / `Test@123456`.

---

## VIỆC CÒN LẠI
- [ ] Khởi động lại backend + frontend → chạy lại `npx playwright test` full suite
- [ ] Cập nhật selector các test cũ 01/03/04/05 cho khớp UI mới (hoặc theo quyết định)
- [ ] Dọn script debug rác `debug-admin-state.cjs`, `debug-cart.cjs`
- [ ] Chạy lại đầy đủ backend jest + tsc, frontend build + lint
- [ ] Cập nhật `NHAT_KY_TIEN_DO.txt` + `PROJECT_CONTEXT.md`