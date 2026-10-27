"""Seed dữ liệu TEST cho môi trường dev: phòng ban, chức danh, 17 nhân viên kèm tài khoản
đăng nhập (10 nhân viên, 3 trưởng phòng, 2 giám đốc, 1 CEO, 1 HR - cùng admin@hrm.local
của scripts/seed.py là đủ 18 tài khoản), hợp đồng, phúc lợi, chấm công 2 tuần gần nhất,
số phép và đơn nghỉ phép ở đủ trạng thái của workflow duyệt.

Danh sách tài khoản này phải khớp ACCOUNT_GROUPS trong
apps/frontend/src/components/layout/DevRoleSwitcher.tsx (thanh đổi tài khoản khi dev).

KHÔNG chạy trên production. Không tự chạy khi container start (khác scripts/seed.py) -
chạy tay khi cần:
    docker compose exec backend python scripts/seed_test_data.py

Idempotent: nếu đã có phòng ban mã "BOD" (marker của bộ data này) thì bỏ qua.
Mã nhân viên sinh bằng service.generate_employee_code (vd longdv, longdv1); email đăng
nhập = <mã>@zeigroup.test. Mọi tài khoản test dùng chung mật khẩu TEST_PASSWORD.
Không seed EmployeeDocument vì cần file PDF thật trong uploads/.
"""

import os
import random
import sys
from datetime import date, datetime, time, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.security import hash_password
from app.db.base import Base  # noqa: F401 - import chuẩn hóa toàn bộ model registry trước khi query
from app.db.session import SessionLocal
from app.models.attendance import AttendanceRecord, LeaveBalance, LeaveType
from app.models.benefit import BenefitCategory, BenefitPlan, EmployeeBenefit, EmployeeBenefitStatus
from app.models.contract import Contract, ContractStatus, ContractType
from app.models.personnel import ApprovalLevel, Department, Employee, EmployeeStatus, EmploymentHistory, Gender, Position
from app.models.user import Role, User
from app.models.personnel import EmployeeCodeRegistry
from app.modules.attendance import service as leave_service
from app.modules.attendance.balance import DEFAULT_QUOTAS
from app.modules.attendance.schemas import LeaveRequestCreate
from app.modules.personnel.service import generate_employee_code

TEST_PASSWORD = "Test@123"
EMAIL_DOMAIN = "zeigroup.test"
MARKER_DEPARTMENT_CODE = "BOD"

DEPARTMENTS = [
    ("BOD", "Ban Giám đốc"),
    ("HR", "Phòng Nhân sự"),
    ("IT", "Phòng Công nghệ"),
    ("SALES", "Phòng Kinh doanh"),
    ("ACC", "Phòng Kế toán"),
]

# Chức danh -> cấp duyệt (quyết định luồng duyệt đơn nghỉ, xem app/modules/attendance/service.py)
POSITIONS = {
    "CEO": ApprovalLevel.CEO,
    "Giám đốc": ApprovalLevel.DIRECTOR,
    "Trưởng phòng": ApprovalLevel.DEPARTMENT_HEAD,
    "Chuyên viên nhân sự": ApprovalLevel.STAFF,
    "Kỹ sư phần mềm": ApprovalLevel.STAFF,
    "Kỹ sư kiểm thử": ApprovalLevel.STAFF,
    "Nhân viên kinh doanh": ApprovalLevel.STAFF,
    "Kế toán viên": ApprovalLevel.STAFF,
    "Thực tập sinh": ApprovalLevel.STAFF,
}

