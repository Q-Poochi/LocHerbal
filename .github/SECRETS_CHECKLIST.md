# GitHub Secrets & Variables Checklist — LocHerbal

## Cách thêm Secret vào GitHub
Settings → Secrets and variables → Actions → New repository secret

## Secrets bắt buộc (Repository Secrets)

### Production / Staging DB
- [ ] STAGING_DATABASE_URL
      postgresql://user:pass@host:5432/ecommerce_staging
- [ ] STAGING_DIRECT_URL  
      (URL kết nối thẳng Postgres, bypass PgBouncer — dùng cho migration)
- [ ] PRODUCTION_DATABASE_URL
- [ ] PRODUCTION_DIRECT_URL

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
- [ ] RAILWAY_TOKEN               (nếu dùng Railway — `railway login` → token từ Railway dashboard)
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