# PERMISSION_TAXONOMY.md — Permission taxonomy & Rôles par défaut (Giai đoạn 0)

> **Trạng thái**: Giai đoạn 0 — thiết kế chỉ (text, chưa code). Đưa chủ dự án duyệt avant de commencer Giai đoạn 1 (migration @Roles → permissions).

<!-- TOC placeholder -->

## 1. Convention permission code

Format : **`<module>:<action>`**

Actions standardisées :
| Action | Significat |
|---|---|
| `read` | Lecture / liste / chi tiết (GET) |
| `write` | Création / modification / supprimer (POST/PATCH/PUT/DELETE) |
| `manage-status` | Transition trạng thái spécifique (order status, ticket status, PO status…) |

---

## 2. Liste des permissions par controller

### 2.1 Core / Auth
> Géré par rôle JWT/ownership, pas de `@Roles()`. Pas de permission code requis pour : `/auth/me`, `/auth/profile`, `/auth/change-password`.

### 2.2 Catalog
 
 | Controller | Endpoint | Method | Roles actuels | Permission |
 |---|---|---|---|
 | ProductController | `POST /products` | POST | admin | `products:write` |
 | ProductController | `PUT /products/:id` | PUT | admin | `products:write` |
 | ProductController | `DELETE /products/:id` | DELETE | admin | `products:write` |
 | ProductController | `POST /products/:id/attributes` | POST | admin | `products:write` |
 | ProductController | `DELETE /products/:id/attributes/:attributeId` | DELETE | admin | `products:write` |
 | CategoryController | `POST /categories` | POST | admin | `categories:write` |
 | CategoryController | `PUT /categories/:id` | PUT | admin | `categories:write` |
 | CategoryController | `DELETE /categories/:id` | DELETE | admin | `categories:write` |
 | CategoryController | `POST /categories/:id/attributes` | POST | admin | `categories:write` |
 | CategoryController | `DELETE /categories/:id/attributes/:attributeId` | DELETE | admin | `categories:write` |
 | UploadController | `POST /upload` | POST | admin, staff | `media:write` |

### 2.3 Catalog — review (public + customer)

| Controller | Endpoint | Method | Roles actuels | Permission |
|---|---|---|---|
| ReviewController | `GET /reviews/:productId` | GET | public | `products:read` |
| ReviewController | `POST /reviews/:productId` | POST | customer (JWT) | (propriété) |
| ReviewController | `PATCH /reviews/:id` | PATCH | customer (JWT) | (propriété) |
| ReviewController | `DELETE /reviews/:id` | DELETE | customer (JWT) | (propriété) |

### 2.4 Sales — Cart / Order / Payment / Wishlist

| Controller | Endpoint | Method | Roles actuels | Permission |
|---|---|---|---|
| AdminOrderController | `GET /admin/orders` | GET | admin, staff | `orders:read` |
| AdminOrderController | `GET /admin/orders/:id` | GET | admin, staff | `orders:read` |
| AdminOrderController | `PATCH /admin/orders/:id/status` | PATCH | admin, staff | `orders:manage-status` |
| OrderController | `GET /orders/export/csv` | GET | admin, staff | `orders:export` |
| AdminCustomerController | `GET /admin/customers` | GET | admin, staff | `customers:read` |
| AdminCustomerController | `GET /admin/customers/:id` | GET | admin, staff | `customers:read` |
| CartController | `GET /cart`, `POST /cart/items`, `PATCH/DELETE items` | — | public/guest | (public) |
| CartController | `POST /cart/checkout` | POST | customer (JWT) | (propriété) |
| OrderController | `GET /orders`, `GET /orders/:id`, `POST /orders/:id/cancel` | — | customer (JWT) | (propriété) |
| PaymentController | `GET /payment/vnpay-url` | GET | customer (JWT) | (propriété) |
| PaymentController | `GET /payment/vnpay-ipn`, `GET /payment/vnpay-return` | GET | public | (webhook) |
| WishlistController | `GET/POST /wishlist`, `DELETE /wishlist/:productVariantId` | — | customer (JWT) | (propriété) |
| CustomerController | `/customers/addresses` (CRUD) | — | customer (JWT) | (propriété) |
| AddressController | `/customers/addresses` (CRUD) | — | customer (JWT) | (propriété) |

### 2.5 Admin — Dashboard

