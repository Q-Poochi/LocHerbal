import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Để backend có thể đọc httpOnly cookie (refresh token)
});

// CSRF double-submit cookie pattern yêu cầu cùng origin (cookie host-only của backend).
// Cross-origin browser KHÔNG đọc được document.cookie của backend → phải lấy token
// từ endpoint GET /auth/csrf (SOP + CORS hạn chế origin nên an toàn) và cache lại.
let csrfTokenPromise: Promise<string> | null = null;

async function fetchCsrfToken(): Promise<string> {
  if (typeof document === 'undefined') return '';
  try {
    // Cookie csrf_token (không httpOnly) vẫn được browser tự gửi kèm với credentials
    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
    // Chưa có cookie → gọi backend để set + trả token
    const { data } = await axios.get<{ csrfToken: string }>(`${API_URL}/auth/csrf`, {
      withCredentials: true,
    });
    return data.csrfToken ?? '';
  } catch {
    return '';
  }
}

function getCsrfToken(): Promise<string> {
  if (!csrfTokenPromise) {
    csrfTokenPromise = fetchCsrfToken().finally(() => {
      csrfTokenPromise = null;
    });
  }
  return csrfTokenPromise;
}

// Request Interceptor: Gắn Access Token từ in-memory store + CSRF token từ cookie/endpoint
apiClient.interceptors.request.use(
  async (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    // CSRF double-submit: header x-csrf-token phải khớp cookie csrf_token
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
      if (match?.[1]) {
        config.headers['x-csrf-token'] = decodeURIComponent(match[1]);
      } else {
        const token = await getCsrfToken();
        if (token) {
          config.headers['x-csrf-token'] = token;
        }
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
