# BÁO CÁO STEP 3 — Trang Tài Khoản (Account)

## 1. Tóm tắt

Redesign + polish trang `/account` theo ui-craft, sửa bug refresh-token race khiến trang redirect về `/login`, và hoàn tất chuỗi fix accessibility (A11y). Kết quả Lighthouse đo trên **production** (đã đăng nhập user `test2@locherbal.com`):

| Chỉ số | Baseline (sai, đo nhầm login) | Sau STEP 3 (production thật) |
|---|---|---|
| Performance | 46 | 47–49 |
| Accessibility | 92 | **100** |
| LCP | — | ~24s (ảnh hero) |
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

- **Performance chưa tối ưu**: LCP ~24s do ảnh hero không preload — nằm ngoài phạm vi STEP 3, đề xuất cho bước tối ưu tiếp theo (preload LCP image, `fetchpriority`, image CDN).
- Backend dev local (`LocProject/.env`) đã thêm `THROTTLE_LIMIT=1000` + `AUTH_THROTTLE_LIMIT=1000` để e2e không dính `ThrottlerException` — chỉ ở môi trường dev.
- Tuân thủ `DESIGN_PRINCIPLES.md`: không hardcode hex mới, chỉ token `primary-*`, `globals.css` không bị xóa gì, Hero/Carousel không gộp, giữ cấu trúc sidebar pill `bg-primary-100` + mini-stat.