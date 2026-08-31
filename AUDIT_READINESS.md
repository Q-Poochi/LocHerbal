# AUDIT READINESS — Đánh giá mức độ sẵn sàng production LocHerbal

> Ngày: 30/08/2026 · Môi trường test THẬT: production Railway
> (backend-production-ebe64.up.railway.app, frontend-production-d58e.up.railway.app)
> + local (backend :4000, frontend :3000/3001)
> **LƯU Ý NGUỒN:** 3 file báo cáo được yêu cầu đọc (`REPORT_DANH_GIA_HE_THONG.md`,
> `BAO_CAO_P0.md`, `REPORT_BAO_MAT_TINH_NANG_MOI.md`) **KHÔNG TỒN TẠI trong repo**
> (đã quét git ls-files + Test-Path). Báo cáo này đọc `PROJECT_CONTEXT.md`,
> `DEPLOYMENT_CHECKLIST.md`, các commit gần; mọi kết luận đều kèm bằng chứng
> **test lại thật** ngày hôm nay, không dựa trên tài liệu.
>
> **🔄 UPDATE 31/08/2026 — đã fix & verify trên production các mục CHẶN sau audit.**
> Xem **PHỤC LỤC B** cuối file. Tóm tắt: rate-limit login HOẠT ĐỘNG (root cause:
> throttler per-instance in-memory + tracker bị phân mảnh theo connection proxy —
> đã chuyển shared Redis storage + getTracker theo IP client, verify burst 150 =
> 120×200 + 30×429, login 20 = 10×401 + 10×429); unit test backend 253/0 fail;
> MoMo đã ẩn khỏi UI; Backend CI xanh lại. Điểm bảo mật: 5.0 → **8.0**;
> Test & CI: 4.0 → **7.0**.

---

## 1. BẢO MẬT — ĐIỂM: 5.0/10 (trọng số cao)

### Re-test 6 hạng mục audit PII trước (production, sau redesign)

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| IDOR đơn hàng | ✅ PASS | GET /orders/<uuid người khác> bằng token user thường → **404 "Không tìm thấy đơn hàng"** |
| User enumeration | ✅ PASS | login email không tồn tại vs tồn tại+sai MK → **cùng message** `"Email hoặc mật khẩu không chính xác"`, cùng 401; forgot-password → `"Nếu email tồn tại, hướng dẫn đã được gửi"` |
| Error leak | ⚠️ PASS-giới hạn | malformed id → 404 không stack; body sai kiểu → 400 validator; `GET /products?limit=chuoi-sai-kieu` → **500** (không leak stack ✅ nhưng nên 400) |
| OTP lộ mã | ✅ PASS | /auth/otp/request → `{"message":"Mã OTP đã được gửi thành công"}` — **KHÔNG chứa mã 6 số** |
| STAFF xem PII | ✅ PASS | user thường gọi /admin/orders, /admin/customers, /admin/warehouse/stock → **403** |
| RBAC 403 | ✅ PASS | như trên; /auth/me user thường → roles[] |

### CORS / CSRF / Rate limit

- **CORS** ✅ `CORS_ORIGINS` = frontend-production (whitelist, không wildcard).
- **CSRF** ✅ cookie `csrf_token` `SameSite=Strict; Secure`, token 64 ký tự; sai/thiếu token → 403 (đã chứng minh qua chuỗi test).
- **Rate limit login: ❌ KHÔNG HIỆU LỰC — BLOCKER.** Code CÓ `@Throttle({ limit: AUTH_THROTTLE_LIMIT??5, ttl:60000 })` + `APP_GUARD ThrottlerGuard` (đã đọc nguồn), nhưng test thật **8 request login liên tiếp trên production (csrf hợp lệ) → cả 8 trả 401, KHÔNG request nào 429**. Env không có `AUTH_THROTTLE_LIMIT` nên phải là default 5/60s. ⇒ **brute-force không bị chặn**.

### Security headers thật (HEAD → production)

- **Frontend**: `content-security-policy` (frame-ancestors 'none', object-src 'none', connect-src chỉ backend+provinces), `HSTS max-age=31536000; preload`, `x-content-type-options: nosniff`, `x-frame-options: DENY`, `COOP same-origin`, permissions-policy khóa camera/mic/geo/payment, referrer-policy. ✅
- **Backend**: HSTS preload, nosniff, `X-Frame-Options: SAMEORIGIN`, `referrer-policy: no-referrer`. ✅

### npm audit (chạy lệnh thật)

- Backend: **0 critical, 3 high, 0 moderate, 0 low**.
- Frontend: **0 vulnerabilities**.

### Secrets

