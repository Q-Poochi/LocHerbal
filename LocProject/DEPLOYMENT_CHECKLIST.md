# Triển khai LocHerbal — Checklist sản xuất

## 0. Deploy lên Railway (recommended path)

Config đã có sẵn trong repo:
- `railway.json` — builder DOCKERFILE, start command `npx prisma migrate deploy && node dist/main`, healthcheck `/health` + **volume mount `/app/uploads`** (upload bền khi redeploy)
- `Dockerfile` — multi-stage Node 22, tự `prisma generate` + build, khai báo `VOLUME /app/uploads`
- `.github/workflows/deploy-staging.yml` — CI/CD push `main` → Railway (backend + frontend)
- `.github/workflows/backend-ci.yml`, `frontend-ci.yml` — test/build khi push

### Bước 1 — Tạo project trên Railway
```bash
railway init   # tạo project mới, nhớ ghi lại Project ID
```

### Bước 2 — Tạo 2 service
```bash
# Backend (repo gốc LocProject/, dùng Dockerfile)
railway add --name backend
railway up --service backend

# Frontend (repo locproject-frontend/)
railway add --name frontend
```

### Bước 3 — Thêm GitHub Secrets (Settings → Secrets and variables → Actions)
Xem danh sách đầy đủ trong `.github/SECRETS_CHECKLIST.md`. Bắt buộc:
- `RAILWAY_TOKEN` — lấy từ Railway: Account Settings → Tokens
- `RAILWAY_BACKEND_SERVICE_ID` — `railway status --service backend` (hoặc Dashboard → Service → Copy Service ID)
- `RAILWAY_FRONTEND_SERVICE_ID`
- `RAILWAY_ENVIRONMENT_ID` — `railway status` → Environment ID
- `STAGING_DATABASE_URL` / `STAGING_DIRECT_URL` — Railway PostgreSQL plugin
- `STAGING_JWT_ACCESS_SECRET` / `STAGING_JWT_REFRESH_SECRET` — `openssl rand -hex 64`
- `STAGING_VNP_TMN_CODE` / `STAGING_VNP_HASH_SECRET` / `STAGING_VNP_URL`
- `STAGING_GHN_WEBHOOK_TOKEN` / `STAGING_GHTK_WEBHOOK_TOKEN` (nếu dùng webhook GHN/GHTK)
- `STAGING_API_URL` (secret) + vars `STAGING_FRONTEND_URL`

### Bước 4 — Deploy
Push lên `main` → workflow `Deploy Staging` tự chạy. Hoặc thủ công:
```bash
railway up --service backend --ci
```

### Bước 5 — Verify
- `GET https://<backend>.up.railway.app/health` → `{ status: 'ok' }`
- Đăng ký webhook GHN với URL:
  `https://<backend>.up.railway.app/api/v1/shipping/webhooks/ghn?token=<GHN_WEBHOOK_TOKEN>`
- GHTK webhook URL dùng tham số `?hash=`:
  `https://<backend>.up.railway.app/api/v1/shipping/webhooks/ghtk?hash=<GHTK_WEBHOOK_TOKEN>`

## 1. Environment variables (.env production)
| Variable | Mô tả | Bắt buộc |
|----------|-------|----------|
| `DATABASE_URL` | PostgreSQL connection string (nên dùng PgBouncer) | ✓ |
| `JWT_ACCESS_SECRET` | Secret key cho JWT access token (>= 64 ký tự ngẫu nhiên) | ✓ |
| `JWT_REFRESH_SECRET` | Secret key cho Refresh Token (>= 64 ký tự) | ✓ |
| `PORT` | Cổng backend (mặc định 4000) | |
| `NODE_ENV` | `production` | ✓ |
| `CORS_ORIGINS` | CSV các origin frontend cho phép | ✓ |
| `VNP_TMN_CODE` | Mã website VNPay | ✓ (nếu dùng VNPay) |
| `VNP_HASH_SECRET` | Secret key VNPay | ✓ (nếu dùng VNPay) |
| `VNP_URL` | URL VNPay sandbox/production | |
| `VNP_RETURN_URL` | URL return VNPay | |
| `GHN_WEBHOOK_TOKEN` | Token xác thực webhook GHN | (nếu dùng GHN) |
| `GHTK_WEBHOOK_TOKEN` | Token xác thực webhook GHTK (`?hash=`) | (nếu dùng GHTK) |
| `REDIS_HOST` / `REDIS_PORT` | Redis (cache catalog) | |
| `SMS_PROVIDER_API_KEY` | TrangSMS/ESMS — bắt buộc ở production | ✓ |

