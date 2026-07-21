import { create } from 'zustand';

interface CartState {
    /** Xóa giỏ hàng local — gọi sau khi đặt hàng thành công */
    clearCart: () => void;
}

export const useCartStore = create<CartState>()(() => ({
    clearCart: () => {
        // React Query cache sẽ tự invalidate qua onSuccess của useCheckout mutation.
        // Store này chỉ dùng để signal cho các component biết cart đã clear.
        // Giỏ hàng phía server sẽ được reset bằng sessionId mới (resetSessionId).
    },
}));