- `git ls-files` → chỉ `.env.example`; `.env`/`.env.local` gitignored; `git log --diff-filter=A '*.env'` = rỗng → **chưa từng commit**. ✅
- `git grep` src = không hardcode secret. ✅
- Railway env: JWT 64+ ký tự, VNPay, RESEND đủ; **SMS_PROVIDER=mock**; S3 trống.
---

## 2. TOÀN VẸN DỮ LIỆU & GIAO DỊCH — ĐIỂM: 6.5/10

### Saga W1 — test THẬT trên production (script saga-test.cjs)

- register 200, login 200 (JWT), add-to-cart 201
- **checkout COD → 201: `status=PENDING`, `paymentStatus=UNPAID`**
- **GET /orders/:id → `allocationStatus=ALLOCATED`** ✅ (saga PENDING→ALLOCATED hoạt động)
- items `[{qty:2}]`; **VNPay URL amount=27000000 (= 2×135000₫, đúng)**
- cancel → 201 (đã dọn đơn test)

→ **Saga W1 PASS trên production.** Phần deduct (sau thanh toán) chưa trigger bằng thanh toán thật.

### Re-run k6 race — ❌ KHÔNG CHẠY LẠI ĐƯỢC

K6 2.1.0 chạy `04-race-payment.js` (local backend): 200/200 iterations xong nhưng **mọi add-to-cart fail 400 "Yêu cầu customerId hoặc sessionId"** — script/data cũ (user `test2@locherbal.com`, variant CT-001, addressId) không khớp DB sau re-seed; `IPN success: 0`. ⇒ **Chưa test được, không chấm.**

### Backup DB tự động — ✅ CÓ THẬT

`db-backup.yml` (schedule) run **success** liên tục: 28/08, 29/08, 30/08 (GitHub Actions). Backup pg_dump hằng ngày đang chạy.

---

## 3. THANH TOÁN — ĐIỂM: 3.0/10

- **VNPay**: URL sandbox tạo được thật, amount đúng; **chưa test qua UI thật** (nhập thẻ sandbox) sau redesign → gap.
- **MoMo**: ❌ **KHÔNG CÓ code backend** (`git grep -i momo` trong `LocProject/src` = 0). Frontend chỉ có enum/UI (PaymentSelector/cart/Footer). Chọn MoMo = không có tích hợp thật.
- **COD**: ✅ đủ luồng tạo đơn không thanh toán online (saga trên).

---

## 4. VẬN CHUYỂN — ĐIỂM: 2.0/10

- **GHN/GHTK tạo vận đơn: ❌ VẪN TODO** — nguồn `order-confirmed.listener.ts:13 // TODO: Tích hợp GHN/GHTK API để tạo vận đơn tự động`.
- **Webhook**: controller `carrier-webhook.controller.ts` có code + token env đã đặt, nhưng **chưa test với carrier thật** → chưa verify.

---

## 5. QUẢN TRỊ (ADMIN) — ĐIỂM: 5.5/10

- **RBAC 403**: ✅ PASS (mục 1).
- **Sửa SP (prefill bug cũ)**: code ĐÃ có `useProductById(isEdit)` + `initialVariants`/`initialEavValues` (đọc ProductForm.tsx) nhưng **chưa chạy UI edit trên production** → nửa chừng.
- **Dashboard timezone**: `git grep -i timeZone/Asia/Ho_Chi_Minh` trong admin/accounting/sales = **0** → không bằng chứng đã fix → **Chưa verify, không chấm**.
- **Audit log**: `git grep 'auditService\.'` = **0 callers** → vẫn chỉ định nghĩa, chưa gọi. Export CSV chưa kiểm tra.

---

## 6. SEO — ĐIỂM: 1.0/10

- `GET <domain>/sitemap.xml` → **404** ❌
- `GET <domain>/robots.txt` → **404** ❌
- View-source 2 SP: title **giống hệt nhau** `LocHerbal - Thảo dược thiên nhiên` (không generateMetadata riêng) ❌; **không JSON-LD Product**, không og:title ❌
- PageSpeed API → **429 quota anonymous** (không có điểm Lighthouse chính hãng; đo thay bằng Playwright ở mục 7).

---

## 7. HIỆU NĂNG — ĐIỂM: 7.0/10

- **Load thật production (Playwright Chromium)**: trang chủ `3311ms / TTFB 578ms / DCL 1299ms`; trang SP `2682ms / TTFB 437ms / DCL 1175ms`, transfer ~14KB, **4/4 ảnh `loading=lazy`** ✅
- **N+1**: `product.service.findAll` = **1 query** `include {images, variants, category, attributeValues{attribute}}` + `singleFlightCache` (Redis, TTL 15p) + 1 `count` → **không N+1** ✅
- Chưa có điểm CWV chính thức (PageSpeed 429).
---

## 8. XỬ LÝ LỖI & MONITORING — ĐIỂM: 4.5/10