# (họ tên, giới tính, mã phòng, chức danh, vai trò, quản lý trực tiếp, trạng thái, ngày vào làm)
# Quản lý trực tiếp khai báo bằng họ tên, phải đứng TRƯỚC trong danh sách.
# Chuỗi quản lý: nhân viên -> trưởng phòng -> giám đốc -> CEO
EMPLOYEES = [
    # CEO (1)
    ("Trương Minh Khải", Gender.MALE, "BOD", "CEO", Role.LINE_MANAGER, None, EmployeeStatus.ACTIVE, date(2018, 6, 1)),
    # Giám đốc (2): An phụ trách Kinh doanh, Hằng phụ trách Vận hành (IT, Kế toán, Nhân sự)
    ("Nguyễn Văn An", Gender.MALE, "BOD", "Giám đốc", Role.LINE_MANAGER, "Trương Minh Khải", EmployeeStatus.ACTIVE, date(2019, 3, 1)),
    ("Vũ Thị Hằng", Gender.FEMALE, "BOD", "Giám đốc", Role.LINE_MANAGER, "Trương Minh Khải", EmployeeStatus.ACTIVE, date(2019, 8, 12)),
    # Trưởng phòng (3)
    ("Phạm Minh Đức", Gender.MALE, "IT", "Trưởng phòng", Role.LINE_MANAGER, "Vũ Thị Hằng", EmployeeStatus.ACTIVE, date(2020, 7, 1)),
    ("Trịnh Thị Quyên", Gender.FEMALE, "ACC", "Trưởng phòng", Role.LINE_MANAGER, "Vũ Thị Hằng", EmployeeStatus.ACTIVE, date(2019, 5, 20)),
    ("Đỗ Thị Mai", Gender.FEMALE, "SALES", "Trưởng phòng", Role.LINE_MANAGER, "Nguyễn Văn An", EmployeeStatus.ACTIVE, date(2019, 10, 14)),
    # HR (1): role HR admin, cấp duyệt Nhân viên, báo cáo thẳng Giám đốc Vận hành
    ("Trần Thị Bình", Gender.FEMALE, "HR", "Chuyên viên nhân sự", Role.HR_ADMIN, "Vũ Thị Hằng", EmployeeStatus.ACTIVE, date(2020, 1, 6)),
    # Nhân viên (10)
    ("Hoàng Quốc Huy", Gender.MALE, "IT", "Kỹ sư phần mềm", Role.EMPLOYEE, "Phạm Minh Đức", EmployeeStatus.ACTIVE, date(2021, 9, 13)),
    ("Vũ Thị Lan", Gender.FEMALE, "IT", "Kỹ sư phần mềm", Role.EMPLOYEE, "Phạm Minh Đức", EmployeeStatus.ACTIVE, date(2023, 2, 20)),
    ("Đặng Văn Long", Gender.MALE, "IT", "Kỹ sư kiểm thử", Role.EMPLOYEE, "Phạm Minh Đức", EmployeeStatus.ON_LEAVE, date(2022, 11, 1)),
    ("Kiều Văn Khoa", Gender.MALE, "IT", "Kỹ sư phần mềm", Role.EMPLOYEE, "Phạm Minh Đức", EmployeeStatus.ACTIVE, date(2024, 12, 2)),
    ("Mai Văn Sơn", Gender.MALE, "ACC", "Kế toán viên", Role.EMPLOYEE, "Trịnh Thị Quyên", EmployeeStatus.ACTIVE, date(2022, 3, 7)),
    ("Cao Thị Thảo", Gender.FEMALE, "ACC", "Kế toán viên", Role.EMPLOYEE, "Trịnh Thị Quyên", EmployeeStatus.ACTIVE, date(2025, 1, 13)),
    ("Bùi Thanh Tâm", Gender.MALE, "ACC", "Thực tập sinh", Role.EMPLOYEE, "Trịnh Thị Quyên", EmployeeStatus.ACTIVE, date(2026, 9, 7)),
    ("Ngô Văn Nam", Gender.MALE, "SALES", "Nhân viên kinh doanh", Role.EMPLOYEE, "Đỗ Thị Mai", EmployeeStatus.ACTIVE, date(2021, 4, 5)),
    ("Dương Thị Oanh", Gender.FEMALE, "SALES", "Nhân viên kinh doanh", Role.EMPLOYEE, "Đỗ Thị Mai", EmployeeStatus.ACTIVE, date(2024, 6, 3)),
    # Trùng viết tắt với Đặng Văn Long -> nhận longdv1
    ("Đinh Viết Long", Gender.MALE, "SALES", "Nhân viên kinh doanh", Role.EMPLOYEE, "Đỗ Thị Mai", EmployeeStatus.ACTIVE, date(2025, 4, 14)),
]

# Mã của nhân viên cũ đã bị xoá khỏi hệ thống, vẫn còn trong sổ đăng ký mã -> Hoàng Quốc
# Huy nhận huyhq1 chứ không phải huyhq (test quy tắc không cấp lại mã từng dùng)
RETIRED_EMPLOYEE_CODES = ["huyhq"]

