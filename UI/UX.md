# PROMPT REDESIGN UI/UX LOCHERBAL — ANTIGRAVITY
# Tham khảo: Glossier.com | Phong cách: Dược phẩm cao cấp Việt Nam

Đọc PROJECT_CONTEXT.md, .agent-rules/RULES.md và
.agent-rules/skills/coding-standards/SKILL.md trước khi bắt đầu.

Đây là REDESIGN TOÀN BỘ UI/UX storefront. Backend và logic KHÔNG thay đổi.
Chỉ thay đổi: màu sắc, typography, layout, animation, UX patterns.

═══════════════════════════════════════════════════════════════
PHẦN 1: DESIGN SYSTEM MỚI — globals.css
═══════════════════════════════════════════════════════════════

Cập nhật src/app/globals.css với design tokens mới.
Thay thế toàn bộ @theme inline hiện có bằng:

@theme inline {
  /* ═══ MÀU SẮC CHÍNH — Dược phẩm xanh lá cao cấp ═══ */

  /* Primary — Xanh y tế chuyên nghiệp */
  --color-primary-50:  #f0faf4;
  --color-primary-100: #dcf5e6;
  --color-primary-200: #baecd0;
  --color-primary-300: #86ddb1;
  --color-primary-400: #4dc78a;
  --color-primary-500: #28a96a;  /* Main brand green */
  --color-primary-600: #1a8a54;
  --color-primary-700: #166b42;  /* Dark — buttons, headers */
  --color-primary-800: #145535;
  --color-primary-900: #11452b;  /* Darkest */
  --color-primary:     #1a8a54;

  /* Secondary — Vàng đất ấm áp (trust, traditional medicine) */
  --color-accent-gold: #c8973a;
  --color-accent-gold-light: #f0d99a;
  --color-accent-gold-pale: #fdf6e3;

  /* Neutral — Warm whites (không lạnh như #fff thuần) */
  --color-background:  #fafaf8;  /* Page background — ấm, không chói */
  --color-surface:     #ffffff;
  --color-surface-alt: #f4f4f0;  /* Card backgrounds */
  --color-border:      #e8e8e2;  /* Subtle borders */
  --color-border-focus: #1a8a54;

  /* Text */
  --color-text-primary:   #1a1a17;  /* Near-black, warm */
  --color-text-secondary: #5a5a52;  /* Muted text */
  --color-text-tertiary:  #9a9a90;  /* Placeholder, disabled */
  --color-text-inverse:   #ffffff;

  /* Semantic */
  --color-success: #1a8a54;
  --color-error:   #c0392b;
  --color-warning: #d4830a;
  --color-info:    #2471a3;

  /* ═══ TYPOGRAPHY ═══ */
  /* Heading: Be Vietnam Pro — hiện đại, chuyên nghiệp, đọc được tiếng Việt tốt */
  /* Body: Inter — clean, legible */

  --font-display:   "Be Vietnam Pro", sans-serif;
  --font-body:      "Inter", sans-serif;

  /* Type scale */
  --text-xs:   0.75rem;   /* 12px */
  --text-sm:   0.875rem;  /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg:   1.125rem;  /* 18px */
  --text-xl:   1.25rem;   /* 20px */
  --text-2xl:  1.5rem;    /* 24px */
  --text-3xl:  1.875rem;  /* 30px */
  --text-4xl:  2.25rem;   /* 36px */
  --text-5xl:  3rem;      /* 48px */
  --text-6xl:  3.75rem;   /* 60px */

  /* ═══ SPACING — 8px base unit ═══ */
  --space-1:  0.25rem;   /* 4px */
  --space-2:  0.5rem;    /* 8px */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px */
  --space-6:  1.5rem;    /* 24px */
  --space-8:  2rem;      /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */
  --space-24: 6rem;      /* 96px */

  /* ═══ BORDER RADIUS ═══ */
  --radius-sm:   0.375rem;  /* 6px */
  --radius-md:   0.75rem;   /* 12px */
  --radius-lg:   1rem;      /* 16px */
  --radius-xl:   1.5rem;    /* 24px */
  --radius-full: 9999px;    /* pill */

  /* ═══ SHADOWS ═══ */
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md:  0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
  --shadow-lg:  0 12px 32px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.06);
  --shadow-xl:  0 24px 48px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.06);

  /* ═══ TRANSITIONS ═══ */
  --transition-fast:    150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal:  250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow:    400ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-spring:  500ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Global smooth scrolling */
