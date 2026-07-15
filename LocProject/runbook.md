# Operations Runbook: Database & Migrations

Tài liệu hướng dẫn xử lý sự cố hạ tầng Database và quy trình rollback database migration cho dự án E-commerce.

---

## 1. Khi Database Down thì làm gì?

Khi hệ thống giám sát cảnh báo Database Down hoặc ứng dụng báo lỗi kết nối liên tục (`ETIMEDOUT`, `Connection refused`), thực hiện các bước sau:

### Bước 1: Xác định phạm vi ảnh hưởng (Triage)
Chạy các lệnh kiểm tra trạng thái local (hoặc kiểm tra Azure Portal / Azure Monitor đối với môi trường Cloud):
```bash
# Kiểm tra trạng thái các container hạ tầng
docker compose ps
```
Xác định container nào đang gặp lỗi: `pgbouncer`, `postgres-primary`, hay `postgres-replica`.

### Bước 2: Xem Logs để tìm nguyên nhân gốc rễ
```bash
# Xem log của database primary
docker compose logs postgres-primary --tail=100

# Xem log của connection pooler
docker compose logs pgbouncer --tail=100
```
*Các lỗi thường gặp:*
- **Out of Memory (OOM)**: Kernel kill tiến trình Postgres do thiếu RAM.
- **Disk Full**: Hết dung lượng đĩa cứng lưu trữ dữ liệu hoặc WAL.
- **Connection Exhaustion**: Quá nhiều connection trực tiếp hoặc PgBouncer bị quá tải.

### Bước 3: Quy trình khắc phục khẩn cấp

#### Kịch bản A: Lỗi PgBouncer Down
Nếu Postgres vẫn sống nhưng PgBouncer bị sập:
1. Restart lại PgBouncer container:
   ```bash
   docker compose restart pgbouncer
   ```
2. Nếu lỗi do cạn kiệt kết nối từ ứng dụng đến PgBouncer: tăng biến môi trường `PGBOUNCER_MAX_CLIENT_CONN` trong file `docker-compose.yml` rồi update lại service.

#### Kịch bản B: Lỗi Postgres Primary Down (Crash phần cứng/hệ thống)
1. **Trên Cloud (Production)**:
   - Azure Database for PostgreSQL Flexible Server tích hợp sẵn **High Availability (HA)**. Hệ thống sẽ tự động chuyển mạch (Failover) sang Standby Node ở Availability Zone khác.
   - Client qua DNS endpoint chung sẽ tự động kết nối lại sau 60-120 giây. Bạn không cần can thiệp thủ công.
2. **Local / Thủ công (Failover sang Replica)**:
   Nếu cần thăng chức cho Replica lên làm Primary:
   - Truy cập vào container `postgres-replica`:
     ```bash
     docker exec -it postgres-replica gosu postgres pg_ctl promote -D /bitnami/postgresql/data
     ```
   - Cập nhật cấu hình PgBouncer (`POSTGRESQL_HOST`) trỏ sang IP/host của Replica mới (bây giờ là Primary).
   - Khởi động lại PgBouncer: `docker compose restart pgbouncer`.

#### Kịch bản C: Dữ liệu bị lỗi/hỏng hoàn toàn
Nếu database bị lỗi logic hoặc hỏng dữ liệu vật lý không thể tự phục hồi:
1. Khôi phục từ snapshot tự động gần nhất trên Cloud.
2. Áp dụng Point-in-Time Recovery (PITR) để replay lại các thay đổi đến thời điểm sát nhất trước khi xảy ra sự cố.

---

## 2. Khi cần Rollback Migration thì làm gì?

Khi deploy một phiên bản ứng dụng mới chứa migration bị lỗi (ví dụ: lỗi cú pháp SQL, lock bảng quá lâu gây tắc nghẽn, hoặc làm mất mát dữ liệu ngoài ý muốn), thực hiện quy trình rollback sau:

> [!WARNING]
> Tuyệt đối không thay đổi trực tiếp cấu trúc bảng trên Production bằng tool UI (DBeaver, pgAdmin) mà không ghi nhận lại, việc này sẽ làm lệch trạng thái schema so với Prisma schema trong source code.

### Quy trình Rollback an toàn bằng Prisma:

#### Bước 1: Viết script SQL Rollback thủ công
Prisma không tự động tạo file rollback (down-migration). Bạn cần tự thiết kế script rollback dựa trên migration lỗi:
1. Đọc file migration bị lỗi tại: `prisma/migrations/<folder-migration-loi>/migration.sql`.
2. Tạo một script SQL hoàn tác (ví dụ: `rollback.sql`):
   ```sql
   -- Ví dụ: Nếu migration lỗi là ADD COLUMN status
   ALTER TABLE "Order" DROP COLUMN "status";
   ```

