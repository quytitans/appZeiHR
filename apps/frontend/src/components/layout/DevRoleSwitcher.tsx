import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { login } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";

/**
 * TẠM THỜI - CHỈ ĐỂ TEST: dropdown chọn nhanh tài khoản test để đăng nhập.
 * Chỉ hiện khi chạy dev (import.meta.env.DEV), không có trong bản build production.
 * Danh sách phải khớp EMPLOYEES trong apps/backend/scripts/seed_test_data.py
 * (+ admin của scripts/seed.py).
 * Khi hoàn thiện app: xóa file này và dòng <DevRoleSwitcher /> trong PageShell.tsx.
 */
const TEST_PASSWORD = "Test@123";

interface TestAccount {
  name: string;
  email: string;
  note?: string;
  password?: string;
}

const ACCOUNT_GROUPS: { label: string; accounts: TestAccount[] }[] = [
  {
    label: "Nhân viên",
    accounts: [
      { name: "Hoàng Quốc Huy", email: "huyhq1@zeigroup.test", note: "IT" },
      { name: "Vũ Thị Lan", email: "lanvt@zeigroup.test", note: "IT" },
      { name: "Đặng Văn Long", email: "longdv@zeigroup.test", note: "IT" },
      { name: "Kiều Văn Khoa", email: "khoakv@zeigroup.test", note: "IT" },
      { name: "Mai Văn Sơn", email: "sonmv@zeigroup.test", note: "Kế toán" },
      { name: "Cao Thị Thảo", email: "thaoct@zeigroup.test", note: "Kế toán" },
      { name: "Bùi Thanh Tâm", email: "tambt@zeigroup.test", note: "Kế toán" },
      { name: "Ngô Văn Nam", email: "namnv@zeigroup.test", note: "Kinh doanh" },
      { name: "Dương Thị Oanh", email: "oanhdt@zeigroup.test", note: "Kinh doanh" },
      { name: "Đinh Viết Long", email: "longdv1@zeigroup.test", note: "Kinh doanh" },
    ],
  },
  {
    label: "Trưởng phòng",
    accounts: [
      { name: "Phạm Minh Đức", email: "ducpm@zeigroup.test", note: "IT" },
      { name: "Trịnh Thị Quyên", email: "quyentt@zeigroup.test", note: "Kế toán" },
      { name: "Đỗ Thị Mai", email: "maidt@zeigroup.test", note: "Kinh doanh" },
    ],
  },
  {
    label: "Giám đốc",
    accounts: [
      { name: "Nguyễn Văn An", email: "annv@zeigroup.test", note: "Kinh doanh" },
      { name: "Vũ Thị Hằng", email: "hangvt@zeigroup.test", note: "Vận hành" },
    ],
  },
  { label: "CEO", accounts: [{ name: "Trương Minh Khải", email: "khaitm@zeigroup.test" }] },
  { label: "HR", accounts: [{ name: "Trần Thị Bình", email: "binhtt@zeigroup.test" }] },
  {
    label: "Admin",
    accounts: [{ name: "System Admin", email: "admin@hrm.local", password: "Admin@123" }],
  },
];

const ALL_ACCOUNTS = ACCOUNT_GROUPS.flatMap((g) => g.accounts.map((a) => ({ ...a, group: g.label })));

export function DevRoleSwitcher() {
  const queryClient = useQueryClient();
  const currentEmail = useAuthStore((state) => state.user?.email);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!import.meta.env.DEV) return null;

  const current = ALL_ACCOUNTS.find((a) => a.email === currentEmail);

  async function switchTo(account: TestAccount) {
    setPending(account.email);
    setError(null);
    try {
      const { token, user } = await login(account.email, account.password ?? TEST_PASSWORD);
      queryClient.clear();
      setAuth(token, user);
      setOpen(false);
    } catch {
      setError(`Không đăng nhập được ${account.email} - đã chạy scripts/seed_test_data.py chưa?`);
    } finally {
      setPending(null);
    }
  }

  return (
    <div ref={rootRef} className="relative mx-auto mb-4 w-full max-w-sm text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-3 py-2 text-xs hover:bg-amber-50"
      >
        <span className="font-semibold uppercase tracking-wide text-amber-700">Dev · đổi tài khoản</span>
        <span className="truncate text-slate-600">
          {current ? `${current.group}: ${current.name}` : currentEmail ?? "Chưa đăng nhập"}
          <span className="ml-1 text-slate-400">{open ? "▴" : "▾"}</span>
        </span>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-40 mb-2 max-h-[60vh] w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          {ACCOUNT_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="sticky top-0 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {group.label} ({group.accounts.length})
              </p>
              {group.accounts.map((acc) => {
                const active = acc.email === currentEmail;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={pending !== null}
                    onClick={() => switchTo(acc)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm disabled:opacity-60 ${
                      active ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{acc.name}</span>
                      <span className="block truncate text-xs text-slate-400">
                        {acc.email}
                        {acc.note && ` · ${acc.note}`}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs">
                      {pending === acc.email ? "..." : active ? "Đang dùng" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
      {error && <p className="mt-1 text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}
