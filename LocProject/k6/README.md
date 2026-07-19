# k6 Load Tests — LocHerbal

## Cài đặt k6

### Windows (winget)
```powershell
winget install k6 --source winget
```

### Windows (Chocolatey)
```powershell
choco install k6
```

### Verify installation
```powershell
k6 version
```

## Cấu trúc thư mục
```
LOCPROJECT/
  k6/
    helpers/
      auth.js        ← Helper login lấy token
      data.js        ← Test data (variantId, addressId thật từ DB)
    scenarios/
      01-catalog-load.js      ← GET /products, /categories (500 VUs)
      02-checkout-stress.js   ← Luồng mua hàng đầu cuối (100 VUs)
      03-auth-burst.js        ← POST /auth/login đồng thời (50 VUs)
    README.md
```

## Yêu cầu trước khi chạy

1. **Backend đang chạy:**
   ```powershell
   cd LOCPROJECT
   npm run start:dev
   ```

2. **Docker containers up:**
   ```powershell
   docker compose up -d
   ```

3. **DB có data test:** Kiểm tra `helpers/data.js` có `variantId`, `addressId` thật từ DB.
   Lấy bằng:
   ```powershell
   docker exec -e PGPASSWORD=postgres_password postgres-primary psql -U postgres -d ecommerce -c "
   SELECT id FROM product_variants WHERE sku = 'TEST-001' LIMIT 1;
   SELECT id FROM customer_addresses WHERE customer_id = '120c1b05-8079-4518-b421-70e11bf5b6c5' LIMIT 1;
   "
   ```
   Sau đó cập nhật `helpers/data.js`.

## Chạy từng scenario

### 1. Catalog Load (500 VUs)
```powershell
k6 run k6/scenarios/01-catalog-load.js
```
- **Threshold:** p95 < 300ms, error rate < 1%
- Test: GET /categories, GET /products, GET /products/:slug

### 2. Checkout Stress (100 VUs) — **QUAN TRỌNG NHẤT**
```powershell
k6 run k6/scenarios/02-checkout-stress.js
```
- **Threshold:** p95 < 500ms, error rate < 5% (cho phép fail do hết stock)
- Test: POST /cart/items → POST /cart/checkout (COD)

### 3. Auth Burst (50 VUs)
```powershell
k6 run k6/scenarios/03-auth-burst.js
```
- **Threshold:** p95 < 200ms, error rate < 1%
- Test: POST /auth/login đồng thời (chống brute force)

## Chạy tất cả cùng lúc (parallel)
```powershell
# Terminal 1
k6 run k6/scenarios/01-catalog-load.js

# Terminal 2
k6 run k6/scenarios/02-checkout-stress.js

# Terminal 3
k6 run k6/scenarios/03-auth-burst.js
```

## Đọc kết quả

### PASS ✅
```
✓ catalog_latency       p(95)  156ms  (threshold: p(95)<300)
✓ catalog_errors        rate   0.00%  (threshold: rate<0.01)
```

### FAIL ❌ — Cần tối ưu
```
✗ catalog_latency       p(95)  542ms  (threshold: p(95)<300)  → Nginx/Redis cache, DB index
✗ checkout_errors       rate   8.2%   (threshold: rate<0.05)  → Hết tồn kho, race condition
```

### Lưu ý về checkout error rate
- Error rate 5% là **CHO PHÉP** vì: race condition allocate stock, thiếu tồn kho thực
- Nếu error rate > 10%: check logs `inventory.allocation.failed` event, xem stockItem

## Output JSON (cho CI/CD)
```powershell
k6 run --out json=results.json k6/scenarios/02-checkout-stress.js
```

## Tùy chỉnh VUs / Duration
Sửa `stages` trong từng file scenario:
```js
export const options = {
  stages: [
    { duration: '30s', target: 200 },  // ramp up
    { duration: '2m',  target: 1000 }, // hold
    { duration: '30s', target: 0 },    // ramp down
  ],
}
```

## Debug single VU
```powershell
k6 run --vus 1 --iterations 1 k6/scenarios/02-checkout-stress.js
```

## Mẹo
- Dùng `--quiet` để giảm log: `k6 run --quiet k6/scenarios/01-catalog-load.js`
- Xem summary cuối cùng: tìm dòng `thresholds:` trong output