# Báo cáo Railway + GHN/GHTK — LocHerbal

> Ngày: 11/08/2026
> Phạm vi: rà soát & triển khai config deploy Railway, tích hợp webhook GHN/GHTK, hướng dẫn test thanh toán nhận đơn hàng thật.

---

## PHẦN A — RAILWAY (Deploy)

### A.1 Hiện trạng

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| `LocProject/railway.json` | ✅ Có | Builder DOCKERFILE, start command `npx prisma migrate deploy && node dist/main`, healthcheck `/health` |
| `LocProject/Dockerfile` | ✅ Có | Multi-stage Node 22 Alpine, `prisma generate` + `npm run build` trong builder stage |
| `locproject-frontend/railway.json` + `Dockerfile` | ✅ Có | Frontend Next.js |
| `.github/workflows/backend-ci.yml` | ✅ Fix 11/08 | Sửa path `LOCPROJECT` → `LocProject` (Linux case-sensitive), Node 20 → 22, **thêm step e2e saga test** |
| `.github/workflows/frontend-ci.yml` | ✅ OK | Path đúng `locproject-frontend` |
| `.github/workflows/deploy-staging.yml` | ✅ Fix 11/08 | Sửa biến `$RAILWAY_BACKEND_SERVICE_ID`/`$RAILWAY_FRONTEND_SERVICE_ID` không tồn tại → `$RAILWAY_SERVICE_ID`; thêm GHN/GHTK webhook tokens |
| `.github/SECRETS_CHECKLIST.md` | ✅ Cập nhật | Bổ sung `RAILWAY_BACKEND_SERVICE_ID`, `RAILWAY_FRONTEND_SERVICE_ID`, `RAILWAY_ENVIRONMENT_ID`, `STAGING_GHN_WEBHOOK_TOKEN`, `STAGING_GHTK_WEBHOOK_TOKEN` |
| `LocProject/DEPLOYMENT_CHECKLIST.md` | ✅ Cập nhật | Thêm mục 0 "Deploy lên Railway" step-by-step, sửa tên biến đúng (`JWT_ACCESS_SECRET`, `VNP_*`) |

### A.2 Lỗi đã tìm & sửa trong rà soát

1. **`backend-ci.yml` dùng path sai case `LOCPROJECT/**`** — GitHub Actions chạy trên Linux (case-sensitive), folder thật là `LocProject` → workflow sẽ KHÔNG trigger/fail. **Đã sửa toàn bộ → `LocProject`.**
2. **`deploy-staging.yml` gọi biến chưa khai báo** — env block khai báo `RAILWAY_SERVICE_ID` nhưng lệnh `railway up` dùng `$RAILWAY_BACKEND_SERVICE_ID` → shell rỗng, deploy fail. **Đã sửa → `$RAILWAY_SERVICE_ID`.**
3. **CI chưa chạy e2e saga** — backend-ci chỉ chạy `npm test` (unit). **Đã thêm step `npx jest --config test/jest-e2e.json`** với đầy đủ env VNPay/Redis (service redis/postgres đã có sẵn).
4. **Node version lệch** — backend-ci dùng Node 20, Dockerfile/railway dùng Node 22, TS 6 cần Node ≥ 20.19. **Đã đồng bộ → 22.**
5. **Deploy thiếu webhook env** — `railway variable set` không set `GHN_WEBHOOK_TOKEN`/`GHTK_WEBHOOK_TOKEN`. **Đã thêm.**

### A.3 Còn lại (cần hành động thủ công)

Chưa **deploy thật** vì cần secrets từ phía bạn. Hướng dẫn chi tiết ở `LocProject/DEPLOYMENT_CHECKLIST.md` mục 0. Tóm tắt:
1. `railway init` → tạo project, `railway add --name backend` + `--name frontend`.
2. Set GitHub Secrets (xem `SECRETS_CHECKLIST.md`): `RAILWAY_TOKEN`, `RAILWAY_BACKEND_SERVICE_ID`, `RAILWAY_FRONTEND_SERVICE_ID`, `RAILWAY_ENVIRONMENT_ID`, `STAGING_DATABASE_URL`, `STAGING_DIRECT_URL`, JWT secrets, VNPay, GHN/GHTK tokens.
3. Push `main` → workflow `Deploy Staging` tự chạy (backend trước, frontend sau).
4. Verify `GET https://<backend>.up.railway.app/health` → `{ status: 'ok' }`.