| Controller | Endpoint | Method | Roles actuels | Permission |
|---|---|---|---|
| DashboardController | `GET /admin/dashboard/stats` | GET | admin, staff | `dashboard:read` |
| DashboardController | `GET /admin/dashboard/revenue-by-day` | GET | admin, staff | `dashboard:read` |
| DashboardController | `GET /admin/dashboard/top-products` | GET | admin, staff | `dashboard:read` |

### 2.6 Warehouse

| Controller | Endpoint | Method | Roles actuels | Permission |
|---|---|---|---|
| AdminWarehouseController | `GET /admin/warehouse/stock` | GET | admin, staff | `warehouse:read` |

### 2.7 Shipping

| Controller | Endpoint | Method | Roles actuels | Permission |
|---|---|---|---|
| CarrierController | `GET /api/v1/shipping/carriers` + `/:id` | GET | public | `shipping:read` |
| CarrierController | `POST /api/v1/shipping/carriers` | POST | admin, staff | `shipping:write` |
| CarrierController | `PATCH /:id` / `DELETE /:id` | PATCH/DELETE | admin, staff | `shipping:write` |
| ShipmentController | `GET /orders/:orderId` | GET | owner (JWT) | (propriété) |
| ShipmentController | `POST /api/v1/shipping/shipments` | POST | admin, staff | `shipping:write` |
| ShipmentController | `PATCH /:id/status`, `POST /:id/tracking` | PATCH/POST | admin, staff | `shipping:write` |
| CarrierWebhookController | `POST /webhooks/ghn`, `POST /webhooks/ghtk` | POST | public | (webhook) |

### 2.8 Supplier

| Controller | Endpoint | Method | Roles actuels | Permission |
|---|---|---|---|
| SupplierController | `GET /supplier`, `GET /supplier/:id` | GET | admin, staff | `supplier:read` |
| SupplierController | `POST /supplier`, `PATCH /:id`, `DELETE /:id` | — | admin, staff | `supplier:write` |
| PurchaseOrderController | `GET /supplier/purchase-orders` + `/:id` | GET | admin, staff | `supplier:read` |
| PurchaseOrderController | `POST`, `PATCH /:id/status`, `POST /:id/receive`, `POST /:id/cancel` | — | admin, staff | `supplier:write` |
### 2.9 Support (module nouveau)

| Controller | Endpoint | Method | Roles actuels | Permission |
|---|---|---|---|
| SupportController | `POST /support/tickets` | POST | public | (ticket création par client) |
| SupportController | `GET /support/admin/tickets` | GET | admin, staff | `support:read` |
| SupportController | `GET /support/admin/tickets/:id` | GET | admin, staff | `support:read` |
| SupportController | `PATCH /support/admin/tickets/:id` | PATCH | admin, staff | `support:manage-status` |

### 2.10 Marketing
 
 | Controller | Endpoint | Method | Roles actuels | Permission |
 |---|---|---|---|
 | BannerController | `GET /marketing/banners`, `GET /:id` | GET | admin, staff | `marketing:read` |
 | BannerController | `POST /marketing/banners` | POST | admin | `marketing:write` |
 | BannerController | `PATCH /:id`, `DELETE /:id` | PATCH/DELETE | admin | `marketing:write` |
 | HeroBannerController *(fichier hero-banner.controller.ts)* | `GET /hero-banner` (public) → `marketing:hero-banner:read` ; `PUT /admin/hero-banner`, `DELETE /admin/hero-banner` (admin, staff) → `marketing:hero-banner:write` | GET/PUT/DELETE | public (GET) ; admin, staff (PUT/DELETE) | `marketing:hero-banner:read` / `marketing:hero-banner:write` |
 | BlogPostController | `GET /marketing/blog-posts`, `GET /:id`, `GET /slug/:slug` | GET | admin, staff | `marketing:read` |
 | BlogPostController | `POST`, `PATCH /:id`, `DELETE /:id` | — | admin | `marketing:write` |
 | CouponController | `GET /marketing/coupons`, `GET /:id`, `POST /validate` | — | admin, staff | `marketing:read` |
 | CouponController | `POST`, `PATCH /:id`, `DELETE /:id` | — | admin | `marketing:write` |
 | PageBlockController | `GET /pages/:pageSlug/blocks` | GET | public | `marketing:pages:read` |
 | PageBlockController | `GET /admin/pages/:pageSlug/blocks` | GET | admin | `marketing:pages:write` |
 | AdminPageBlockController | `POST`, `PATCH /reorder`, `PATCH /:id`, `DELETE /:id` | — | admin | `marketing:pages:write` |
 | PublicMarketingController | `GET /public/marketing/*` | GET | public | `marketing:read` |

