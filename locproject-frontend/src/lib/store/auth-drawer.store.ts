import { create } from 'zustand';

interface AuthDrawerState {
    isDrawerOpen: boolean;
    openDrawer: () => void;
    closeDrawer: () => void;
}

export const useAuthDrawerStore = create<AuthDrawerState>()((set) => ({
    isDrawerOpen: false,
    openDrawer: () => set({ isDrawerOpen: true }),
    closeDrawer: () => set({ isDrawerOpen: false }),
}));