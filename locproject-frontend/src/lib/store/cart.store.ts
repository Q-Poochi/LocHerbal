import { create } from 'zustand';

interface CartState {
    isDrawerOpen: boolean;
    openDrawer: () => void;
    closeDrawer: () => void;
    clearCart: () => void;
}

export const useCartStore = create<CartState>()((set) => ({
    isDrawerOpen: false,
    openDrawer: () => set({ isDrawerOpen: true }),
    closeDrawer: () => set({ isDrawerOpen: false }),
    clearCart: () => {
        // React Query cache sẽ tự invalidate qua onSuccess của useCheckout mutation.
        // Store này chỉ dùng để signal cho các component biết cart đã clear.
    },
}));