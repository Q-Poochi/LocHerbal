/**
 * Quản lý guest sessionId trên localStorage.
 * Khi chưa đăng nhập, frontend dùng sessionId để backend định danh giỏ hàng.
 */
const SESSION_KEY = 'locherbal_session_id';

function generateUuid(): string {
    // RFC4122 v4
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export function getSessionId(): string {
    if (typeof window === 'undefined') return '';
    let id = window.localStorage.getItem(SESSION_KEY);
    if (!id) {
        id = generateUuid();
        window.localStorage.setItem(SESSION_KEY, id);
    }
    return id;
}

/**
 * Tạo sessionId mới (sau khi đặt hàng/checkout thành công) để "xóa" giỏ hàng cũ.
 */
export function resetSessionId(): string {
    if (typeof window === 'undefined') return '';
    const id = generateUuid();
    window.localStorage.setItem(SESSION_KEY, id);
    return id;
}