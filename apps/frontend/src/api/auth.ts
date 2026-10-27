import { apiClient } from "@/api/client";
import type { AuthUser } from "@/types/auth";

export async function login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const form = new URLSearchParams();
  form.set("username", email);
  form.set("password", password);

  const { data } = await apiClient.post<{ access_token: string }>("/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  const { data: user } = await apiClient.get<AuthUser>("/auth/me", {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });
  return { token: data.access_token, user };
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>("/auth/me");
  return data;
}
