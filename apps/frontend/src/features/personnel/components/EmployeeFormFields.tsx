import type { Department, EmployeeFormValues, Position } from "@/types/personnel";

interface EmployeeFormFieldsProps {
  form: EmployeeFormValues;
  update: <K extends keyof EmployeeFormValues>(key: K, value: EmployeeFormValues[K]) => void;
  departments: Department[];
  positions: Position[];
  disabled?: boolean;
  employeeCodeLoading?: boolean;
}

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";
const labelClass = "mb-1 block text-xs font-medium text-slate-600";
const sectionTitleClass = "mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400";

export function EmployeeFormFields({
  form,
  update,
  departments,
  positions,
  disabled = false,
  employeeCodeLoading = false,
}: EmployeeFormFieldsProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className={sectionTitleClass}>Thông tin định danh</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="employee_code">
              Mã nhân viên <span className="text-red-500">*</span>
            </label>
            <input
              id="employee_code"
              required
              disabled
              readOnly
              value={employeeCodeLoading ? "Đang sinh mã..." : form.employee_code}
              className={inputClass}
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Tự động sinh (ZEI + năm tháng + số thứ tự), dùng để tra cứu nhân sự - không thể chỉnh sửa.
            </p>
          </div>
          <div>
            <label className={labelClass} htmlFor="full_name">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              id="full_name"
              required
              disabled={disabled}
              value={form.full_name}
              onChange={(e) => update("full_name", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="gender">
              Giới tính
            </label>
            <select
              id="gender"
              disabled={disabled}
              value={form.gender}
              onChange={(e) => update("gender", e.target.value as EmployeeFormValues["gender"])}
              className={inputClass}
            >
              <option value="">— Không chọn —</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="date_of_birth">
              Ngày sinh
            </label>
            <input
              id="date_of_birth"
              type="date"
              disabled={disabled}
              value={form.date_of_birth}
              onChange={(e) => update("date_of_birth", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="national_id">
              Số CCCD/CMND
            </label>
            <input
              id="national_id"
              disabled={disabled}
              value={form.national_id}
              onChange={(e) => update("national_id", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className={sectionTitleClass}>Liên hệ</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="company_email">
              Email
            </label>
            <input
              id="company_email"
              type="email"
              disabled={disabled}
              value={form.company_email}
              onChange={(e) => update("company_email", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="phone">
              Số điện thoại
            </label>
            <input
              id="phone"
              disabled={disabled}
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className={sectionTitleClass}>Công việc</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass} htmlFor="department_id">
              Phòng ban
            </label>
            <select
              id="department_id"
              disabled={disabled}
              value={form.department_id}
              onChange={(e) => update("department_id", e.target.value)}
              className={inputClass}
            >
              <option value="">— Không chọn —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="position_id">
              Chức vụ
            </label>
            <select
              id="position_id"
              disabled={disabled}
              value={form.position_id}
              onChange={(e) => update("position_id", e.target.value)}
              className={inputClass}
            >
              <option value="">— Không chọn —</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="start_date">
              Ngày vào làm
            </label>
            <input
              id="start_date"
              type="date"
              disabled={disabled}
              value={form.start_date}
              onChange={(e) => update("start_date", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
