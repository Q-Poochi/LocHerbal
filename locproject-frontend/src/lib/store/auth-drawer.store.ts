import { create } from 'zustand';

export type AuthDrawerTab = 'login' | 'register' | 'otp';

interface AuthDrawerState {
    isDrawerOpen: boolean;
    initialTab: AuthDrawerTab;
    openDrawer: (tab?: AuthDrawerTab) => void;
    closeDrawer: () => void;
}

export const useAuthDrawerStore = create<AuthDrawerState>()((set) => ({
    isDrawerOpen: false,
    initialTab: 'login',
    // tab param là optional để mọi call-site cũ (openDrawer()) vẫn hoạt động
    openDrawer: (tab) =>
        set({ isDrawerOpen: true, initialTab: tab ?? 'login' }),
    closeDrawer: () => set({ isDrawerOpen: false }),
}));