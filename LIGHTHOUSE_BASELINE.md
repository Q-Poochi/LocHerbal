# Lighthouse Baseline — Trước Redesign (19/08/2026)

Đo bằng Lighthouse 13.4.1 (local), Chrome 151, mobile emulation, trên production:
- Homepage: `https://frontend-production-d58e.up.railway.app/`
- Account: `https://frontend-production-d58e.up.railway.app/account` (đã login — user baseline test)

## Điểm số

| Trang | Performance | Accessibility | FCP | LCP | CLS | TBT | SI |
|---|---|---|---|---|---|---|---|
| Homepage | **40** | **92** | 2.0s | 4.6s | 0.194 | 3320ms | 4.5s |
| Account | **46** | **92** | 2.1s | 24.3s | 0.01 | 1290ms | 4.1s |

## Ràng buộc

- Sau mỗi bước redesign, Performance KHÔNG được giảm quá **5 điểm** so với baseline trên.
- Account LCP 24.3s (ảnh avatar/lazy lớn) — cần theo dõi; nếu cải thiện được thì tốt, không được làm tệ hơn đáng kể.

## Ghi chú kỹ thuật (đo lại)

- Lighthouse chạy local: `npx lighthouse <url> --only-categories=performance,accessibility --extra-headers="{\"Cookie\":\"<cookie>\"}" --chrome-flags="--headless --no-sandbox --disable-gpu --disable-dev-shm-usage"` (chạy qua file .cmd để tránh lỗi escaping PowerShell).
- Cookie đăng nhập: lấy bằng Playwright login `test2@locherbal.com` HOẶC user baseline `lh-baseline-*@locherbal.local` / `Test@123456` (user test2 có thể bị disable sau các test cũ).
- Nếu gặp `NO_NAVSTART` hoặc `EPERM` temp dir: kill hết `chrome` processes, chạy lại (lỗi intermittent khi máy tải).