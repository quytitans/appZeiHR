import { useQuery } from "@tanstack/react-query";

import { getMe } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";

/**
 * Tài khoản đang đăng nhập, lấy mới từ /auth/me (không dùng bản lưu lúc login trong
 * authStore vì chức vụ/cấp duyệt có thể đã đổi sau khi đăng nhập).
 */
export function useMe() {
  const token = useAuthStore((state) => state.token);
  return useQuery({ queryKey: ["me", token], queryFn: getMe, enabled: !!token });
}
