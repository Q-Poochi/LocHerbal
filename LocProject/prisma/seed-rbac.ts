import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// ===== PERMISSIONS & ROLES SEED =====
// Danh sách chuẩn 55 codes — PHẢI KHỚP migration 20260824034154_add_permissions_and_roles
const PERMISSIONS = [
  // Core
  { code: 'auth:me', description: 'Lấy profile của chính mình' },
  { code: 'auth:profile:write', description: 'Cập nhật profile cá nhân' },
  { code: 'auth:password:write', description: 'Đổi mật khẩu' },
  { code: 'auth:refresh', description: 'Refresh access token' },
  { code: 'auth:logout', description: 'Đăng xuất' },

  // Catalog
  { code: 'categories:read', description: 'Xem danh mục' },
  { code: 'categories:write', description: 'Tạo/sửa/xoá danh mục' },
  { code: 'categories:manage-attributes', description: 'Quản lý thuộc tính danh mục' },
  { code: 'products:read', description: 'Xem sản phẩm' },
  { code: 'products:write', description: 'Tạo/sửa/xoá sản phẩm' },
  { code: 'products:manage-attributes', description: 'Quản lý thuộc tính sản phẩm' },
  { code: 'reviews:read', description: 'Xem đánh giá' },
  { code: 'reviews:write', description: 'Tạo/sửa/xoá đánh giá (chủ sở hữu)' },
  { code: 'media:write', description: 'Upload ảnh sản phẩm' },

  // Consultation
  { code: 'consultations:read', description: 'Xem yêu cầu tư vấn' },
  { code: 'consultations:write', description: 'Gửi/tạo yêu cầu tư vấn' },
  { code: 'consultations:manage-status', description: 'Cập nhật trạng thái/gán phụ trách tư vấn' },

  // Marketing
  { code: 'marketing:read', description: 'Xem banner/blog/coupon/page-block' },
  { code: 'marketing:write', description: 'CRUD banner/blog/coupon/hero/page-block' },
  { code: 'marketing:hero-banner:read', description: 'Xem hero banner (public)' },
  { code: 'marketing:hero-banner:write', description: 'Quản lý hero banner' },
  { code: 'marketing:pages:read', description: 'Xem page blocks' },
  { code: 'marketing:pages:write', description: 'Quản lý page blocks' },
  { code: 'marketing:coupons:read', description: 'Xem mã giảm giá (public)' },

  // Sales
  { code: 'customers:read', description: 'Xem khách hàng' },
  { code: 'addresses:read', description: 'Xem địa chỉ' },
  { code: 'addresses:write', description: 'Tạo/sửa/xoá địa chỉ' },
  { code: 'orders:read', description: 'Xem đơn hàng' },
  { code: 'orders:write', description: 'Tạo đơn hàng' },
  { code: 'orders:manage-status', description: 'Cập nhật trạng thái đơn hàng' },
  { code: 'orders:export', description: 'Xuất đơn hàng CSV' },
  { code: 'payment:read', description: 'Xem thanh toán' },
  { code: 'wishlist:read', description: 'Xem wishlist' },
  { code: 'wishlist:write', description: 'Quản lý wishlist' },
  { code: 'cart:read', description: 'Xem giỏ hàng' },
  { code: 'cart:write', description: 'Quản lý giỏ hàng' },

  // Settings
  { code: 'settings:read', description: 'Xem cài đặt công ty' },
  { code: 'settings:write', description: 'Cập nhật cài đặt công ty' },

  // Shipping
  { code: 'shipping:carriers:read', description: 'Xem hãng vận chuyển' },
  { code: 'shipping:carriers:write', description: 'Quản lý hãng vận chuyển' },
  { code: 'shipping:shipments:read', description: 'Xem shipment' },
  { code: 'shipping:shipments:write', description: 'Tạo/sửa shipment' },
  { code: 'shipping:shipments:manage-status', description: 'Cập nhật trạng thái shipment' },

  // Warehouse
  { code: 'warehouse:read', description: 'Xem tồn kho' },
  { code: 'warehouse:write', description: 'Điều chỉnh tồn kho' },

  // Support
  { code: 'support:read', description: 'Xem ticket hỗ trợ' },
  { code: 'support:write', description: 'Tạo ticket (public)' },
  { code: 'support:manage-status', description: 'Cập nhật trạng thái/gán phụ trách ticket' },

  // Accounting
  { code: 'accounting:read', description: 'Xem báo cáo kế toán' },

  // Admin
  { code: 'dashboard:read', description: 'Xem dashboard admin' },

  // Supplier
  { code: 'suppliers:read', description: 'Xem nhà cung cấp' },
  { code: 'suppliers:write', description: 'Quản lý nhà cung cấp' },
  { code: 'purchase-orders:read', description: 'Xem phiếu nhập' },
  { code: 'purchase-orders:write', description: 'Tạo/sửa phiếu nhập' },
  { code: 'purchase-orders:manage-status', description: 'Cập nhật trạng thái PO' },
] as const;

const ROLE_PERMISSIONS = {
  admin: 'all', // special marker
  staff: [
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
    'support:manage-status',
  ],
  cskh: [
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
    'consultations:read',
  ],
} as const;

async function main() {
  console.log('🔐 Seeding permissions & roles...')

  // 1. Upsert all permissions
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: { description: p.description },
      create: { code: p.code, description: p.description },
    })
  }
  console.log(`  ✅ Permissions: ${PERMISSIONS.length} records`)

  // 2. Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: { description: 'Quản trị viên toàn hệ thống' },
    create: { name: 'admin', description: 'Quản trị viên toàn hệ thống' },
  })

  const staffRole = await prisma.role.upsert({
    where: { name: 'staff' },
    update: { description: 'Nhân viên kho/vận hành' },
    create: { name: 'staff', description: 'Nhân viên kho/vận hành' },
  })

  const cskhRole = await prisma.role.upsert({
    where: { name: 'cskh' },
    update: { description: 'Chăm sóc khách hàng' },
    create: { name: 'cskh', description: 'Chăm sóc khách hàng' },
  })

  // 3. Assign permissions to roles
  // Admin = all permissions
  const allPermissions = await prisma.permission.findMany({ select: { id: true } })
  await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } })
  console.log(`  Assigning ${allPermissions.length} permissions to admin role...`)
  for (const p of allPermissions) {
    const result = await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: p.id }
    })
    console.log(`  Upserted: role=${adminRole.id}, perm=${p.id} ->`, result)
  }

  // Staff permissions
  await prisma.rolePermission.deleteMany({ where: { roleId: staffRole.id } })
  for (const code of ROLE_PERMISSIONS.staff) {
    const perm = await prisma.permission.findUnique({ where: { code } })
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: staffRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: staffRole.id, permissionId: perm.id }
      })
    }
  }

  // CSKH permissions
  await prisma.rolePermission.deleteMany({ where: { roleId: cskhRole.id } })
  for (const code of ROLE_PERMISSIONS.cskh) {
    const perm = await prisma.permission.findUnique({ where: { code } })
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: cskhRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: cskhRole.id, permissionId: perm.id }
      })
    }
  }

  console.log('  ✅ Roles & permissions assigned')
  console.log('  ✅ Admin role: ALL permissions')
  console.log(`  ✅ Staff role: ${ROLE_PERMISSIONS.staff.length} permissions`)
  console.log(`  ✅ CSKH role: ${ROLE_PERMISSIONS.cskh.length} permissions`)

  console.log('✅ Seed permissions & roles hoàn tất')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())