html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  background-color: #fafaf8;
  color: #1a1a17;
  font-family: "Inter", sans-serif;
}

h1, h2, h3, h4, h5, h6 {
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 600;
  letter-spacing: -0.02em;
}

/* Smooth focus rings */
*:focus-visible {
  outline: 2px solid #1a8a54;
  outline-offset: 2px;
  border-radius: 4px;
}

/* Disable transitions on page load (tránh flash) */
.no-transition * {
  transition: none !important;
}

═══════════════════════════════════════════════════════════════
PHẦN 2: LAYOUT & NAVBAR — Học từ Glossier
═══════════════════════════════════════════════════════════════

Rebuild src/components/storefront/layout/Navbar.tsx

THIẾT KẾ NAVBAR (học từ Glossier):
- Height: 64px (desktop), 56px (mobile)
- Background: white, border-bottom 1px solid #e8e8e2
- Sticky top-0, z-50
- Backdrop blur khi scroll xuống: backdrop-blur-md bg-white/95

ANNOUNCEMENT BAR (trên navbar):
- Background: #166b42 (primary-700)
- Text: white, text-sm, text-center
- "🌿 Miễn phí vận chuyển đơn từ 500.000đ | Hotline: 1800-xxxx"
- Height: 40px
- Có thể đóng (X button) — lưu state vào sessionStorage

NAVBAR LAYOUT:
[Logo] ——————— [Nav Links] ——————— [Search][Cart][Account]

Logo:
- Icon lá + "LocHerbal" (font: Be Vietnam Pro, weight: 700)
- Màu: #166b42 khi nền trắng

Navigation Links (desktop only, md:flex hidden):
Trang chủ | Sản phẩm ▾ | Tư vấn | Ưu đãi | Về chúng tôi

"Sản phẩm ▾" khi hover → MEGA DROPDOWN:
- Full-width dropdown, background white, shadow-xl
- 4 cột: Tim Mạch | Xương Khớp | Tiêu Hóa | An Thần
- Mỗi cột: icon + tên category + 3 sản phẩm gợi ý + "Xem tất cả →"
- Animation: fadeIn + slideDown 200ms
- Không dùng onClick — dùng CSS :hover + group để tránh flicker

Action Icons (right side):
1. Search icon → mở Search Overlay (xem Phần 5)
2. Cart icon → mở Cart Drawer từ phải (xem Phần 6)
   Badge số lượng: absolute top-0 right-0, bg-primary, text-white
3. Account:
   - Nếu logged in: Avatar (initials) + dropdown menu
   - Nếu chưa login: "Đăng nhập" text link

MOBILE NAVBAR:
- [Hamburger] [Logo center] [Cart icon]
- Hamburger → Full-screen overlay slide from left
  * Danh sách links với transition: translate-x-0
  * Close button góc trên phải
  * Overlay backdrop: bg-black/40 backdrop-blur-sm

CODE PATTERN — Tránh flicker:
// Dùng CSS transition thay vì conditional render
<div className={`
  fixed inset-y-0 left-0 w-72 bg-white z-50 shadow-xl
  transform transition-transform duration-300 ease-in-out
  ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
`}>

// KHÔNG dùng: {mobileMenuOpen && <div>...}
// Vì conditional render gây layout shift và flicker

═══════════════════════════════════════════════════════════════
PHẦN 3: HOMEPAGE
═══════════════════════════════════════════════════════════════

Rebuild src/app/(storefront)/page.tsx và tất cả home components.

SECTION 1 — HERO BANNER:
Full viewport width, height: 70vh (desktop), 50vh (mobile)

Layout: 2 cột (50/50) trên desktop, stack vertical trên mobile

