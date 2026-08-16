# Thiết lập Domain sản xuất — LocHerbal

> Checklist từng bước để trỏ domain thật (vd: `locherbal.com`) vào backend + frontend trên Railway,
> bật HTTPS (SSL tự động) + HSTS, và cập nhật mọi URL phụ thuộc.

---

## 1. Chuẩn bị domain

- Mua domain (vd: `locherbal.com`) từ bất kỳ registrar nào (Namecheap, GoDaddy, VinaHost, PA Vietnam...).
- Gợi ý tên miền phụ:
  - Frontend chính: `locherbal.com` (apex) hoặc `www.locherbal.com`
  - API backend: `api.locherbal.com`
- **Không** cần mua VPS/reverse proxy — Railway tự cấp SSL (Let's Encrypt) cho custom domain.

---

## 2. Thêm custom domain trên Railway

Sử dụng Railway CLI (đã login workspace `q-poochi`):

```bash
# Backend
railway domain --service backend add api.locherbal.com

# Frontend
railway domain --service frontend add locherbal.com
railway domain --service frontend add www.locherbal.com   # nếu dùng www
```

Sau khi chạy, CLI/Railway hiển thị **target** (CNAME) cho từng domain —
vd: `api.locherbal.com → api-locherbal-com.up.railway.app`. Ghi lại các target này cho bước DNS.

> Cách khác: làm qua Dashboard Railway → chọn service → tab **Settings → Domains** → nhập domain.

---

## 3. DNS records (tại registrar)

Với mỗi domain, tạo record **CNAME** trỏ vào target Railway trả về ở bước 2
(sửa target theo output thực tế — ví dụ bên dưới):

| Loại | Name/Host | Value (target) | Ghi chú |
|------|-----------|----------------|---------|
| CNAME | `api` | `api-locherbal-com.up.railway.app` | Backend — tạo domain `api.locherbal.com` trên Railway trước |
| CNAME | `@` (root) | `locherbal-com.up.railway.app` | Frontend — tạo domain `locherbal.com` trên Railway trước |
| CNAME | `www` | `locherbal-com.up.railway.app` | Frontend www |

> Nếu registrar không hỗ trợ CNAME cho root (`@`), dùng **ALIAS/ANAME/FLATTENING** nếu có,
> hoặc dùng `www.locherbal.com` làm canonical và redirect root sang www.

---

## 4. Verify SSL (tự động)

- Railway tự cấp chứng chỉ Let's Encrypt sau khi DNS resolve — thường trong vài phút.
- Kiểm tra:

```bash
curl -sI https://api.locherbal.com/health
# mong đợi: HTTP/2 200, header Strict-Transport-Security có mặt
```

---

## 5. Cập nhật biến môi trường (bắt buộc — không đổi sẽ hỏng link/auth/CORS)

Các URL thật phải thay thế URL staging (`*.up.railway.app`) và localhost.

### Backend (service `backend`)
| Biến | Giá trị mới |
|------|-------------|
| `API_URL` | `https://api.locherbal.com` |
| `FRONTEND_URL` | `https://locherbal.com` |
| `CORS_ORIGINS` | `https://locherbal.com,https://www.locherbal.com` |
| `VNP_RETURN_URL` | `https://locherbal.com/checkout/result` (URL VNPay quay về — kiểm tra route thật) |
| `VNP_IPN_URL` | `https://api.locherbal.com/api/v1/payments/vnpay/ipn` |
| `SMS_PROVIDER` | `esms` (bắt buộc ở production — fail-fast chặn mock) |
| `SMS_PROVIDER_API_KEY` / `SMS_PROVIDER_SECRET_KEY` / `SMS_BRANDNAME` | Thật từ esms |

### Frontend (service `frontend`)
| Biến | Giá trị mới |
|------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://api.locherbal.com` |

Set qua Railway CLI:

```bash
railway variable set --service backend \
  API_URL="https://api.locherbal.com" \
  FRONTEND_URL="https://locherbal.com" \
  CORS_ORIGINS="https://locherbal.com,https://www.locherbal.com"

railway variable set --service frontend \
  NEXT_PUBLIC_API_URL="https://api.locherbal.com"
```

> Lưu ý: `NEXT_PUBLIC_*` được build vào bundle — thay đổi biến này cần **redeploy frontend**.

---

## 6. HSTS

- **Backend**: `helmet()` — `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` (đã đủ điều kiện preload).
- **Frontend**: `next.config.ts` bật HSTS khi `NODE_ENV=production` — `max-age=31536000; includeSubDomains; preload`.
- Verify header sau khi trỏ domain (mục 4).
- Hệ thống đã đủ điều kiện **HSTS Preload** (`max-age >= 31536000` + `includeSubDomains` + `preload`) — đăng ký tại https://hstspreload.org khi domain thật đã live toàn HTTPS.
- Lưu ý CDN: HTML trang chủ có `Cache-Control: s-maxage=31536000` — đây là **mặc định của Next.js cho static shell**; vì trang chủ render nội dung client-side nên cache shell không làm nội dung cũ. Không cần chỉnh.

---

## 7. Sau khi live

- Cập nhật uptime monitor (`.github/workflows/uptime-check.yml`) sang domain thật thay vì `*.up.railway.app`.
- Cập nhật `STAGING_*` secrets trong GitHub nếu dùng production pipeline riêng.
- Xoá/quản lý domain `*.up.railway.app` mặc định nếu không muốn lộ.

---

## 8. Plan Railway & tránh "sleep" trước khi live

- Project hiện đang ở plan **trial** (`subscriptionType: "trial"` qua GraphQL `project { subscriptionType }`) → service bị ép ngủ sau ~15-30 phút không traffic, gây hiện tượng "lâu lâu không thấy sản phẩm" (backend chờ wake → fetch `/products` timeout → trang trống).
- **Khuyến nghị trước khi trỏ domain chính thức**: nâng lên **Hobby ($5/tháng)** để app không bao giờ ngủ — đặc biệt quan trọng cho production, tránh mất khách khi truy cập lần đầu.
- Giảm thiểu miễn phí hiện tại (đã deploy): uptime-check ping 5 phút/lần + frontend retry/timeout 30s + trạng thái lỗi có nút "Thử lại". Chi tiết xem `DEPLOYMENT_CHECKLIST.md` mục 7a.