BENEFIT_PLANS = [
    ("Bảo hiểm y tế bắt buộc", BenefitCategory.HEALTH_INSURANCE),
    ("Bảo hiểm xã hội", BenefitCategory.SOCIAL_INSURANCE),
    ("Bảo hiểm sức khỏe cao cấp", BenefitCategory.PREMIUM_HEALTHCARE),
    ("Phụ cấp ăn trưa", BenefitCategory.MEAL_ALLOWANCE),
    ("Phụ cấp gửi xe", BenefitCategory.TRANSPORT_ALLOWANCE),
    ("Phụ cấp điện thoại", BenefitCategory.PHONE_ALLOWANCE),
    ("Khám sức khỏe định kỳ", BenefitCategory.HEALTH_CHECKUP),
]

SALARY_BY_POSITION = {
    "CEO": 90_000_000,
    "Giám đốc": 60_000_000,
    "Trưởng phòng": 35_000_000,
    "Chuyên viên nhân sự": 15_000_000,
    "Kỹ sư phần mềm": 25_000_000,
    "Kỹ sư kiểm thử": 18_000_000,
    "Nhân viên kinh doanh": 12_000_000,
    "Kế toán viên": 14_000_000,
    "Thực tập sinh": 5_000_000,
}


def to_workday(d: date) -> date:
    """Dời ngày rơi vào T7/CN sang thứ 2 kế tiếp (đơn chỉ gồm ngày nghỉ cuối tuần bị từ chối)."""
    while d.weekday() >= 5:
        d += timedelta(days=1)
    return d


def working_days_back(n: int) -> list[date]:
    days, d = [], date.today()
    while len(days) < n:
        d -= timedelta(days=1)
        if d.weekday() < 5:
            days.append(d)
    return sorted(days)