> ⚠️ `VNP_IPN_URL` hiện trỏ tới tunnel serveo cũ (`serveousercontent.com`) — phải đổi thành URL IPN public của Railway trước khi test VNPay production.

---

## PHẦN B — GHN / GHTK (Vận chuyển)

### B.1 Hiện trạng

| Hạng mục | Trạng thái |
|---|---|
| Carrier abstraction | ✅ Có sẵn (`Carrier` model, `code` unique, `apiConfig` Json) |
| Webhook inbound GHN | ✅ Code xong + 19 unit test |
| Webhook inbound GHTK | ✅ Code xong |
| Tạo vận đơn tự động (order.confirmed → GHN API) | ⚠️ Vẫn là TODO trong `order-confirmed.listener.ts` — chưa có call GHN API thật |
| Live test | ⬜ Chưa thực hiện — thiếu sandbox token GHN/GHTK |

### B.2 Endpoint đã triển khai

```
POST /api/v1/shipping/webhooks/ghn?token=<GHN_WEBHOOK_TOKEN>    (@Public, CSRF-exempt)
POST /api/v1/shipping/webhooks/ghtk?hash=<GHTK_WEBHOOK_TOKEN>   (@Public, CSRF-exempt)
```

- Xác thực bằng **constant-time compare** (`timingSafeEqual`); nếu env token để trống → **fail-closed (403 mọi request)**.
- Chấp nhận cả JSON lẫn `application/x-www-form-urlencoded` (đã thêm `express.urlencoded`).
- **Idempotent**: trả `{ received: true, ignored: true }` khi shipment chưa tồn tại hoặc transition không hợp lệ → tránh GHN retry 10 lần / GHTK retry khi không 200.

### B.3 Mapping trạng thái

**GHN status → ShipmentStatus:**
| GHN | Nội bộ |
|---|---|
| `ready_to_pick` | PENDING |
| `picking` / `money_collect_picking` / `picked` | PICKED_UP |
| `storing` / `transporting` / `sorting` / `delivering` / `money_collect_delivering` | IN_TRANSIT |
| `delivered` | DELIVERED |
| `delivery_fail` / `cancel` | FAILED |
| `waiting_to_return` / `return` / `returned` | RETURNED |

**GHTK status_id → ShipmentStatus:**
| status_id | Ý nghĩa | Nội bộ |
|---|---|---|
| 1, 2, 8 | Chưa tiếp nhận / Đã tiếp nhận / Hoãn lấy | PENDING |
| 3, 12 | Đã lấy / Đang lấy | PICKED_UP |
| 4, 10, 30, 31, 91 | Đang giao / Delay / trung chuyển | IN_TRANSIT |
| 5, 6 | Đã giao / Đã đối soát | DELIVERED |
| -1, 7, 9, 13 | Hủy / Không lấy được / Không giao được / Bồi hoàn | FAILED |
| 11, 20, 21 | Đối soát trả / Đang trả / Đã trả | RETURNED |

### B.4 Khác biệt với `updateStatus` (admin)

`ShipmentService.applyCarrierStatus()` (mới, dành cho webhook):
- Chấp nhận **FAILED / RETURNED** là status cuối (enum có, nhưng `updateStatus` cũ bỏ qua).
- **Idempotent**: status trùng → `{ applied: false }`; shipment đã terminal (DELIVERED/FAILED/RETURNED) → khóa, không regress.
- Vẫn emit `shipment.delivered` khi giao thành công → saga order → DELIVERED.

### B.5 Checklist khi có token thật

