import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Để backend có thể đọc httpOnly cookie (refresh token)
});

// Request Interceptor: Gắn Access Token từ in-memory store + CSRF token từ cookie
apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    // CSRF double-submit: cookie csrf_token (không httpOnly) → header x-csrf-token
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
      if (match?.[1]) {
        config.headers['x-csrf-token'] = decodeURIComponent(match[1]);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Xử lý 401 Unauthorized tự động refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Không intercept 401 từ chính endpoint /auth/refresh (tránh loop)
      if (originalRequest.url === '/auth/refresh') {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Gọi API refresh token. 
        // Backend tự đọc httpOnly cookie (refreshToken) và trả về accessToken mới
        let csrfHeader: string | undefined;
        if (typeof document !== 'undefined') {
          const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
          csrfHeader = match?.[1] ? decodeURIComponent(match[1]) : undefined;
        }
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {}, {
          withCredentials: true,
          headers: csrfHeader ? { 'x-csrf-token': csrfHeader } : {},
        });

        // Lưu accessToken mới vào in-memory store
        const { user } = useAuthStore.getState();
        if (user) {
          useAuthStore.getState().setAuth(data.accessToken, user);
        }

        // Retry request gốc với token mới
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh token cũng hết hạn hoặc lỗi -> Xóa state
        useAuthStore.getState().clearAuth();
        
        // CHỈ tự động bắt login lại nếu đang ở trang cần bảo vệ
        if (typeof window !== 'undefined') {
          const pathname = window.location.pathname;
          const isProtectedRoute = pathname.startsWith('/admin') || 
                                   pathname.startsWith('/account') || 
                                   pathname.startsWith('/checkout') || 
                                   pathname.startsWith('/orders');
                                   
          if (isProtectedRoute) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