Tạo file `.env.production` từ `.env.example` và điền đầy đủ values.

## 2. HTTPS
- Dùng reverse proxy (Nginx / Caddy / Cloudflare Tunnel) để chặn SSL
- Nginx config mẫu:
```nginx
server {
    listen 443 ssl;
    server_name api.locherbal.com;

    ssl_certificate /etc/letsencrypt/live/api.locherbal.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.locherbal.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 3. CORS
Trong `main.ts` đã cấu hình CORS cho phép FRONTEND_URL. Kiểm tra:
- Chỉ cho phép domain frontend thật (không dùng wildcard)
- Chỉ cho phép methods: GET, POST, PATCH, DELETE
- Credentials: true (nếu dùng cookie refresh token)

## 4. Database backup strategy
- **Tự động hằng ngày (03:00 UTC)**: GitHub Actions workflow `.github/workflows/db-backup.yml` — `pg_dump` staging DB lên GitHub artifact (giữ 30 ngày); chạy tay qua `workflow_dispatch`.
- **Hàng ngày**: `pg_dump` full database, giữ 7 ngày
- **Hàng tuần**: `pg_dump` + archive, giữ 4 tuần
- **Hàng tháng**: snapshot lưu trữ ngoài server (S3/Cloud Storage)
- Script backup mẫu:
```bash
#!/bin/bash
BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -p 6432 -U postgres ecommerce | gzip > "$BACKUP_DIR/ecommerce_$TIMESTAMP.sql.gz"
# Xóa backup cũ hơn 7 ngày
find $BACKUP_DIR -name "ecommerce_*.sql.gz" -mtime +7 -delete
```

## 5. Build & Deploy
```bash
# Backend
cd LocProject
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
node dist/main.js  # dùng PM2 hoặc systemd

# Frontend
cd locproject-frontend
npm ci
npm run build
# Serve output .next bằng Node.js hoặc export static
```

## 6. Backfill / Seed script
- Dùng `npx prisma db seed` để chạy seed data
- Seed script hiện tại: `prisma/seed.ts`
- Chạy sau khi migrate lần đầu:
```bash
npx prisma db seed
```
## 7. Health check monitoring
- Endpoint `GET /health` — trả về `{ status: 'ok', timestamp }`
- Endpoint `GET /health/readiness` — kiểm tra DB kết nối (trả 503 khi DB down)
- **Tự động (GitHub Actions)**: `.github/workflows/uptime-check.yml` — ping backend `/health`, `/health/readiness` + frontend mỗi 10 phút; fail → GitHub notification.
- **Sản xuất**: cấu hình UptimeRobot / Better Stack ping `https://<domain>/health/readiness` mỗi 5 phút + email/SMS alert.
- Log backend là **JSON structured** (JsonLogger) + request log kèm `X-Request-Id` — parse được bởi log aggregator, truy vết theo requestId.

## 8. Security checklist
- [ ] JWT_SECRET 64+ ký tự random
- [ ] Helmet middleware enabled
- [ ] Rate limiting active (login 5/min, register 3/10min)
- [ ] Upload endpoint chỉ cho admin/staff
- [ ] Refresh token httpOnly cookie
- [ ] CORS whitelist production frontend
- [ ] SQL injection protection (Prisma prepared statements)
- [ ] Validate tất cả input với class-validator + whitelist: true