#### Bước 2: Thực thi script Rollback trực tiếp vào Database Primary
Kết nối trực tiếp tới cổng Postgres Primary (`port 5434` hoặc endpoint direct trên cloud), **không đi qua cổng PgBouncer (6432)** vì các câu lệnh thay đổi schema (DDL) cần session-lock và có thể bị PgBouncer transaction mode từ chối/gây lỗi:
```bash
# Chạy script rollback thủ công (sử dụng psql hoặc client DB yêu thích)
psql -h localhost -p 5434 -U postgres -d ecommerce -f rollback.sql
```

#### Bước 3: Đánh dấu Rollback thành công với Prisma
Prisma theo dõi lịch sử migration trong bảng nội bộ `_prisma_migrations`. Bạn cần báo cho Prisma biết migration lỗi kia đã được rollback thủ công để nó không báo lỗi lệch schema ở lần deploy kế tiếp:
```bash
npx prisma migrate resolve --rolled-back "<tên-thư-mục-migration-bị-lỗi>"
# Ví dụ: npx prisma migrate resolve --rolled-back "20260713000000_add_status"
```

#### Bước 4: Rollback Source Code & Schema file
1. Checkout source code ứng dụng về commit ổn định gần nhất trước khi deploy lỗi:
   ```bash
   git checkout <stable-commit-hash>
   ```
2. Đồng bộ hóa lại tệp `schema.prisma` khớp với thực tế database.
3. Deploy/Restart lại ứng dụng.

---

## 3. Quy trình di chuyển dữ liệu không gây gián đoạn (Zero-Downtime Migration - Expand-Contract Pattern)

Khi chỉnh sửa cấu trúc bảng lớn có lưu lượng truy cập cao (ví dụ: đổi tên cột, đổi kiểu dữ liệu, tách bảng), tuyệt đối không dùng câu lệnh `ALTER TABLE` trực tiếp trên cột đang sử dụng vì nó sẽ gây khóa bảng (exclusive table lock), nghẽn luồng checkout và dẫn đến downtime. 

Áp dụng quy trình **Expand-Contract (Nở ra - Co lại)** theo 3 giai đoạn độc lập:

### Giai đoạn 1: Expand (Mở rộng cơ sở dữ liệu)
1. **Database Migration**: Tạo cột mới với tên mới (`column_new`) song song với cột cũ (`column_old`). Cột mới cho phép nhận giá trị `NULL` hoặc có default value tạm thời.
2. **Cấu trúc Code**: Cập nhật mã nguồn ứng dụng để:
   * **Đọc**: Vẫn đọc dữ liệu chính từ cột cũ (`column_old`).
   * **Ghi**: Ghi đồng thời dữ liệu mới vào **cả 2 cột** (`column_old` và `column_new`) ở tất cả các hàm Insert/Update.
3. **Deploy**: Deploy phiên bản ứng dụng này lên hệ thống. Hiện tại, cả hai cột đều được ghi nhận dữ liệu mới song song.

### Giai đoạn 2: Backfill (Đồng bộ dữ liệu lịch sử)
1. **Chạy Tool Đồng Bộ**: Viết script hoặc chạy một worker nền (BullMQ) để quét và copy toàn bộ dữ liệu lịch sử từ `column_old` sang `column_new`.
2. **Quy tắc Backfill**: 
   * Chia nhỏ dữ liệu thành các batch nhỏ (ví dụ: 1000 hàng mỗi lượt).
   * Thêm thời gian nghỉ (delay) giữa các batch để tránh CPU database chạm ngưỡng 100%.
   * Check tính nhất quán (Checksum/Count) sau khi hoàn tất.

### Giai đoạn 3: Contract (Co lại & Thu dọn)
1. **Cấu trúc Code**: Cập nhật mã nguồn ứng dụng để:
   * **Đọc**: Chuyển hoàn toàn sang đọc từ cột mới (`column_new`).
   * **Ghi**: Chỉ ghi vào cột mới (`column_new`). Bỏ hoàn toàn luồng ghi vào cột cũ.
2. **Deploy**: Deploy phiên bản ứng dụng này lên. Lúc này cột cũ (`column_old`) đã hoàn toàn không còn sử dụng.
3. **Database Migration (Clean Up)**: Tạo một database migration cuối cùng để:
   * Drop cột cũ (`column_old`).
   * Set thuộc tính `NOT NULL` (nếu cần) cho cột mới (`column_new`).
   * Thực thi migration này trên database.