Cột trái (text):
- Badge pill: "🌿 Thảo dược thiên nhiên" — màu primary-100 text
- H1: "Chăm Sóc Sức Khỏe\nTừ Thiên Nhiên"
  Font: Be Vietnam Pro, 60px desktop / 36px mobile
  Color: #166b42
  Line height: 1.1
  Letter spacing: -0.03em
- Subtitle: 18px, color: #5a5a52, max-width: 480px
- 2 CTAs:
  Primary: "Khám phá sản phẩm" — bg-primary-700, text-white, rounded-full, px-8 py-4
  Secondary: "Tư vấn miễn phí" — border-2 border-primary-700, text-primary-700, rounded-full
  Hover effects: scale(1.02), shadow-md, transition-spring

Cột phải (image):
- Ảnh hero placeholder (aspect-ratio: 4/5)
- Background: gradient from primary-50 to primary-100
- Rounded-2xl
- Floating badge: "200+ sản phẩm" — white card, shadow-lg, rotate(-6deg)
- Floating badge 2: "★ 4.8 đánh giá" — white card, shadow-lg, rotate(4deg)

Animation:
- Text: fadeIn + slideUp, delay 100ms
- Image: fadeIn + scaleUp từ 0.95, delay 200ms
- Floating badges: bounceIn, delay 400ms

SECTION 2 — TRUST BAR:
Background: #166b42
4 trust items, text trắng, icons Material Symbols:
✓ Sản phẩm chính hãng 100%
✓ Miễn phí ship đơn 500K+
✓ Hoàn tiền 30 ngày
✓ Tư vấn chuyên gia 24/7

SECTION 3 — SHOP BY CHUYÊN KHOA (học từ Glossier category pills):
Title: "Mua Theo Chuyên Khoa"
Style: horizontal scroll pills trên mobile, grid 6 cột desktop

Mỗi category card:
- Aspect ratio: 3/4
- Background: gradient unique theo category
  Tim Mạch: from-red-50 to-rose-100
  Xương Khớp: from-amber-50 to-orange-100
  Tiêu Hóa: from-green-50 to-emerald-100
  An Thần: from-blue-50 to-indigo-100
  Da Liễu: from-purple-50 to-violet-100
  Hô Hấp: from-cyan-50 to-sky-100
- Icon lớn (Material Symbols, 48px)
- Tên category (Be Vietnam Pro, bold)
- Số sản phẩm: "24 sản phẩm"
- Hover: scale(1.03), shadow-lg, border-2 border-primary-300
- Transition: 250ms spring

SECTION 4 — FEATURED PRODUCTS (CAROUSEL học từ Glossier):
Title row: "Sản Phẩm Nổi Bật" + "Xem tất cả →"

Carousel implementation (NO external library):
- Container: overflow-hidden
- Track: flex gap-4, transition-transform duration-400ms ease-out
- Hiện 4 cards desktop, 2 tablet, 1.2 mobile (peek card)
- Prev/Next buttons: absolute, circular, bg-white, shadow-md
  - Hover: bg-primary-700, text-white
  - Left button disabled khi ở slide đầu, opacity-40
- Dots indicator: 4 dots nhỏ, active dot wide (pill shape)
- Auto-play: disabled (không nên autoplay trên e-commerce)
- Touch/swipe support: onTouchStart/onTouchEnd handlers

Product Card design:
- Aspect ratio: 3/4 cho ảnh
- Rounded-xl, overflow-hidden
- Hover: ảnh scale(1.05) transition-transform 400ms
- Badge tùy điều kiện: "Bán chạy" (gold) | "Mới" (green) | "-20%" (red)
- Quick Add button: slide up từ dưới khi hover card
  "Thêm vào giỏ" — bg-primary-700, text-white, rounded-full
- Rating: ★★★★☆ + số đánh giá
- Giá: giá gốc (line-through, gray) + giá sale (bold, primary)

SECTION 5 — PROMOTIONAL BANNER:
Background: #f4f4f0 (surface-alt)
Layout: image trái + text phải
Nội dung: "Chương Trình Đại Lý & Cộng Tác Viên"
CTA: "Tìm hiểu thêm"

