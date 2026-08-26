import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiClient } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAuthStore } from "@/store/authStore";
import type { AuthUser } from "@/types/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState("admin@hrm.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const form = new URLSearchParams();
      form.set("username", email);
      form.set("password", password);

      const { data: token } = await apiClient.post<{ access_token: string }>(
        "/auth/login",
        form,
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
      );

      const { data: user } = await apiClient.get<AuthUser>("/auth/me", {
        headers: { Authorization: `Bearer ${token.access_token}` },
      });

      setAuth(token.access_token, user);
      navigate("/");
    } catch {
      setError("Đăng nhập thất bại. Kiểm tra lại email/mật khẩu hoặc kết nối API backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Icon name="logo" className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-lg font-semibold text-slate-900">Đăng nhập Zei Group HR</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý nhân sự nội bộ doanh nghiệp</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Tài khoản mặc định: admin@hrm.local / Admin@123
        </p>
      </div>
    </div>
  );
}
