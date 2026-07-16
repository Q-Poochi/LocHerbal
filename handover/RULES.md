# RULES.md — Quy tắc bất biến của dự án LocHerbal

> Những quy tắc này đã được thiết lập và duyệt qua nhiều phiên làm việc.
> Agent KHÔNG được tự ý thay đổi bất kỳ quyết định nào dưới đây.
> Nếu cần thay đổi → đề xuất + giải thích lý do → chờ chủ dự án duyệt.

---

## NHÓM 1 — Kiến trúc (KHÔNG thay đổi)

### Backend
- Kiến trúc: **Modular Monolith** (NestJS), 8 module độc lập
- Giao tiếp giữa module: **Domain Event duy nhất** (`@nestjs/event-emitter`)
- **CẤM** import trực tiếp Service của module khác
- ORM: **Prisma 6.19.3** (pin cứng, không nâng lên v7)
- Connection: App → PgBouncer (6432) | Migration → Direct Postgres (5434)
- `directUrl` trong schema.prisma bắt buộc phải có

### Frontend
- Framework: **Next.js 16 App Router** (không Pages Router)
- Route groups: `(storefront)` và `(admin)` — dấu ngoặc tròn không tạo URL segment
- State: **Zustand in-memory** — KHÔNG dùng persist, KHÔNG localStorage
- Data fetching: **React Query** (Client) + **React Server Components** (Server)
- Styling: **Tailwind v4** với `@theme inline` trong globals.css

### Database
- Primary key: **UUID** cho mọi entity nghiệp vụ
- Naming: **snake_case** tên bảng/cột
- Mọi thay đổi schema: tạo migration → chạy thử → dán output → mới merge
- Migration: `prisma migrate dev --name <tên>` cho dev, `migrate deploy` cho production
- Không bao giờ chạy migration qua PgBouncer

---

## NHÓM 2 — Bảo mật (KHÔNG vi phạm)

- JWT access token: **in-memory chỉ**, expire 15 phút
- Refresh token: **httpOnly cookie**, expire 7 ngày, **Rotation bắt buộc**
- Refresh token lưu DB: **bcrypt hash**, không raw token
- Replay attack: phát hiện → revoke toàn bộ session của user đó
- Secrets: KHÔNG hardcode, KHÔNG fallback string (không `|| 'secret'`)
- Fail-fast: app crash ngay khi thiếu `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`
- Mọi endpoint trừ public: phải có `JwtAuthGuard`
- VNPay IPN: `@Public()` + verify SecureHash trước khi xử lý
- `amount` thanh toán: lấy từ DB (order.totalAmount), không từ client request

---

## NHÓM 3 — Tồn kho (logic nghiệp vụ đặc biệt)

- Tồn kho thực tế: `qty_on_hand`
- Tồn kho đã giữ: `qty_reserved`
- Tồn kho có thể bán: `qty_on_hand - qty_reserved`
- `allocate()`: UPDATE atomic trong DB transaction, check `affectedRows === 0`
- `deduct()`: KHÔNG dùng `GREATEST(0,...)` — phải check điều kiện, throw nếu âm
- `release()`: dùng `GREATEST(0,...)` được — là thao tác hoàn lại
- Mọi thay đổi tồn kho: bắt buộc ghi `StockMovement` cùng transaction

---

## NHÓM 4 — UI/Frontend (thiết kế đã chốt)

- Design đến từ Stitch export (folder `stitch-export/`)
- **KHÔNG tự thay đổi class Tailwind** trong component đã convert từ Stitch
- **KHÔNG tự thêm animation/transition** mới không có trong Stitch
- Convert Stitch HTML → React: giữ nguyên 100% className
- Gắn API sau khi UI convert xong và build pass — không làm song song

---

## NHÓM 5 — Quy trình làm việc

### Trước khi code
1. Đọc `PROJECT_CONTEXT.md` để biết trạng thái thật
2. Kiểm tra entity/endpoint đã tồn tại chưa (grep, đọc file thật)
3. Không tự đoán file/function đã có hay chưa

### Khi code
- Không dùng `any` trong TypeScript
- Không hardcode giá trị nghiệp vụ (phí ship, % hoa hồng, ngưỡng tồn kho)
- Comment giải thích "tại sao", không lặp lại "làm gì"
- Method không quá 40 dòng logic

### Sau khi code
- Chạy `npm run build` (frontend) hoặc `npm run lint && npm run typecheck` (backend)
- Dán output thật vào báo cáo
- Cập nhật `PROJECT_CONTEXT.md` trước khi kết thúc phiên

### Test
- Sales/Accounting/Warehouse: coverage ≥ 80%
- Không báo "đã xong" nếu chưa chạy test và thấy pass
- Không viết test rỗng `expect(true).toBe(true)`

---

## NHÓM 6 — Repo tham khảo (để chống hallucination)

Khi thiết kế domain model mới, PHẢI tham khảo repo này trước:
- **Order/Inventory/Promotion**: `vendure-ecommerce/vendure`
- **Storefront Next.js**: `vercel/commerce`
- **Project boilerplate**: `ixartz/Next-js-Boilerplate`

Khi dùng tham khảo: nêu rõ "Tham khảo pattern X từ repo Y, file Z"
Không trình bày code tự nghĩ như thể đó là pattern đã kiểm chứng.

---

## NHÓM 7 — Nợ kỹ thuật đã biết (không quên)

1. `bitnamilegacy` images: CHỈ dùng local dev, KHÔNG lên staging/production
2. Redis permission cache cho `JwtAuthGuard`: chưa implement
3. VNPay sandbox: chưa test giao dịch thật (cần Storefront tối thiểu xong trước)
4. Compensating saga (`order-created.listener.ts`): dùng `error.message.includes()`
   để tìm `failedItemIndex` — fragile, cần refactor sang `InsufficientStockException`
5. Prisma v6.x pin: không nâng lên v7 cho đến khi có lý do cụ thể
