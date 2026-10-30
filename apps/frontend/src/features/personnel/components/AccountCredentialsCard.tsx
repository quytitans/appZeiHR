import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

interface AccountCredentialsCardProps {
  email: string;
  tempPassword: string;
  onDone: () => void;
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API có thể bị chặn (vd context không an toàn) - người dùng tự bôi đen copy
    }
  }

  return (
    <div>
      <p className="mb-1 text-xs font-medium text-slate-600">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
          {value}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-brand-700"
          aria-label={`Copy ${label}`}
        >
          <Icon name={copied ? "check" : "copy"} className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function AccountCredentialsCard({ email, tempPassword, onDone }: AccountCredentialsCardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg bg-brand-50 px-4 py-3">
        <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />
        <p className="text-sm text-brand-800">
          Đã tạo tài khoản đăng nhập. Mật khẩu tạm dưới đây chỉ hiển thị <strong>một lần duy nhất</strong> -
          copy và gửi cho nhân viên ngay (khuyến nghị yêu cầu đổi mật khẩu sau lần đăng nhập đầu).
        </p>
      </div>

      <CopyField label="Email đăng nhập" value={email} />
      <CopyField label="Mật khẩu tạm" value={tempPassword} />

      <div className="flex justify-end border-t border-slate-200 pt-4">
        <Button type="button" onClick={onDone}>
          Đã lưu lại, đóng
        </Button>
      </div>
    </div>
  );
}