SECTION 6 — BLOG / KIẾN THỨC:
3 cards horizontal
Card: ảnh thumbnail + category tag + title + read time + excerpt
Hover: shadow-lg, title underline

SECTION 7 — CONSULTATION LEAD FORM:
Background: primary-50
Form đơn giản: Tên + SĐT + Vấn đề sức khỏe (dropdown) + Submit
Submit button: bg-primary-700, hover:bg-primary-800
After submit: success state với checkmark animation

═══════════════════════════════════════════════════════════════
PHẦN 4: PRODUCT LISTING PAGE (PLP)
═══════════════════════════════════════════════════════════════

src/app/(storefront)/products/page.tsx
src/components/storefront/FilterSidebar.tsx (rebuild)
src/components/storefront/ProductGrid.tsx (rebuild)

LAYOUT: Sidebar 260px + Content fluid (gap-8)

FILTER SIDEBAR (sticky, smooth collapse):
Mỗi filter group có header + chevron (rotate khi collapse):
<button onClick={toggle} className="flex w-full justify-between">
  <span>Danh mục</span>
  <ChevronDown className={`transition-transform ${open ? 'rotate-180' : ''}`} />
</button>
<div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-96' : 'max-h-0'}`}>
  {/* content */}
</div>

Filter groups:
1. DANH MỤC — radio list, active item: text-primary + bullet xanh
2. KHOẢNG GIÁ:
   - Dual range slider custom (CSS only, no library)
   - Input từ/đến: format VNĐ
   - Quick presets: Dưới 200K | 200-500K | Trên 500K
3. DẠNG BÀO CHẾ — checkboxes với custom style
4. XUẤT XỨ — checkboxes
5. ĐÁNH GIÁ — star rating filter (click star để filter)

Active filters bar (phía trên product grid):
Hiện chips cho mỗi filter đang active:
"Tim Mạch ×" "200K-500K ×" "Viên nang ×" + "Xóa tất cả"

SORT BAR:
"Hiển thị 24/86 sản phẩm"
Sort dropdown: Phổ biến nhất | Giá tăng dần | Giá giảm dần | Mới nhất
View toggle: Grid 4 col | Grid 3 col | Grid 2 col

PRODUCT GRID:
- Default: 4 cột desktop, 3 cột tablet, 2 cột mobile
- Gap: 24px
- 25 SẢN PHẨM / TRANG (thay vì 12)

PAGINATION:
- Style: Glossier-inspired — minimal
- Hiện: Trang trước | 1 2 3 ... 8 9 | Trang sau
- Active page: bg-primary-700 text-white rounded-full
- Khi fetch trang mới: skeleton overlay (không blank screen)

SEARCH FUNCTIONALITY — quan trọng:
Gắn vào ProductGrid, đọc ?q= từ URL.
API call: GET /products?search=keyword&page=1&limit=25

Khi có search query:
- Highlight text khớp trong tên sản phẩm (dùng mark element)
- Show: "Kết quả cho 'tim mach': 24 sản phẩm"
- Nếu 0 kết quả: "Không tìm thấy sản phẩm cho 'xxx'"
  + Gợi ý: "Có thể bạn muốn tìm: Tim Mạch | Xương Khớp"
  + Hiện 4 sản phẩm bán chạy thay thế

═══════════════════════════════════════════════════════════════
PHẦN 5: SEARCH OVERLAY — Học từ Glossier
═══════════════════════════════════════════════════════════════

Tạo src/components/storefront/SearchOverlay.tsx ('use client')

Khi click icon Search trên Navbar:
- Overlay full-screen xuất hiện: bg-white/95 backdrop-blur-sm
- Animation: fadeIn 200ms
- Input focus tự động

