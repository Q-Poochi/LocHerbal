# GitHub Actions Secrets Checklist — LocHerbal

> **Phạm vi file này: CHỈ GitHub Actions Secrets & Variables** — những giá trị
> set tại *Settings → Secrets and variables → Actions* và dùng trong
> `.github/workflows/*.yml`.
>
> **KHÔNG phải Railway Environment Variables.** Biến runtime của production
> (DATABASE_URL, JWT, VNPay, Redis…) được cấu hình trực tiếp trên
> **Railway dashboard** — xem phần "Tham chiếu Railway dashboard" cuối file.
>
> ⚠️ Người đọc: ô chưa tick ở đây KHÔNG có nghĩa là "production chưa cấu
> hình" — chỉ nghĩa là workflow tương ứng chưa dùng secret đó trên GitHub.

## Trạng thái: ĐÃ SET & ĐANG DÙNG (verified 04/09/2026 qua `gh secret list`)

### Railway CI — dùng bởi deploy-staging.yml + db-backup.yml
- [x] RAILWAY_API_TOKEN
- [x] RAILWAY_PROJECT_ID
- [x] RAILWAY_BACKEND_SERVICE_ID
- [x] RAILWAY_FRONTEND_SERVICE_ID
- [x] RAILWAY_ENVIRONMENT_ID

### Deploy staging — deploy-staging.yml đọc rồi `railway variable set` sang Railway
- [x] STAGING_DATABASE_URL      (backup workflow KHÔNG dùng secret này — tự resolve qua Railway API)
- [x] STAGING_DIRECT_URL        (cho prisma migrate)
- [x] STAGING_JWT_ACCESS_SECRET
- [x] STAGING_JWT_REFRESH_SECRET
- [x] STAGING_VNP_TMN_CODE
- [x] STAGING_VNP_HASH_SECRET
- [x] STAGING_VNP_IPN_URL
- [x] STAGING_VNP_URL
- [x] STAGING_REDIS_URL
- [x] STAGING_RESEND_API_KEY
- [x] STAGING_EMAIL_FROM
- [x] STAGING_SMS_PROVIDER_API_KEY
- [x] STAGING_API_URL
- [x] STAGING_GHN_WEBHOOK_TOKEN
- [x] STAGING_GHTK_WEBHOOK_TOKEN

### GitHub Variables (vars.*) — ĐÃ SET
- [x] STAGING_FRONTEND_URL
- [x] STAGING_VNP_RETURN_URL

### Backup DB — db-backup.yml (03:00 UTC hằng ngày)
- [ ] PROD_DATABASE_URL   (TÙY CHỌN — không set: tự resolve qua Railway API, hiện tự resolve OK)
- [ ] BACKUP_S3_ENDPOINT  (NÊN set — Cloudflare R2 / MinIO / B2, bucket RIÊNG chỉ cho backup)
- [ ] BACKUP_S3_REGION
- [ ] BACKUP_S3_ACCESS_KEY
- [ ] BACKUP_S3_SECRET_KEY
- [ ] BACKUP_S3_BUCKET
      → Không set: backup tự đẩy lên GitHub Release `db-backup-<ts>` (durable,
        private — đã verify chạy thật run 33896911248).

## Referenced NHƯNG CHƯA SET — cần xử lý (ảnh hưởng thật)

- [ ] STAGING_S3_ENDPOINT / STAGING_S3_REGION / STAGING_S3_ACCESS_KEY /
      STAGING_S3_SECRET_KEY / STAGING_S3_BUCKET / STAGING_S3_PUBLIC_URL

  deploy-staging.yml tham chiếu 6 secrets này nhưng chúng **rỗng** ⇒ mỗi lần
  deploy đang set `S3_ENDPOINT=""` cho backend ⇒ **tính năng upload ảnh sản
  phẩm lỗi khi gọi** (ObjectStorageService: "S3_ENDPOINT chưa cấu hình") —
  khớp audit "Railway env: S3 trống". Fix: cấu hình MinIO/R2 thật rồi set đủ
  6 secrets, HOẶC gỡ khối S3 khỏi deploy-staging.yml nếu chưa dùng upload.

## THAM CHIẾU Railway dashboard — NGOÀI phạm vi file này

Các biến runtime production nằm trên Railway (backend service, environment
`production`) — KHÔNG tồn tại trên GitHub, KHÔNG workflow nào dùng
(đã xóa các mục PRODUCTION_* cũ ra khỏi checklist vì gây hiểu lầm):
DATABASE_URL, DIRECT_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET,
VNP_TMN_CODE, VNP_HASH_SECRET, VNP_URL, VNP_RETURN_URL, VNP_IPN_URL,
REDIS_URL, RESEND_API_KEY, EMAIL_FROM, SMS_PROVIDER, API_URL, FRONTEND_URL,
CORS_ORIGINS, NODE_ENV=production, PORT, S3_* (nếu dùng upload).

Đã verify hoạt động thật trên Railway (không cần hành động): login/RBAC/
throttle (31/08), saga checkout + VNPay URL (31/08), /health + backup
production (04/09).

## Provider khác — chỉ khi chuyển nền tảng (hiện KHÔNG dùng)
- [ ] FLY_API_TOKEN / AZURE_CREDENTIALS / VERCEL_TOKEN

## Environments GitHub
- [x] staging — đã tạo (deploy-staging.yml dùng)
- production: CHƯA cần — production deploy qua Railway, không qua Actions.

## QUAN TRỌNG
- KHÔNG commit .env vào git (đã có .gitignore)
- KHÔNG dùng secret staging cho production
- VNP_HASH_SECRET production KHÁC sandbox (lỗi đã gặp: NJPO vs NJP0)