def main() -> None:
    rnd = random.Random(42)
    db = SessionLocal()
    try:
        if db.query(Department).filter(Department.code == MARKER_DEPARTMENT_CODE).first():
            print("Data test đã tồn tại (có phòng ban BOD) - bỏ qua.")
            return

        departments = {code: Department(code=code, name=name) for code, name in DEPARTMENTS}
        positions = {title: Position(title=title, approval_level=level) for title, level in POSITIONS.items()}
        db.add_all([*departments.values(), *positions.values()])

        benefit_plans = [BenefitPlan(name=name, category=cat) for name, cat in BENEFIT_PLANS]
        db.add_all(benefit_plans)
        db.flush()

        db.add_all([EmployeeCodeRegistry(code=code) for code in RETIRED_EMPLOYEE_CODES])
        db.flush()

        employees: list[Employee] = []
        hashed = hash_password(TEST_PASSWORD)

        for name, gender, dept, pos, role, _manager, status, start in EMPLOYEES:
            # Sinh mã bằng đúng hàm của service; đăng ký + flush ngay để người sau thấy mã đã dùng
            code = generate_employee_code(db, name)
            db.add(EmployeeCodeRegistry(code=code))
            db.flush()
            email = f"{code}@{EMAIL_DOMAIN}"

            user = User(email=email, hashed_password=hashed, role=role, is_active=status != EmployeeStatus.TERMINATED)
            emp = Employee(
                user=user,
                employee_code=code,
                full_name=name,
                gender=gender,
                date_of_birth=date(rnd.randint(1980, 2003), rnd.randint(1, 12), rnd.randint(1, 28)),
                phone=f"09{rnd.randint(10_000_000, 99_999_999)}",
                personal_email=email.replace(EMAIL_DOMAIN, "gmail.test"),
                company_email=email,
                address=rnd.choice(["Cầu Giấy, Hà Nội", "Đống Đa, Hà Nội", "Quận 1, TP.HCM", "Thủ Đức, TP.HCM", "Hải Châu, Đà Nẵng"]),
                national_id=f"0{rnd.randint(1, 96):02d}{rnd.randint(100_000_000, 999_999_999)}",
                emergency_contact_name=f"Người thân của {name.split()[-1]}",
                emergency_contact_phone=f"09{rnd.randint(10_000_000, 99_999_999)}",
                department=departments[dept],
                position=positions[pos],
                start_date=start,
                status=status,
            )
            db.add(emp)
            employees.append(emp)
        db.flush()

        by_name = {e.full_name: e for e in employees}
        for emp, (*_, manager_name, _status, _start) in zip(employees, EMPLOYEES):
            emp.manager_id = by_name[manager_name].id if manager_name else None

        today = date.today()
        contract_seq = 0
        for emp, (*_, pos, _role, _manager, status, start) in zip(employees, EMPLOYEES):
            db.add(EmploymentHistory(employee_id=emp.id, department_id=emp.department_id, position_id=emp.position_id,
                                     changed_at=datetime.combine(start, time(9)), note="Tiếp nhận nhân sự mới"))

            # Hợp đồng: thử việc 2 tháng -> xác định thời hạn / không xác định thời hạn
            base_salary = SALARY_BY_POSITION[pos]
            probation_end = start + timedelta(days=60)
            contract_seq += 1
            db.add(Contract(
                employee_id=emp.id, contract_number=f"HDTV-{start.year}-{contract_seq:04d}",
                contract_type=ContractType.PROBATION, sign_date=start, effective_date=start,
                expiry_date=probation_end, salary=base_salary * 0.85,
                status=ContractStatus.ACTIVE if probation_end > today else ContractStatus.EXPIRED,
            ))
            if probation_end <= today:
                contract_seq += 1
                long_term = (today - start).days > 3 * 365
                main_status = ContractStatus.TERMINATED if status == EmployeeStatus.TERMINATED else ContractStatus.ACTIVE
                # 1 HĐ xác định thời hạn sắp hết hạn trong 30 ngày để test cảnh báo
                expiry = None if long_term else (today + timedelta(days=20) if emp.full_name == "Ngô Văn Nam" else probation_end + timedelta(days=730))
                db.add(Contract(
                    employee_id=emp.id, contract_number=f"HDLD-{probation_end.year}-{contract_seq:04d}",
                    contract_type=ContractType.INDEFINITE_TERM if long_term else ContractType.FIXED_TERM,
                    sign_date=probation_end, effective_date=probation_end + timedelta(days=1),
                    expiry_date=expiry, salary=base_salary, status=main_status,
                ))

            if status == EmployeeStatus.TERMINATED:
                continue

            # Phúc lợi: BHYT/BHXH/ăn trưa cho tất cả, cao cấp cho trưởng phòng trở lên
            for plan in benefit_plans:
                mandatory = plan.category in (BenefitCategory.HEALTH_INSURANCE, BenefitCategory.SOCIAL_INSURANCE, BenefitCategory.MEAL_ALLOWANCE)
                senior = pos in ("CEO", "Giám đốc", "Trưởng phòng") and plan.category in (BenefitCategory.PREMIUM_HEALTHCARE, BenefitCategory.PHONE_ALLOWANCE)
                if mandatory or senior or rnd.random() < 0.3:
                    db.add(EmployeeBenefit(employee_id=emp.id, benefit_plan_id=plan.id, start_date=max(start, date(today.year, 1, 1)),
                                           status=EmployeeBenefitStatus.ACTIVE))

            # Quỹ ngày nghỉ mặc định cho mọi loại (năm nay + năm sau để đơn bắc cầu sang năm sau không lỗi)
            for year in (today.year, today.year + 1):
                for leave_type, quota in DEFAULT_QUOTAS.items():
                    db.add(LeaveBalance(employee_id=emp.id, year=year, leave_type=leave_type, total_days=quota))

            # Chấm công 10 ngày làm việc gần nhất
            if status == EmployeeStatus.ACTIVE:
                for d in working_days_back(10):
                    if d < start or rnd.random() < 0.05:
                        continue
                    late = rnd.random() < 0.15
                    early = rnd.random() < 0.1
                    check_in = datetime.combine(d, time(8, rnd.randint(31, 59) if late else rnd.randint(0, 29)))
                    check_out = datetime.combine(d, time(rnd.randint(15, 16) if early else 17, rnd.randint(30, 59)))
                    db.add(AttendanceRecord(employee_id=emp.id, work_date=d, check_in=check_in, check_out=check_out,
                                            check_in_ip="192.168.1.10", check_out_ip="192.168.1.10",
                                            is_late=late, is_early_leave=early))

        db.commit()

        # Đơn nghỉ phép tạo qua đúng service workflow, rồi lần lượt xử lý từng bước:
        # "approve"/"reject" = người duyệt của bước hiện tại quyết định, "cancel" = người tạo hủy.
        by_name = {e.full_name: db.get(Employee, e.id) for e in employees}
        leave_samples = [
            # Chờ trưởng phòng xác nhận
            ("Hoàng Quốc Huy", LeaveType.ANNUAL, 5, 6, False, "Về quê có việc gia đình", []),
            ("Kiều Văn Khoa", LeaveType.ANNUAL, 1, 2, False, "Việc cá nhân", []),
            ("Cao Thị Thảo", LeaveType.MATERNITY_PATERNITY, 30, 210, False, "Nghỉ thai sản", []),
            # Trưởng phòng đã xác nhận, chờ giám đốc duyệt
            ("Ngô Văn Nam", LeaveType.ANNUAL, 10, 10, True, "Nghỉ buổi chiều", ["approve"]),
            ("Mai Văn Sơn", LeaveType.SICK, 2, 2, False, "Khám sức khỏe định kỳ", ["approve"]),
            # Đã duyệt / từ chối / hủy
            ("Vũ Thị Lan", LeaveType.SICK, -3, -3, False, "Sốt, có giấy khám bệnh", ["approve", "approve"]),
            ("Đặng Văn Long", LeaveType.UNPAID, -10, 20, False, "Nghỉ không lương việc riêng dài ngày", ["approve", "approve"]),
            ("Dương Thị Oanh", LeaveType.COMPENSATION, -7, -7, False, "Nghỉ bù làm thêm cuối tuần", ["approve", "approve"]),
            ("Đinh Viết Long", LeaveType.ANNUAL, -15, -14, False, "Du lịch", ["approve", "reject"]),
            ("Bùi Thanh Tâm", LeaveType.OTHER, 3, 3, False, "Đi đám cưới bạn", ["cancel"]),
            # HR (cấp Nhân viên, không có trưởng phòng trong chuỗi -> chỉ cần giám đốc duyệt)
            ("Trần Thị Bình", LeaveType.ANNUAL, 12, 12, False, "Việc gia đình", []),
            # Trưởng phòng -> giám đốc
            ("Phạm Minh Đức", LeaveType.ANNUAL, 7, 8, False, "Nghỉ phép năm", []),
            ("Đỗ Thị Mai", LeaveType.ANNUAL, -20, -18, False, "Du lịch cùng gia đình", ["approve"]),
            # Giám đốc -> CEO
            ("Nguyễn Văn An", LeaveType.ANNUAL, 14, 15, False, "Công việc gia đình", []),
            ("Vũ Thị Hằng", LeaveType.ANNUAL, -5, -5, False, "Việc cá nhân", ["approve"]),
        ]
        for name, ltype, s, e, half, reason, actions in leave_samples:
            requester = by_name[name]
            req = leave_service.create_leave_request(db, requester, LeaveRequestCreate(
                leave_type=ltype, start_date=to_workday(today + timedelta(days=s)),
                end_date=to_workday(today + timedelta(days=e)),
                is_half_day=half, reason=reason,
            ))
            for action in actions:
                if action == "cancel":
                    req = leave_service.cancel(db, req, requester)
                else:
                    comment = "Đang cao điểm quyết toán, đề nghị dời lịch" if action == "reject" else None
                    req = leave_service.decide(db, req, req.current_step.approver, action == "approve", comment)

        db.commit()
        print(f"Đã seed data test: {len(departments)} phòng ban, {len(positions)} chức danh, "
              f"{len(employees)} nhân viên, {len(benefit_plans)} gói phúc lợi.")
        print(f"Tài khoản test (mật khẩu chung {TEST_PASSWORD}):")
        for emp, (*_, role, _h, _s, _d) in zip(employees, EMPLOYEES):
            print(f"  {role.value:<13} {emp.company_email:<28} {emp.full_name} ({emp.employee_code})")
    finally:
        db.close()


if __name__ == "__main__":
    main()
