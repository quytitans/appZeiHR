import axios from "axios";

import { useAuthStore } from "@/store/authStore";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * 401 từ bất kỳ API nào (token hết hạn sau ACCESS_TOKEN_EXPIRE_MINUTES, hoặc bị thu hồi) ->
 * tự đăng xuất ngay. Mọi trang cần đăng nhập đều tự render lại màn "Cần đăng nhập" khi
 * user/token về null, nên không cần điều hướng thủ công ở đây. Tránh để lỗi 401 hiển thị
 * nhầm thành "không kết nối được backend" như trước đây (xem feedback_browser_stale-content
 * debugging) - request tới /auth/login tự xử lý lỗi riêng ở LoginPage, logout() ở đây với
 * nó chỉ là no-op vô hại.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

/** Gốc domain của backend (bỏ hậu tố /api/v1), dùng để dựng URL tuyệt đối tới file tĩnh (/files/...). */
export const apiOrigin = import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, "");

export function resolveFileUrl(path: string): string {
  return `${apiOrigin}${path}`;
}
