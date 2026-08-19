# BÁO CÁO STEP 3 — Trang Tài Khoản (Account)

## 1. Tóm tắt

Redesign + polish trang `/account` theo ui-craft, sửa bug refresh-token race khiến trang redirect về `/login`, và hoàn tất chuỗi fix accessibility (A11y). Kết quả Lighthouse đo trên **production** (đã đăng nhập user `test2@locherbal.com`):

| Chỉ số | Baseline (sai, đo nhầm login) | Sau STEP 3 (production thật) |
|---|---|---|
| Performance | 46 | 47–49 (simulate) / 59 (desktop) / 67 (3G thật) |
| Accessibility | 92 | **100** |
| LCP | — | 2.6–4.2s thật (xem §6a) |
| CLS | — | 0.010–0.013 |

> Lưu ý: baseline `46/92` trong `LIGHTHOUSE_BASELINE.md` thực chất đo trang **login** (`finalUrl=/login?redirect=/account`) do bug race refresh token. Số liệu account thật chỉ đo được sau khi fix bug.

## 2. Bug chính đã sửa — refresh-token race (redirect vô cực về /login)

- **Nguyên nhân**: account page warm-up gọi đồng thời `/orders` + `/customers/addresses` song song với auth-bootstrap `POST /auth/refresh`; cả 2 request 401 → cùng gọi refresh với **cùng một refresh_token** → token rotation race → 1 request fail → client bị đăng xuất → redirect login.
- **Fix**:
  - `src/lib/api/client.ts`: single-flight refresh — export `refreshAccessToken`, dùng chung `refreshPromise` để mọi request chờ 1 lần refresh duy nhất.
  - `src/lib/store/auth.store.ts`: `refreshSession` dùng chung `refreshAccessToken`.
  - `src/app/(storefront)/account/page.tsx`: warm-up chỉ chạy khi `accessToken` đã có.
- **Kết quả**: `/account` load trực tiếp (URL cuối = `/account`, không redirect), tất cả API 200.

## 3. Polish theo ui-craft

- Mini-stat (Đơn hàng / Địa chỉ) + tổng tiền đơn hàng: `tabular-nums` (số không nhảy chiều rộng).
- Toàn bộ hover `opacity-90` → `hover:bg-primary-700`/`hover:bg-primary-800` + `transition-colors` theo design token.
- Nút primary → `bg-primary-700 text-on-primary` đạt contrast ≥ 4.5:1 (white trên `#1a8a54` = 4.36:1 ❌ → `#147a49` = 4.97:1 ✓); "Đổi ảnh" → `text-primary-700`.

## 4. Accessibility (A11y 86 → 100)

| Lỗi (Lighthouse) | Fix |
|---|---|
| `color-contrast` (2) | `bg-primary` → `bg-primary-700`, hover `bg-primary-800`, "Đổi ảnh" `text-primary-700` |
| `heading-order` | 4 tab `h3` → `h2` (h1 → h2 hợp lệ); modal giữ `h3` |
| `label` (2) | thêm `aria-label="Email"` (input readonly) + `aria-label="Ngày sinh"` |
| `landmark-one-main` | bọc nội dung trang trong `<main>` |
| `aria-hidden-focus` | `CartDrawer`: thêm `inert={!isDrawerOpen}` |

## 5. Code / Deploy

- Commits (branch `main`, deploy tự động qua GH Actions → Railway):
  - `247187d` polish(account): ui-craft sidebar profile
  - `88d269e` fix(account): warm-up counters chỉ chạy sau khi có accessToken
  - `8a9cb1e` fix(auth): single-flight refresh token tránh race rotation
  - `ca5b58d` fix(a11y): primary buttons sang primary-700 đạt contrast 4.5:1
  - `1157b92` fix(a11y): heading-order, label, landmark main, CartDrawer inert
  - `bc061be` fix(a11y): cân bằng JSX `<main>` + bỏ duplicate `inert` (build pass)
- Kiểm chứng e2e: `e2e/08-account-redesign.spec.ts` — **7/7 passed** (gồm test responsive mobile, đổi mật khẩu, orders, addresses).
- Deploy `bc061be` SUCCESS, đã xác nhận bản mới live trên `https://frontend-production-d58e.up.railway.app` (chunk hash khớp build local + `aria-label="Email"` render được).

## 6. Phương pháp đo Lighthouse account thật

(Playwright persistent context login UI → giữ browser với `--remote-debugging-port=9222` → `npx lighthouse --port=9222`) — không dùng được `--extra-headers` (chỉ áp cho main-doc request) hay `--user-data-dir` (chrome-launcher ghi đè profile), cả 2 đều dính redirect login.

