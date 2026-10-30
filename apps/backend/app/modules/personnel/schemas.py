from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.personnel import ApprovalLevel, EmployeeStatus, Gender
from app.models.user import Role


class DepartmentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    code: str = Field(min_length=1, max_length=50)


class DepartmentUpdate(DepartmentCreate):
    pass


class DepartmentOut(DepartmentCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


class PositionCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    approval_level: ApprovalLevel = ApprovalLevel.STAFF


class PositionUpdate(PositionCreate):
    pass


class PositionOut(PositionCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


class EmployeeCreate(BaseModel):
    """Form thêm mới hồ sơ nhân sự - SRS 3.1.2.A.

    Không nhận employee_code từ client: mã được backend tự sinh từ họ tên NGAY LÚC TẠO
    (form chỉ hiển thị bản xem trước) để tránh 2 người tạo cùng lúc bị cấp trùng mã - xem
    service.create_employee(). Tạm thời chỉ bắt buộc full_name; các trường còn lại (kể cả
    email, CCCD) chưa bắt buộc ở giai đoạn này.
    """

    full_name: str = Field(min_length=1, max_length=255)
    company_email: EmailStr | None = None
    national_id: str | None = Field(default=None, max_length=50)

    gender: Gender | None = None
    date_of_birth: date | None = None
    phone: str | None = None
    personal_email: str | None = None
    address: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    department_id: int | None = None
    position_id: int | None = None
    manager_id: int | None = None
    start_date: date | None = None

    # Chỉ dùng khi tạo tài khoản đăng nhập (company_email có giá trị) - xem
    # service.create_employee(). Không cho chọn SYSTEM_ADMIN qua form này.
    role: Role = Role.EMPLOYEE


class EmployeeUpdate(EmployeeCreate):
    pass


class DepartmentBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str


class PositionBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str


# Phải khớp DOCUMENT_TYPE_LABELS ở frontend (src/types/personnel.ts)
EmployeeDocumentType = Literal["employment_contract", "contract_appendix", "other"]


class EmployeeDocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    doc_type: str
    file_url: str
    file_name: str
    uploaded_at: datetime


class EmployeeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_code: str
    full_name: str
    company_email: str | None
    personal_email: str | None
    phone: str | None
    national_id: str | None
    gender: Gender | None
    date_of_birth: date | None
    address: str | None
    emergency_contact_name: str | None
    emergency_contact_phone: str | None
    department_id: int | None
    position_id: int | None
    manager_id: int | None
    start_date: date | None
    status: EmployeeStatus
    # None = chưa có tài khoản đăng nhập liên kết - frontend dùng để hiện nút "Tạo tài khoản"
    user_id: int | None

    department: DepartmentBrief | None = None
    position: PositionBrief | None = None
    contract_document: EmployeeDocumentOut | None = None
    documents: list[EmployeeDocumentOut] = []


class EmployeeCreateResult(EmployeeOut):
    """Response của POST /employees và POST /employees/{id}/account. temp_password chỉ
    xuất hiện đúng 1 lần ở đây (không lưu plaintext, không trả lại ở bất kỳ GET nào) - HR
    phải copy ngay và gửi cho nhân viên."""

    temp_password: str | None = None


class CreateAccountPayload(BaseModel):
    """Tạo tài khoản đăng nhập cho nhân viên đã tồn tại nhưng chưa có account (vd nhân
    viên tạo trước khi tính năng này có). Yêu cầu nhân viên đã có company_email."""

    role: Role = Role.EMPLOYEE


class EmployeeCodePreviewOut(BaseModel):
    employee_code: str


class EmployeePageOut(BaseModel):
    items: list[EmployeeOut]
    total: int
    page: int
    page_size: int