1. Set `GHN_WEBHOOK_TOKEN` + `GHTK_WEBHOOK_TOKEN` trong `.env` (dev) / Railway variables (staging).
2. Đăng ký webhook trên portal GHN (cần account GHN có hợp đồng) với URL:
   `https://<domain>/api/v1/shipping/webhooks/ghn?token=<TOKEN>`
3. GHTK: cấu hình callback URL dạng `?hash=<TOKEN>` trên hệ thống GHTK.
4. Tạo shipment có `trackingCode` = mã vận đơn GHN/GHTK để webhook tìm thấy.
5. Test: gửi payload mẫu bằng curl (dạng JSON) → verify shipment status đổi, tracking event được ghi.

---

## PHẦN C — HƯỚNG DẪN TEST THANH TOÁN NHẬN ĐƠN HÀNG THẬT (VNPay Sandbox)

> Môi trường hiện tại: backend `http://localhost:4000` **đang chạy** (health OK), Postgres `ecommerce` + Redis + MinIO chạy trong Docker. Frontend `http://localhost:3000` **chưa chạy** — cần start trước khi test UI.

### C.1 Chuẩn bị

```powershell
# 1. Start frontend (terminal riêng)
cd C:\Project\LocHerbal\locproject-frontend
npm run dev        # → http://localhost:3000

# 2. Xác nhận backend còn chạy
curl http://localhost:4000/health    # → {"status":"ok",...}

# 3. Xác nhận VNPay sandbox config (đã set trong .env)
#    VNP_TMN_CODE=W6OYZ51I
#    VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
#    VNP_RETURN_URL=http://localhost:3000/order/success
```

### C.2 Luồng thanh toán (test qua UI — nhanh nhất)

1. **Mở** `http://localhost:3000` → đăng ký tài khoản mới
   `POST /auth/register` `{ email, password (≥8 ký tự), fullName, phone }` (hoặc dùng form UI).
