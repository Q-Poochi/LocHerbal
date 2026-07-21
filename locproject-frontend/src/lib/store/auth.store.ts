import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../api/client';

interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role?: string;
}

interface AuthState {
  // accessToken CHỈ sống trong RAM — KHÔNG persist xuống localStorage (chống XSS).
  // Khi reload, gọi POST /auth/refresh (refresh token nằm trong httpOnly cookie)
  // để lấy accessToken mới.
  accessToken: string | null;
  user: User | null;
  setAuth: (accessToken: string, user: User | null) => void;
  clearAuth: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // Khôi phục phiên khi reload trang: dùng refresh token cookie → accessToken + user
  refreshSession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,

      setAuth: (accessToken, user) => set({ accessToken, user }),

      clearAuth: () => set({ accessToken: null, user: null }),

      login: async (email: string, password: string) => {
        const { data } = await apiClient.post('/auth/login', { email, password });
        set({ accessToken: data.accessToken, user: data.user });
      },

      logout: async () => {
        try {
          await apiClient.post('/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({ accessToken: null, user: null });
        }
      },

      // Gọi khi app khởi động. Refresh token được gửi tự động qua httpOnly cookie.
      // Thành công → có accessToken + user mới. Thất bại (cookie hết hạn) → chưa đăng nhập.
      refreshSession: async () => {
        try {
          const { data } = await apiClient.post('/auth/refresh');
          const { data: user } = await apiClient.get('/auth/me');
          set({ accessToken: data.accessToken, user });
          return true;
        } catch (error) {
          console.log('[Auth] No valid session, user not logged in');
          set({ accessToken: null, user: null });
          return false;
        }
      },
    }),
    {
      // CHỈ persist thông tin user (không nhạy cảm). accessToken KHÔNG bao giờ xuống localStorage.
      name: 'locherbal-auth',
      partialize: (state) => ({ user: state.user }),
    },
  ),
);