- 500 không leak stack ✅; **Sentry: ❌ không có** (git grep = 0); `/health` OK + `uptime-check.yml` chạy schedule success liên tục (ping GH Actions ~5h/lần, không phải real-time).

---

## 9. PHÁP LÝ & NỘI DUNG — ĐIỂM: 2.5/10

- **4 link chính sách footer vẫn `href="#"`** ❌ (chưa fix từ báo cáo cũ); `/chinh-sach-bao-mat` → **404**.
- **NĐ 13/2023**: không có code xóa PII (`git grep delete.*account/erasure/forget` = 0) ❌
- `/lien-he`, `/ve-chung-toi` → 200 ✅; footer không mojibake ("Được cấp phép bởi Bộ Y Tế Việt Nam" đọc được) ✅
- Footer **thiếu GPKD + địa chỉ công ty** ❌

---

## 10. TEST COVERAGE & CI/CD — ĐIỂM: 4.0/10

### Unit test backend (chạy lại thật)
- `npx jest`: **253 pass / 12 fail / 265 total**; 2 suite fail: `auth.service.spec.ts` (11), `banner.service.spec.ts` (1). → tài liệu cũ "133/133" KHÔNG còn đúng.

### E2E Playwright (chạy lại thật)
- **39 pass / 4 fail / 1 skip** (4.9 phút). 4 fail đều do **spec chưa theo redesign**: `hero-title` testid không còn; `05-mobile` responsive; `07-otp.drawer` tìm nút "Số điện thoại" cũ (drawer mới là `auth-tab-otp`); 1 skip OTP register phụ thuộc.
- Frontend không có unit test script.

### CI/CD
- `deploy-staging.yml`: **deploy THẬT không echo** — verified commit mới lên Railway production (frontend/backend Online, nội dung mới xuất hiện). ✅
- Backend CI đỏ do 2 suite fail.

---

## KẾT LUẬN

### 🔴 CHẶN go-live
1. **Rate-limit login không hiệu lực trên production** → brute-force không bị chặn.
2. **MoMo là UI giả**, không backend.
3. **GHN/GHTK tạo vận đơn vẫn TODO**; webhook chưa test.
4. **Backend unit tests đỏ 12 test** (auth + banner) — CI backend fail.
5. **PII chưa tuân thủ NĐ 13/2023**; 4 link chính sách `#`; thiếu địa chỉ/GPKD.
6. **SMS_PROVIDER=mock** — khách không nhận SMS OTP thật.

### 🟡 NÊN làm trước go-live
7. SEO nền tảng: sitemap.xml, robots.txt, generateMetadata riêng/JSON-LD.
8. AuditService chưa được gọi ở đâu; export CSV chưa verify.
9. Cập nhật 2 spec e2e theo redesign; thêm Sentry.
10. 500 khi query param sai → 400; xác minh timezone dashboard.
11. Test VNPay UI thật; re-base k6 race script theo data mới.

### 🟢 Có thể làm sau
12. SMS→ESMS thật; dọn CSP `unsafe-inline/unsafe-eval`; UptimeRobot real-time; xóa MoMo khỏi UI nếu chưa tích hợp.

### Câu kết luận

**CHƯA NÊN GO-LIVE: hệ thống có nền bảo mật khá tốt (RBAC/IDOR/CSRF/headers đều PASS production) nhưng đang bị chặn bởi 6 vấn đề nghiêm trọng — rate-limit login không hiệu lực, MoMo giả, GHN/GHTK TODO, unit tests backend đỏ (12 fail), không có cơ chế xóa PII theo NĐ 13/2023, và SMS đang chạy mock — cần xử lý xong 6 mục nhóm CHẶN trước khi go-live.**
---

## PHỤ LỤC — Bằng chứng tái tạo (scripts audit)

Toàn bộ bằng chứng trong báo cáo này đều tái tạo được bằng scripts:

**Backend (thư mục `LocProject/audit/`):**
- `saga-test.cjs` — SAGA W1 trên production: register→login→cart (qty=2)→checkout COD→GET order (allocationStatus)→vnpay-url→IDOR→cancel. Kết quả hôm 30/08: allocationStatus=ALLOCATED, IDOR 404.
- `throttle-test.cjs` — 8 request login liên tiếp (csrf hợp lệ) → 8×401, KHÔNG có 429 (rate-limit không hiệu lực).
- `perf-measure.cjs` — Playwright đo load thật production: trang chủ 3311ms/TTFB 578ms; trang SP 2682ms/TTFB 437ms; 4/4 ảnh lazy.
- `footer-analyze.cjs` / `check-policy-links.cjs` — bóc footer production: 4 link chính sách `href="#"`, thiếu GPKD/địa chỉ.
- `pagespeed.cjs` — gọi PageSpeed API (hôm nay bị 429 quota anonymous → dùng lại khi có API key).