2. **Chọn sản phẩm** (seed có 12 sản phẩm × 2 variant, stock 100) → chọn size → **Thêm vào giỏ** (bắt buộc đã đăng nhập).
3. **Vào giỏ** → **Thanh toán** → nhập địa chỉ → chọn **VNPay** → Submit.
4. Hệ thống redirect tới **VNPay Sandbox** → nhập **thẻ test** (lấy từ tài khoản sandbox của bạn tại https://sandbox.vnpayment.vn, thường là thẻ nội địa/test của NCB):
   ```
   Ngân hàng: NCB
   Số thẻ:   9704198526191432198
   Tên chủ thẻ: NGUYEN VAN A
   Ngày phát hành: 07/15
   Mật khẩu OTP: OTP
   ```
5. Bấm **Thanh toán** → VNPay chuyển về `http://localhost:3000/order/success`.

> ⚠️ **IPN trong môi trường local:** VNPay gửi IPN tới `VNP_IPN_URL` (đang trỏ tunnel serveo cũ). Nếu URL đó không còn hoạt động, **paymentStatus sẽ không tự cập nhật PAID**. Cách xử lý:
> - **Cách 1 (khuyến nghị cho test UI):** mở tunnel mới (ngrok/serveo) trỏ về `:4000`, cập nhật `VNP_IPN_URL` trong `.env`, restart backend, và đăng ký lại URL này trên portal sandbox VNPay.
> - **Cách 2 (verify nhanh không cần IPN):** thanh toán vẫn đổi order sang CONFIRMED ở bước redirect return về (xem C.4) nếu `verifyReturn` chạy; tuy nhiên deduct kho & shipping chỉ kích hoạt qua IPN `payment.confirmed` event.

### C.3 Verify kết quả sau thanh toán

```powershell
# Lấy orderId mới nhất từ DB (docker exec vào postgres-primary)
docker exec -it postgres-primary psql -U postgres -d ecommerce -c "SELECT id, \"customerId\", status, \"paymentStatus\", \"totalAmount\" FROM orders ORDER BY \"createdAt\" DESC LIMIT 3;"

# Kiểm tra stock đã deduct: qtyOnHand giảm, qtyReserved về 0 (hoặc còn nếu chưa có IPN)
docker exec -it postgres-primary psql -U postgres -d ecommerce -c "SELECT si.\"qtyOnHand\", si.\"qtyReserved\" FROM \"StockItem\" si ORDER BY si.\"createdAt\" DESC LIMIT 5;"
```

**Kết quả mong đợi khi IPN chạy đúng:**
- `orders.status` = `CONFIRMED`, `orders.paymentStatus` = `PAID`.
- `payment_transactions` có 1 record VNPAY.
- `order_status_history` ghi "Thanh toán qua VNPay thành công. Mã GD: ...".
- Stock: `qtyOnHand` giảm đúng số lượng, `qtyReserved` = 0.

### C.4 Flow test API thuần (không cần UI, dùng để chẩn đoán)

```powershell
$base = "http://localhost:4000"
# 1. Register + login (cookie httpOnly lưu tự động qua Invoke-WebRequest -SessionVariable)
$body = '{"email":"test1@locherbal.vn","password":"password123","fullName":"Test User","phone":"0901234567"}'
Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType "application/json" -Body $body

$login = '{"email":"test1@locherbal.vn","password":"password123"}'
$s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$resp = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType "application/json" -Body $login -SessionVariable s
$token = $resp.accessToken
$h = @{ Authorization = "Bearer $token" }

# 2. Lấy productVariantId (chọn product có variants — tránh product test không variant)
$prod = Invoke-RestMethod -Uri "$base/products" -Headers $h
$target = $prod.data | Where-Object { $_.variants.Count -gt 0 } | Select-Object -First 1
$variantId = $target.variants[0].id

# 3. Thêm vào giỏ
Invoke-RestMethod -Method Post -Uri "$base/cart/items" -Headers $h -ContentType "application/json" -Body (@{ productVariantId = $variantId; qty = 2 } | ConvertTo-Json)

# 4. Tạo address rồi checkout
$addr = Invoke-RestMethod -Method Post -Uri "$base/customers/addresses" -Headers $h -ContentType "application/json" -Body (@{ recipientName="Test User"; phone="0901234567"; addressLine="12 Nguyễn Trãi"; province="Hà Nội"; isDefault=$true } | ConvertTo-Json)
$order = Invoke-RestMethod -Method Post -Uri "$base/cart/checkout" -Headers $h -ContentType "application/json" -Body (@{ addressId = $addr.id } | ConvertTo-Json)
$orderId = $order.id

# 5. Tạo URL thanh toán VNPay
$url = Invoke-RestMethod -Uri "$base/payment/vnpay-url?orderId=$orderId" -Headers $h
$url.url    # mở URL này trong browser → thanh toán thẻ test → redirect về /order/success

# 6. Sau khi redirect, xem response vnpay-return (nếu lưu query)
# GET http://localhost:4000/payment/vnpay-return?vnp_...  → { success: true, orderId, amount }
```

### C.5 Checklist xác nhận "nhận đơn hàng thật"

- [ ] Đăng ký + login thành công
- [ ] Thêm sản phẩm vào giỏ → checkout tạo order `status=PENDING`
- [ ] URL VNPay tạo ra hợp lệ (`vnp_TmnCode=W6OYZ51I` trong query)
- [ ] Thanh toán thẻ test trên sandbox → redirect về `/order/success`
- [ ] DB: `orders.status=CONFIRMED`, `paymentStatus=PAID`
- [ ] DB: `payment_transactions` có record VNPAY
- [ ] DB: stock deduct đúng (qtyOnHand giảm, qtyReserved=0)
- [ ] (Webhook GHN/GHTK — khi có token) tạo shipment trackingCode → POST webhook → status shipment đổi

> Nếu bước "paymentStatus=PAID" không xảy ra → IPN không đến được backend (vấn đề tunnel/`VNP_IPN_URL`), xem lại mục C.2 ⚠️.