## 6a. Xác minh con số LCP — 24s là ảo (simulation), không phải thật

LCP báo **24.0–24.2s** là **mô phỏng Lantern** (`throttlingMethod: simulate` — mặc định của CLI và DevTools panel mode Mobile), KHÔNG phải đồng hồ thật. So sánh 3 cách đo cùng URL production `/account`:

| Phương pháp | LCP | Perf | Bản chất |
|---|---|---|---|
| CLI default (`simulate`) × 2 | 24.0 / 24.2s | 47–49 | Lantern ước tính (latency model 562ms/req, CPU 4x) — trace thật chỉ 7s |
| Desktop preset (không throttle) | **4.24s** | 59 | trace thật |
| `--throttling-method=devtools` (4x CPU + 3G thật) | **5.90s** | 67 | trace thật |
| `observedLargestContentfulPaint` trong chính trace lúc báo 24.2s | **2.63s** | — | trace thật (h1 vẽ lúc 2.63s) |

Kết luận:
- **LCP element là h1 "Tài khoản của tôi" (text)**, không phải ảnh — trang `/account` không có ảnh hero (ảnh duy nhất là SVG inline 0B; orders tab rỗng). Lo ngại ảnh admin upload nặng (giới hạn 10MB banner) **không liên quan** LCP của `/account` (nó ảnh hưởng homepage nếu banner nặng).
- Lantern phồng 24s vì mô hình hóa chuỗi ~20 chunk JS + RSC fetches với latency 562ms/request rồi nhân CPU 4x — ước tính cực đoan.
- Khi đo thủ công F12 > Lighthouse: mode **Mobile mặc định cũng dùng simulation → sẽ ra ~24s lại**; muốn số thật chọn **Desktop** mode hoặc Advanced > tắt "Simulated throttling".

## 7. Screenshot

`C:\Project\LocHerbal\screenshots\account\`

| File | Mô tả |
|---|---|
| `account-profile.png` | Tab Thông tin cá nhân (desktop 1440px) |
| `account-orders.png` | Tab Đơn hàng của tôi |
| `account-addresses.png` | Tab Địa chỉ của tôi |
| `account-password.png` | Tab Đổi mật khẩu |
| `account-mobile-profile.png` | Mobile 390px (mobile tabs thay sidebar) |

## 8. Còn lại / Ghi chú

- **Performance — vấn đề thật duy nhất là `elementRenderDelay` 2.38s**: h1 chỉ render sau khi auth-bootstrap + warm-up API xong (client-render). Hướng tối ưu cho bước sau: SSR shell tĩnh render h1 ngay (bỏ chờ auth), preload chunk account — **không phải** vấn đề ảnh (xem §6a).

## 9. Tối ưu elementRenderDelay (commit `9535bb3`) — Perf 59 → 95

Tách 2 lớp trong `account/page.tsx`: **shell tĩnh** (h1, khung layout, sidebar nav) render NGAY không chờ auth; **dữ liệu động** (tên/avatar, mini-stat orders/addresses, form profile) hiện skeleton `animate-pulse` riêng trong lúc auth-bootstrap + warm-up chạy. Bỏ 2 guard `if (!hasHydrated) return null; if (!user) return null;` chặn toàn bộ trang.

Đo lại cùng phương pháp đã xác nhận (Desktop preset, không throttle, production):

| Chỉ số | Trước fix | Sau fix (`9535bb3`) |
|---|---|---|
| Performance | 59 | **93–95** |
| LCP (simulated) | 4.30s | **0.73s** |
| LCP (observed, trace thật) | 4.24s | **0.97s** |
| elementRenderDelay | ~3 990ms | **~570–720ms** |
| FCP (observed) | 4.24s | **0.97s** |
| TTFB | 250ms | 250ms (không đổi) |

> LCP giờ ≈ TTFB + render tối thiểu đúng như kỳ vọng. Lần đo có TTFB 2.58s là do server cold start (CDN miss) — không phải regression.
> Kiểm chứng: e2e 08-account **7/7 pass**, build pass, deploy SUCCESS, 11/13 chunk prod khớp build local.
- Backend dev local (`LocProject/.env`) đã thêm `THROTTLE_LIMIT=1000` + `AUTH_THROTTLE_LIMIT=1000` để e2e không dính `ThrottlerException` — chỉ ở môi trường dev.
- Tuân thủ `DESIGN_PRINCIPLES.md`: không hardcode hex mới, chỉ token `primary-*`, `globals.css` không bị xóa gì, Hero/Carousel không gộp, giữ cấu trúc sidebar pill `bg-primary-100` + mini-stat.