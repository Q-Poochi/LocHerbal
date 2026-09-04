# GitHub Secrets & Variables Checklist — LocHerbal

## Cách thêm Secret vào GitHub
Settings → Secrets and variables → Actions → New repository secret

## Secrets bắt buộc (Repository Secrets)

### Production / Staging DB
- [x] STAGING_DATABASE_URL        (đã set — giờ CHỈ dùng cho deploy-staging.yml; workflow backup KHÔNG dùng, tự resolve qua Railway API)
- [x] STAGING_DIRECT_URL          (đã set — URL kết nối thẳng Postgres, bypass PgBouncer, dùng cho migration)
- [ ] PROD_DATABASE_URL           (TÙY CHỌN — db-backup.yml tự resolve qua Railway API; set nếu muốn override, VD khi Railway API không suy ra được URL public)
- [ ] PROD_DIRECT_URL             (chưa dùng)

### Backup DB (workflow db-backup.yml — chạy 03:00 UTC hằng ngày)
- [x] RAILWAY_API_TOKEN           (đã set — auto-resolve production DB URL)
- [x] RAILWAY_PROJECT_ID          (đã set)
- [x] RAILWAY_BACKEND_SERVICE_ID  (đã set — fallback service khi không tìm thấy service Postgres)
- [ ] BACKUP_S3_ENDPOINT          (NÊN set — Cloudflare R2 / MinIO / B2, bucket RIÊNG chỉ dùng cho backup)
- [ ] BACKUP_S3_REGION            (TÙY CHỌN)
- [ ] BACKUP_S3_ACCESS_KEY        (NÊN set)
- [ ] BACKUP_S3_SECRET_KEY        (NÊN set)
- [ ] BACKUP_S3_BUCKET            (NÊN set)
      → Không set 4 secrets trên: backup tự đẩy lên GitHub Release
        `db-backup-<timestamp>` (durable, private, giữ tới khi prune 90 ngày)
        — vẫn tốt hơn artifact 90 ngày, nhưng nên tách hẳn storage ngoài.

### JWT
- [ ] STAGING_JWT_ACCESS_SECRET   (random string >= 64 chars)
- [ ] STAGING_JWT_REFRESH_SECRET  (random string >= 64 chars)
- [ ] PRODUCTION_JWT_ACCESS_SECRET
- [ ] PRODUCTION_JWT_REFRESH_SECRET

### VNPay
- [ ] STAGING_VNP_TMN_CODE        (lấy từ sandbox.vnpayment.vn)
- [ ] STAGING_VNP_HASH_SECRET     (lấy từ sandbox.vnpayment.vn)
- [ ] STAGING_VNP_IPN_URL         (URL public backend nhận IPN, e.g. https://<backend>.up.railway.app/payment/vnpay-ipn)
- [ ] STAGING_SMS_PROVIDER_API_KEY (BẮT BUỘC ở production — OtpService throw FATAL nếu NODE_ENV=production thiếu key)
- [ ] PRODUCTION_VNP_TMN_CODE     (lấy từ portal.vnpayment.vn — production)
- [ ] PRODUCTION_VNP_HASH_SECRET

### Redis
- [ ] STAGING_REDIS_URL           (redis://user:pass@host:6379)
- [ ] PRODUCTION_REDIS_URL

### Deploy (điền sau khi chọn provider)
- [x] RAILWAY_API_TOKEN            (Account token — Railway dashboard → Account Settings → Tokens; dùng cho CLI CI)
- [ ] RAILWAY_BACKEND_SERVICE_ID  (Service ID của backend trên Railway)
- [ ] RAILWAY_FRONTEND_SERVICE_ID (Service ID của frontend trên Railway)
- [ ] RAILWAY_ENVIRONMENT_ID      (Environment ID của project trên Railway)
- [ ] FLY_API_TOKEN               (nếu dùng Fly.io)
- [ ] AZURE_CREDENTIALS           (nếu dùng Azure)
- [ ] VERCEL_TOKEN                (nếu dùng Vercel cho frontend)

### Shipping webhook (GHN / GHTK) — bắt buộc nếu dùng webhook
- [ ] STAGING_GHN_WEBHOOK_TOKEN   (token đặt trong URL webhook GHN)
- [ ] STAGING_GHTK_WEBHOOK_TOKEN  (token `?hash=` cho webhook GHTK)

## Variables (không nhạy cảm, dùng vars.*)
- [ ] STAGING_API_URL = https://api-staging.locherbal.com
- [ ] STAGING_BACKEND_URL = https://api-staging.locherbal.com
- [ ] STAGING_VNP_URL = https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
- [ ] STAGING_VNP_RETURN_URL = https://staging.locherbal.com/order/success
- [ ] STAGING_FRONTEND_URL = <frontend Railway domain, dùng cho CORS_ORIGINS>

## Environments cần tạo trên GitHub
Settings → Environments → New environment
- [ ] staging    (không cần approval)
- [ ] production (bắt buộc required reviewers: chọn chính bạn)

## QUAN TRỌNG
- KHÔNG commit .env vào git (đã có .gitignore)
- KHÔNG dùng secret staging cho production
- VNP_HASH_SECRET production KHÁC sandbox
  (lỗi này đã gặp trong test: NJPO vs NJP0)