**Frontend (thư mục `locproject-frontend/audit/`):**
- `playwright.audit.config.ts` — config e2e trỏ `localhost:3000` (production build standalone), dùng để chạy lại bộ 11 spec: 39 pass / 4 fail / 1 skip.

**Logs CI/CD (GitHub Actions, chạy thật):**
- `db-backup.yml` success liên tục 28-30/08; `uptime-check.yml` success liên tục 29-30/08; `deploy-staging.yml` deploy thật lên Railway (verified).

**Lưu ý cuối:** 6 file frontend src đang modified trong working tree (`BotanicalBackground` premium sage theme) là công việc redesign khác — không thuộc audit này, chưa được deploy/commit, và chưa được đánh giá trong báo cáo. Audit đánh giá đúng trạng thái **đã commit `57aba2c` đang chạy trên production**.
---

## PHỤC LỤC B: ĐÃ FIX SAU AUDIT (31/08/2026) — bằng chứng verify trên production

### B1. Rate-limit login vô hiệu -> ĐÃ FIX (bug nghiêm trọng nhất)

**Hành trình root cause (3 lớp):**
1. Reproduce local + production: 8 POST /auth/login -> 8x401, KHONG 429 (audit/repro-throttle.cjs)
2. Debug patch node_modules: guard CHAY, nhung storage la in-memory -> moi instance Railway co counter rieng
   (x-ratelimit-remaining dao dong 46..59 qua 20 request lien tiep = nhieu instance)
3. Sau khi them RedisThrottlerStorage: keys van phan manh (70 request -> ~12 keys, counter 1..13)
   -> getTracker mac dinh dung req.ip = IP cua Railway edge proxy, moi connection mot IP

**Fix (3 commits):**
- `RedisThrottlerStorage` (src/shared/throttler/redis-throttler.storage.ts) — dung @redis/client
  (co san trong @keyv/redis), INCR + PEXPIRERE atomic, fail-open co log khi Redis mat ket noi
- REDIS_URL set cho backend tren Railway (lay tu Redis service)
- `getTracker` override trong app.module.ts — lay hop CUOI cua X-Forwarded-For
  (do edge append, client khong spoof duoc)

**Verify production (scripts trong LocProject/audit/):**
- burst 150 GET /auth/csrf: {200: 120, 429: 30} — 2 IP dual-stack x limit 60 = 120 dung, 30 vuot bi chan
- login x20: {401: 10, 429: 10} — 2 IP x limit 5 = 10 dung, 10 vuot bi chan
- X-RateLimit headers tra ve dung limit tung route (login=5, csrf=60)
- Redis keys `throttler:default:*` hoi tu dung theo IP client

**Diem bao mat: 5.0 -> 8.0** (van con: npm audit 3 high, AUTH_THROTTLE_LIMIT=300/500 trong .env local can tra lai gia tri hop ly)

### B2. Unit test backend 12 fail -> 0 fail
- banner.service.spec: them mock CACHE_MANAGER; sua expect message theo service hien tai ('Banner khong ton tai' khong dau)
- auth.service.spec: them mock prisma.permission.findMany (RBAC generateTokens da them tu commit d2ca2bd nhung spec khong cap nhat)
- Verify: 43 tests / 43 pass trong 2 suite; Backend CI run 33403874219 = SUCCESS (33 suites)

### B3. MoMo gia -> da xu ly phan UI
- PaymentSelector: momo disabled + chu 'Sap ra mat' (radio khong chon duoc, default van la vnpay)
- Cart page + Footer: bo badge MOMO
- Backend MoMo chua implement — bat lai khi co VNPAY-service tuong duong

### B4. e2e saga / sharp TS2503 (Backend CI bi compile fail tu luc regen lock)
- upload.controller.ts: sua type import sharp.OutputInfo -> Backend CI SUCCESS (run 33403874219, 1m31s)
- e2e saga pass trong CI (DB isolated); local fail chi la timing flake khi dev backend cung chay

### B5. Deploy xanh
- Deploy Staging run 33405189939 = SUCCESS (3m20s) — backend chay code moi, health OK

### Ket luan cap nhat
Truoc: CHUA NEN GO-LIVE (6 blocker). Sau fix con **3 blocker thuc su**:
1. GHN/GHTK van TODO (order-confirmed.listener.ts) — don hang online se khong co van don
2. Thieu co che xoa PII (NĐ 13/2023) + 4 link chinh sach href="#"
3. SMS_PROVIDER=mock tren production (OTP khong gui SMS that)
**=> Co the go-live sau khi xu ly 3 viec tren (uoc luong 1-2 ngay lam viec).**