### 2.11 Consultation

| Controller | Endpoint | Method | Roles actuels | Permission |
|---|---|---|---|
| ConsultationController | `GET /consultations/slots`, `POST /consultations` | GET/POST | public | (public) |
| ConsultationController | `GET /consultations`, `GET /consultations/:id` | GET | admin, staff | `consultation:read` |
| ConsultationController | `PATCH /consultations/:id/status` | PATCH | admin, staff | `consultation:manage-status` |
| ConsultationController | `PATCH /consultations/:id/assign` | PATCH | admin | `consultation:write` |

### 2.12 Settings

| Controller | Endpoint | Method | Roles actuels | Permission |
|---|---|---|---|
| CompanySettingsController | `GET /settings/company` | GET | public | (public info) |
| CompanySettingsController | `GET /settings/company/admin`, `PATCH /settings/company` | GET/PATCH | admin | `settings:read`, `settings:write` |

### 2.13 Accounting

| Controller | Endpoint | Method | Roles actuels | Permission |
|---|---|---|---|
| AccountingController | `GET /accounting/*` | GET | admin | `accounting:read` |

---

## 3. Rôles par défaut

### 👑 Administrateur
- **Permissions**: toutes (joker `*`).
- **Voir**: Dashboard, produits (CRUD+EAV), catégories, upload, commandes (read+status+export), clients, marketing (banner/blog/coupon/hero/page-builder), warehouse, shipping, supplier+PO, support (read+write+status), consultation, settings, accounting.

### 👷 Staff (kho/vận hành) — hérite des droits actuels
 Objectif : ne **perdre aucun droit** actuel lors de la migration. AujȮurd'hui staff a (via `@Roles('admin','staff')`) :
 - `dashboard:read`, `orders:read`, `orders:export`, `orders:manage-status`, `customers:read`
 - `warehouse:read`, `shipping:read`, `shipping:write`, `supplier:read`, `supplier:write`
 - `marketing:read`, `media:write`, `consultation:read`, `consultation:manage-status`
 - `support:read`, `support:manage-status`
 
 > ⚠️ **Important**: aujȮurd'hui `PATCH /admin/orders/:id/status` est `@Roles('admin','staff')` → staff a DÉJÀ le droit de changer le statut commande. Ne pas le retirer (perte de droit).
 > Staff n'a PAS aujȮurd'hui : écriture produits/catégories, coupon/blog/banner CRUD, `consultation:assign`, settings, accounting. Ne pas les ajouter par inadvertance.

### 🎗️ CSKH (nouveau)
 - `support:read`, `support:write`, `support:manage-status`
 - `orders:read` — LECTURE SEULE des commandes (pour consulter les commandes du client)
 - `customers:read` — voir les clients
 - `products:read`, `categories:read` — voir les produits/catégories
 - `shipping:shipments:read` — suivre les envois (shipment)
 - `addresses:read` — voir les adresses du client
 - `reviews:read` — voir les avis
 - `payments:read` — xem thông tin thanh toán
 - `wishlist:read` — xem danh sách yêu thích
 - `cart:read` — xem giỏ hàng
 - `consultation:read` — xem lịch sử tư vấn
 - **N'a PAS** (non nécessaire pour le support ticket) : `orders:manage-status`, `orders:export`, `accounting:read`, `products:write`, `categories:write`, `marketing:write`, `settings:write`, `supplier:write`, `purchase-orders:write`, `warehouse:write`, `shipping:write`, `shipping:carriers:write`

---

## 4. Suggestions de migration (Giai đoạn 1)
1. Créer tables `permissions` (code, desc) + `role_permissions`.
2. Seed codes ci-dessus.
3. Associer aux rôles admin (tous), staff, CSKH.
4. Remplacer `@Roles(...)` par vérification via permission (décodeur `@Permission('module:action')`).
5. Mise à jour docs + schema.

> ✅ Fichier prêt — **validé et héritier des droits actuels du staff**. Passez au Giai đoạn 1 après approbation.