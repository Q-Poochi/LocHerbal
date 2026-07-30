# Triển khai LocHerbal — Checklist sản xuất

## 1. Environment variables (.env production)
| Variable | Mô tả | Bắt buộc |
|----------|-------|----------|
| `DATABASE_URL` | PostgreSQL connection string (nên dùng PgBouncer) | ✓ |
| `JWT_SECRET` | Secret key cho JWT (>= 32 ký tự ngẫu nhiên) | ✓ |
| `JWT_REFRESH_SECRET` | Secret key cho Refresh Token (>= 32 ký tự) | ✓ |
| `PORT` | Cổng backend (mặc định 4000) | |
| `NODE_ENV` | `production` | ✓ |
| `FRONTEND_URL` | URL frontend (VD: `https://locherbal.com`) | ✓ |
| `UPLOAD_DIR` | Thư mục lưu file upload (mặc định `./uploads`) | |
| `UPLOAD_MAX_FILE_SIZE` | Dung lượng tối đa (bytes, mặc định 5MB) | |
| `VNPAY_TMN_CODE` | Mã website VNPay | ✓ (nếu dùng VNPay) |
| `VNPAY_HASH_SECRET` | Secret key VNPay | ✓ (nếu dùng VNPay) |
| `VNPAY_URL` | URL VNPay sandbox/production | |
| `VNPAY_RETURN_URL` | URL return VNPay | |
| `REDIS_URL` | Redis connection string (nếu dùng cache) | |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Cấu hình email | |

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
- Endpoint `GET /health/readiness` — kiểm tra DB kết nối
- Nên cấu hình monitor (UptimeRobot / Better Stack) ping mỗi 5 phút

## 8. Security checklist
- [ ] JWT_SECRET 64+ ký tự random
- [ ] Helmet middleware enabled
- [ ] Rate limiting active (login 5/min, register 3/10min)
- [ ] Upload endpoint chỉ cho admin/staff
- [ ] Refresh token httpOnly cookie
- [ ] CORS whitelist production frontend
- [ ] SQL injection protection (Prisma prepared statements)
- [ ] Validate tất cả input với class-validator + whitelist: true