SEARCH OVERLAY LAYOUT:
<div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm
                transition-opacity duration-200">
  <div className="max-w-2xl mx-auto px-6 pt-24">

    {/* Search input lớn */}
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        ref={inputRef}
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Tìm kiếm sản phẩm, chuyên khoa..."
        className="w-full pl-12 pr-12 py-4 text-xl border-0 border-b-2
                   border-primary-700 bg-transparent focus:outline-none
                   focus:border-primary-500 transition-colors"
        autoFocus
      />
      {query && (
        <button onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2">
          <X size={20} />
        </button>
      )}
    </div>

    {/* Results area */}
    {query.length === 0 && (
      /* Trending searches khi chưa gõ gì */
      <div className="mt-8">
        <p className="text-sm text-gray-500 mb-3">Tìm kiếm phổ biến</p>
        <div className="flex flex-wrap gap-2">
          {['Tim mạch', 'Xương khớp', 'Ngủ ngon', 'Tiêu hóa'].map(t => (
            <button key={t} onClick={() => setQuery(t)}
                    className="px-4 py-2 rounded-full border border-gray-200
                               text-sm hover:border-primary-500 hover:text-primary-700
                               transition-colors">
              {t}
            </button>
          ))}
        </div>
      </div>
    )}

    {query.length >= 1 && isLoading && (
      /* Loading skeleton */
      <div className="mt-6 space-y-3">
        {[1,2,3].map(i => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-12 h-12 bg-gray-100 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-2/3" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )}

    {query.length >= 1 && !isLoading && results.length > 0 && (
      /* Instant results */
      <ul className="mt-6 divide-y divide-gray-100">
        {results.slice(0, 6).map(product => (
          <li key={product.id}>
            <Link href={`/products/${product.slug}`}
                  onClick={closeOverlay}
                  className="flex items-center gap-4 py-3 px-2 rounded-lg
                             hover:bg-gray-50 transition-colors">
              {/* Thumbnail */}
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0" />
              {/* Info */}
              <div className="flex-1 min-w-0">
                {/* Highlight matching text */}
                <p className="font-medium text-sm" 
                   dangerouslySetInnerHTML={{ __html: highlight(product.name, query) }} />
                <p className="text-xs text-gray-500">{product.category?.name}</p>
              </div>
              {/* Price */}
              <p className="text-sm font-semibold text-primary-700 flex-shrink-0">
                {Number(product.variants?.[0]?.price ?? 0).toLocaleString('vi-VN')}đ
              </p>
            </Link>
          </li>
        ))}
        {results.length > 6 && (
          <li className="pt-3">
            <Link href={`/search?q=${encodeURIComponent(query)}`}
                  onClick={closeOverlay}
                  className="text-primary-700 text-sm hover:underline">
              Xem tất cả {results.length} kết quả →
            </Link>
          </li>
        )}
      </ul>
    )}

    {query.length >= 2 && !isLoading && results.length === 0 && (
      /* No results */
      <div className="mt-8 text-center">
        <p className="text-gray-500">Không tìm thấy kết quả cho "{query}"</p>
        <p className="text-sm text-gray-400 mt-2">
          Thử: "tim mạch", "xương khớp", "ngủ ngon"...
        </p>
      </div>
    )}
  </div>

  {/* Close button */}
  <button onClick={closeOverlay}
          className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full">
    <X size={24} />
  </button>
</div>

SEARCH LOGIC (debounced):
const [query, setQuery] = useState('')
const debouncedQuery = useDebounce(query, 300) // 300ms delay

useEffect(() => {
  if (debouncedQuery.length < 1) { setResults([]); return }
  apiClient.get('/products', { params: { search: debouncedQuery, limit: 10 } })
    .then(res => setResults(res.data?.data ?? res.data ?? []))
}, [debouncedQuery])

// highlight helper
function highlight(text: string, query: string): string {
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark class="bg-primary-100 text-primary-800 rounded">$1</mark>')
}

Đóng overlay khi: click backdrop, press Escape, click link kết quả.

═══════════════════════════════════════════════════════════════
PHẦN 6: CART DRAWER — Học từ Glossier (slide-in từ phải)
═══════════════════════════════════════════════════════════════

Tạo src/components/storefront/CartDrawer.tsx ('use client')
Thay thế trang /cart bằng drawer (giữ trang /cart cũ cho mobile fallback)

CART DRAWER:
- Slide in từ phải: translate-x-full → translate-x-0
- Width: 420px desktop, full-width mobile
- Height: 100vh, flex column
- Backdrop: bg-black/40, click để đóng

DRAWER LAYOUT:
┌─────────────────────────────────────┐
│ Giỏ hàng (3)              [X close] │
├─────────────────────────────────────┤
│ [Progress bar: Thêm 150K để free    │
│  ship] ████████░░░░░░               │
├─────────────────────────────────────┤
│ SCROLLABLE CART ITEMS               │
│                                     │
│ [ảnh][tên SP           ] [×]        │
│ [variant]               350.000đ   │
│ [−][2][+]               700.000đ   │
│ ─────────────────────────────────  │
│ [ảnh][tên SP           ] [×]        │
│ ...                                 │
├─────────────────────────────────────┤
│ FOOTER (sticky)                     │
│ Tạm tính:          1.050.000đ      │
│ [Tiến hành thanh toán →]            │
│ hoặc [Xem giỏ hàng]                │
└─────────────────────────────────────┘

PROGRESS BAR (học từ Glossier):
const FREE_SHIP_THRESHOLD = 500000
const progress = Math.min((subtotal / FREE_SHIP_THRESHOLD) * 100, 100)
const remaining = FREE_SHIP_THRESHOLD - subtotal

{remaining > 0 ? (
  <p>Thêm <strong>{remaining.toLocaleString('vi-VN')}đ</strong> để miễn phí ship</p>
) : (
  <p className="text-primary-700">🎉 Bạn được miễn phí vận chuyển!</p>
)}
<div className="h-1 bg-gray-200 rounded-full">
  <div className="h-1 bg-primary-500 rounded-full transition-all duration-500"
       style={{ width: `${progress}%` }} />
</div>

Cart Item trong drawer (compact hơn trang cart):
- Ảnh: 64x64, rounded-lg
- Tên + variant + giá
- Qty: [-][n][+] nhỏ gọn
- Xóa: icon × góc phải

Thêm vào giỏ animation (quan trọng, tránh flicker):
Khi click "Thêm vào giỏ" từ product:
1. Button → loading spinner (replace text, KHÔNG disable hoàn toàn)
2. Call API
3. Success → button flash green + checkmark 1 giây
4. Cart icon badge tăng với scale animation
5. Drawer tự mở

// Button states
type BtnState = 'idle' | 'loading' | 'success' | 'error'
const [btnState, setBtnState] = useState<BtnState>('idle')

═══════════════════════════════════════════════════════════════
PHẦN 7: CHECKOUT PAGE
═══════════════════════════════════════════════════════════════

Rebuild src/app/(storefront)/checkout/page.tsx

FIX PRIORITY: Order Summary hiện "NaNđ"
Nguyên nhân: priceSnapshot là string, cần Number() trước khi tính

const subtotal = cartItems.reduce((sum, item) =>
  sum + Number(item.priceSnapshot ?? item.price ?? 0) * (item.qty ?? 1), 0)

STEP INDICATOR (Glossier-style — minimal):
<div className="flex items-center justify-center gap-0 mb-8">
  {steps.map((step, i) => (
    <>
      <div className={`flex items-center gap-2 ${i < currentStep ? 'text-primary-700' : 'text-gray-400'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
          ${i === currentStep ? 'bg-primary-700 text-white' :
            i < currentStep ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-400'}`}>
          {i < currentStep ? '✓' : i + 1}
        </div>
        <span className="text-sm font-medium hidden sm:block">{step}</span>
      </div>
      {i < steps.length - 1 && (
        <div className={`h-px w-16 mx-2 ${i < currentStep ? 'bg-primary-500' : 'bg-gray-200'}`} />
      )}
    </>
  ))}
</div>

FORM STYLING (clean, medical vibe):
Labels: text-sm font-medium text-gray-700 mb-1
Inputs: border border-gray-200 rounded-lg px-4 py-3
        focus:border-primary-500 focus:ring-2 focus:ring-primary-100
        transition-all duration-150
Error state: border-red-400 + error message text-red-600 text-sm mt-1

PAYMENT METHOD SELECTOR:
Radio cards với border highlight khi selected:
<label className={`
  flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer
  transition-all duration-150
  ${selected ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}
`}>

═══════════════════════════════════════════════════════════════
PHẦN 8: AUTHENTICATION (Login/Register)
═══════════════════════════════════════════════════════════════

Rebuild src/app/(storefront)/login/page.tsx
Rebuild src/app/(storefront)/register/page.tsx

LAYOUT: 2 cột trên desktop, single column mobile
- Cột trái (hidden lg:block): ảnh hero xanh lá + quote về sức khỏe
- Cột phải: form

LOGIN FORM DESIGN:
- Logo + tagline nhỏ ở đầu
- Title: "Chào mừng trở lại" (Be Vietnam Pro, 28px)
- Subtitle: "Đăng nhập để tiếp tục mua sắm"

Form fields:
Email input với icon mail ở trái
Password input với icon lock + toggle hiện/ẩn mật khẩu

Remember me checkbox (custom styled, green checkbox):
<input type="checkbox" className="accent-primary-700" />

Submit button: full-width, bg-primary-700, rounded-xl, py-3.5
Hover: bg-primary-800, shadow-md
Loading: spinner trong button, text "Đang đăng nhập..."

Divider: ─── hoặc ───

Social login (Google):
- Bordered button, Google icon SVG, text "Tiếp tục với Google"
- Facebook optional

Links:
"Quên mật khẩu?" → /forgot-password
"Chưa có tài khoản? Đăng ký" → /register

Error display: Alert box nhỏ, bg-red-50, border-red-200, text-red-700
Success: fade redirect với loading overlay

REGISTER FORM:
Tương tự login nhưng thêm:
- Họ và tên (required)
- Xác nhận mật khẩu
- Checkbox đồng ý điều khoản (required để submit)
- Zod validation realtime (show error ngay khi blur)

FORGOT PASSWORD PAGE:
1-step: nhập email → submit → "Đã gửi email đặt lại mật khẩu"
(API TODO — hiện chỉ UI)

═══════════════════════════════════════════════════════════════
PHẦN 9: ACCOUNT DETAIL
═══════════════════════════════════════════════════════════════

Rebuild src/app/(storefront)/account/page.tsx

LAYOUT: Sidebar 240px + Content (gap-8)

SIDEBAR:
- Avatar circle (80px): initials từ tên, bg-primary-700, text-white
- Tên user (bold, 18px)
- Email (text-sm, gray)
- Phân cấp thành viên nếu có (badge)
- Menu list:
  [icon] Thông tin cá nhân
  [icon] Đơn hàng của tôi
  [icon] Địa chỉ giao hàng
  [icon] Đổi mật khẩu
  ─────
  [icon] Đăng xuất (text-red-600)

Active tab: border-l-2 border-primary-700, text-primary-700, bg-primary-50

CONTENT — TAB 1: Thông tin cá nhân
Card trắng, rounded-xl, shadow-sm, p-6
Form: Họ tên | Email (readonly) | SĐT | Ngày sinh | Giới tính
Nút lưu: primary button

TAB 2: Đơn hàng (fetch từ API + auth token)
Empty state nếu chưa có đơn:
- Illustration placeholder
- "Bạn chưa có đơn hàng nào"
- CTA "Bắt đầu mua sắm"

Nếu có đơn — timeline cards:
<div className="relative pl-6 before:absolute before:left-2 before:top-0
                before:bottom-0 before:w-0.5 before:bg-gray-200">
  {orders.map(order => (
    <div className="relative mb-4">
      {/* Dot trên timeline */}
      <div className="absolute -left-4 top-4 w-3 h-3 rounded-full
                      bg-primary-500 border-2 border-white" />
      {/* Card */}
      <div className="bg-white rounded-xl shadow-sm p-4 ml-2">
        Order info...
      </div>
    </div>
  ))}
</div>

TAB 3: Địa chỉ
Grid 2 cột
Address cards với badge "Mặc định"
Nút "Thêm địa chỉ mới" → modal form

TAB 4: Đổi mật khẩu
Form đơn giản 3 fields + submit

═══════════════════════════════════════════════════════════════
PHẦN 10: ANIMATIONS & MICRO-INTERACTIONS
═══════════════════════════════════════════════════════════════

Thêm vào globals.css:

/* Page transitions */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}

@keyframes slideInLeft {
  from { transform: translateX(-100%); }
  to   { transform: translateX(0); }
}

@keyframes bounceIn {
  0%   { transform: scale(0); }
  60%  { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes shimmer {
  from { background-position: -200% 0; }
  to   { background-position: 200% 0; }
}

.animate-fade-in-up   { animation: fadeInUp 400ms ease-out both; }
.animate-fade-in      { animation: fadeIn 250ms ease-out both; }
.animate-scale-in     { animation: scaleIn 250ms ease-out both; }
.animate-slide-right  { animation: slideInRight 300ms ease-out both; }
.animate-slide-left   { animation: slideInLeft 300ms ease-out both; }
.animate-bounce-in    { animation: bounceIn 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both; }

/* Skeleton loading */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

/* Stagger children */
.stagger-children > * {
  animation: fadeInUp 400ms ease-out both;
}
.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 50ms; }
.stagger-children > *:nth-child(3) { animation-delay: 100ms; }
.stagger-children > *:nth-child(4) { animation-delay: 150ms; }
.stagger-children > *:nth-child(5) { animation-delay: 200ms; }
.stagger-children > *:nth-child(6) { animation-delay: 250ms; }

QUY TẮC ANIMATION — tránh flicker:
1. KHÔNG dùng conditional render ({show && <Component/>}) cho overlays
   → Dùng CSS transform + opacity thay thế
2. Luôn dùng will-change: transform cho elements animate
3. Dùng requestAnimationFrame khi cần synchronize với browser paint
4. Thêm class "no-transition" vào body khi page load lần đầu,
   remove sau 100ms để tránh flash on load

═══════════════════════════════════════════════════════════════
PHẦN 11: RESPONSIVE & MOBILE UX
═══════════════════════════════════════════════════════════════

Breakpoints (Tailwind):
sm: 640px   (mobile landscape)
md: 768px   (tablet)
lg: 1024px  (desktop)
xl: 1280px  (wide desktop)

Mobile-specific UX patterns:
1. Bottom Navigation Bar (mobile only):
   [Trang chủ] [Danh mục] [Tìm kiếm] [Giỏ hàng] [Tài khoản]
   Fixed bottom, bg-white, border-top, safe-area-inset-bottom

2. Pull-to-refresh: NOT implement (Next.js SSR handles)

3. Touch targets: tất cả buttons minimum 44x44px

4. Font sizes: không nhỏ hơn 14px trên mobile

5. Product grid: 2 cột trên mobile (không phải 1 cột)

6. Cart Drawer → full-screen modal trên mobile

═══════════════════════════════════════════════════════════════
PHẦN 12: PHÂN TRANG 25 SẢN PHẨM
═══════════════════════════════════════════════════════════════

src/components/storefront/Pagination.tsx

Cập nhật tất cả API calls: limit=25 thay vì limit=12

Pagination component:
interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

Logic hiển thị pages: [1] [2] [3] ... [8] [9] [10]
(Hiện tối đa 7 số, dùng "..." khi nhiều hơn)

Khi chuyển trang:
1. Update URL: /products?page=N
2. Scroll to top (smooth)
3. Show skeleton overlay trên product grid
4. Fetch page mới
5. Fade in kết quả mới

═══════════════════════════════════════════════════════════════
QUY TẮC THỰC HIỆN
═══════════════════════════════════════════════════════════════

1. Làm từng PHẦN theo thứ tự 1→12
2. Sau mỗi Phần: npm run build → 0 errors → báo cáo
3. KHÔNG thay đổi logic backend, API calls, auth flow
4. KHÔNG thay đổi routing structure
5. KHÔNG xóa data-testid đã có (E2E tests dùng)
6. Giữ nguyên tất cả existing business logic
7. Chỉ thay đổi: className, styling, animation, layout, UX patterns
8. Mỗi animation phải có fallback (prefers-reduced-motion):
   @media (prefers-reduced-motion: reduce) {
     .animate-* { animation: none !important; }
     * { transition: none !important; }
   }

Bắt đầu bằng PHẦN 1 (globals.css) rồi báo cáo, chờ duyệt từng phần.
```