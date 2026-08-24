-- Migration: Add permissions and roles (RBAC Giai đoạn 1)
-- Idempotent: ON CONFLICT DO NOTHING — an toàn chạy lại, khớp seed-rbac.ts

-- 1. Permissions (55 codes — danh sách chuẩn, đã dedupe)
-- Lưu ý: @default(uuid()) của Prisma là client-side → phải tự sinh id bằng gen_random_uuid()
INSERT INTO "permissions" ("id", "code", "description")
SELECT gen_random_uuid()::text, code, description FROM (VALUES
  ('auth:me', 'Lấy profile của chính mình'),
  ('auth:profile:write', 'Cập nhật profile cá nhân'),
  ('auth:password:write', 'Đổi mật khẩu'),
  ('auth:refresh', 'Refresh access token'),
  ('auth:logout', 'Đăng xuất'),
  ('categories:read', 'Xem danh mục'),
  ('categories:write', 'Tạo/sửa/xoá danh mục'),
  ('categories:manage-attributes', 'Quản lý thuộc tính danh mục'),
  ('products:read', 'Xem sản phẩm'),
  ('products:write', 'Tạo/sửa/xoá sản phẩm'),
  ('products:manage-attributes', 'Quản lý thuộc tính sản phẩm'),
  ('reviews:read', 'Xem đánh giá'),
  ('reviews:write', 'Tạo/sửa/xoá đánh giá (chủ sở hữu)'),
  ('media:write', 'Upload ảnh sản phẩm'),
  ('consultations:read', 'Xem yêu cầu tư vấn'),
  ('consultations:write', 'Gửi/tạo yêu cầu tư vấn'),
  ('consultations:manage-status', 'Cập nhật trạng thái/gán phụ trách tư vấn'),
  ('marketing:read', 'Xem banner/blog/coupon/page-block'),
  ('marketing:write', 'CRUD banner/blog/coupon/hero/page-block'),
  ('marketing:hero-banner:read', 'Xem hero banner (public)'),
  ('marketing:hero-banner:write', 'Quản lý hero banner'),
  ('marketing:pages:read', 'Xem page blocks'),
  ('marketing:pages:write', 'Quản lý page blocks'),
  ('marketing:coupons:read', 'Xem mã giảm giá (public)'),
  ('customers:read', 'Xem khách hàng'),
  ('addresses:read', 'Xem địa chỉ'),
  ('addresses:write', 'Tạo/sửa/xoá địa chỉ'),
  ('orders:read', 'Xem đơn hàng'),
  ('orders:write', 'Tạo đơn hàng'),
  ('orders:manage-status', 'Cập nhật trạng thái đơn hàng'),
  ('orders:export', 'Xuất đơn hàng CSV'),
  ('payment:read', 'Xem thanh toán'),
  ('wishlist:read', 'Xem wishlist'),
  ('wishlist:write', 'Quản lý wishlist'),
  ('cart:read', 'Xem giỏ hàng'),
  ('cart:write', 'Quản lý giỏ hàng'),
  ('settings:read', 'Xem cài đặt công ty'),
  ('settings:write', 'Cập nhật cài đặt công ty'),
  ('shipping:carriers:read', 'Xem hãng vận chuyển'),
  ('shipping:carriers:write', 'Quản lý hãng vận chuyển'),
  ('shipping:shipments:read', 'Xem shipment'),
  ('shipping:shipments:write', 'Tạo/sửa shipment'),
  ('shipping:shipments:manage-status', 'Cập nhật trạng thái shipment'),
  ('warehouse:read', 'Xem tồn kho'),
  ('warehouse:write', 'Điều chỉnh tồn kho'),
  ('support:read', 'Xem ticket hỗ trợ'),
  ('support:write', 'Tạo ticket (public)'),
  ('support:manage-status', 'Cập nhật trạng thái/gán phụ trách ticket'),
  ('accounting:read', 'Xem báo cáo kế toán'),
  ('dashboard:read', 'Xem dashboard admin'),
  ('suppliers:read', 'Xem nhà cung cấp'),
  ('suppliers:write', 'Quản lý nhà cung cấp'),
  ('purchase-orders:read', 'Xem phiếu nhập'),
  ('purchase-orders:write', 'Tạo/sửa phiếu nhập'),
  ('purchase-orders:manage-status', 'Cập nhật trạng thái PO')
) AS seed(code, description)
ON CONFLICT ("code") DO NOTHING;

-- 2. Roles
INSERT INTO "roles" ("id", "name", "description", "created_at")
SELECT gen_random_uuid()::text, name, description, NOW() FROM (VALUES
  ('admin', 'Quản trị viên toàn hệ thống'),
  ('staff', 'Nhân viên kho/vận hành'),
  ('cskh', 'Chăm sóc khách hàng')
) AS seed(name, description)
ON CONFLICT ("name") DO NOTHING;

-- 3. Dọn role rác (seed cũ tạo nhầm, 0 permissions)
DELETE FROM "role_permissions" WHERE "role_id" IN (SELECT "id" FROM "roles" WHERE "name" IN ('customer', 'CUSTOMER'));
DELETE FROM "user_roles"      WHERE "role_id" IN (SELECT "id" FROM "roles" WHERE "name" IN ('customer', 'CUSTOMER'));
DELETE FROM "roles"           WHERE "name" IN ('customer', 'CUSTOMER');

-- 4. Admin = TẤT CẢ permissions
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id" FROM "roles" r CROSS JOIN "permissions" p WHERE r."name" = 'admin'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

-- 5. Staff (dedupe, giữ nguyên quyền hiện tại qua @Roles('admin','staff'))
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id" FROM "roles" r JOIN "permissions" p ON p."code" IN (
    'dashboard:read',
    'orders:read',
    'orders:export',
    'orders:manage-status',
    'customers:read',
    'warehouse:read',
    'shipping:carriers:read',
    'shipping:carriers:write',
    'shipping:shipments:read',
    'shipping:shipments:write',
    'shipping:shipments:manage-status',
    'suppliers:read',
    'suppliers:write',
    'purchase-orders:read',
    'purchase-orders:write',
    'purchase-orders:manage-status',
    'marketing:read',
    'marketing:hero-banner:write',
    'marketing:pages:read',
    'media:write',
    'consultations:read',
    'consultations:manage-status',
    'support:read',
    'support:manage-status'
) WHERE r."name" = 'staff'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

-- 6. CSKH (12 quyền — theo PERMISSION_TAXONOMY.md)
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id" FROM "roles" r JOIN "permissions" p ON p."code" IN (
    'support:read',
    'support:write',
    'support:manage-status',
    'orders:read',
    'customers:read',
    'products:read',
    'categories:read',
    'shipping:shipments:read',
    'addresses:read',
    'reviews:read',
    'payment:read',
    'consultations:read'
) WHERE r."name" = 'cskh'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
