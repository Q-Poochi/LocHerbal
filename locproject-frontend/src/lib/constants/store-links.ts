// Danh sách đường dẫn storefront hợp lệ — dùng chung cho admin (Hero + Carousel)
// để admin CHỌN đường dẫn từ list thay vì gõ tự do (tránh để link lỗi/trống trỏ ra ngoài).
export interface StoreLinkOption {
    label: string;
    href: string;
    group: string;
}

export const STORE_LINK_OPTIONS: StoreLinkOption[] = [
    { label: 'Trang chủ', href: '/', group: 'Trang' },
    { label: 'Sản phẩm', href: '/products', group: 'Trang' },
    { label: 'Tìm kiếm', href: '/search', group: 'Trang' },
    { label: 'Về chúng tôi', href: '/ve-chung-toi', group: 'Trang' },
    { label: 'Liên hệ', href: '/lien-he', group: 'Trang' },
    { label: 'Giỏ hàng', href: '/cart', group: 'Mua sắm' },
    { label: 'Thanh toán', href: '/checkout', group: 'Mua sắm' },
    { label: 'Đăng nhập', href: '/login', group: 'Tài khoản' },
    { label: 'Đăng ký', href: '/register', group: 'Tài khoản' },
    { label: 'Tài khoản của tôi', href: '/account', group: 'Tài khoản' },
];

// Group theo thứ tự đã sắp; helper tránh duplicate trong mỗi group.
export function storeLinkGroups() {
    const seen = new Set<string>();
    return STORE_LINK_OPTIONS.filter((o) => {
        const key = `${o.group}:${o.href}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}