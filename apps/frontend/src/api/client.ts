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

/** Gốc domain của backend (bỏ hậu tố /api/v1), dùng để dựng URL tuyệt đối tới file tĩnh (/files/...). */
export const apiOrigin = import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, "");

export function resolveFileUrl(path: string): string {
  return `${apiOrigin}${path}`;
}
