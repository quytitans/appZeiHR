from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.personnel import EmployeeStatus, Gender


class DepartmentCreate(BaseModel):
    name: str
    code: str


class DepartmentOut(DepartmentCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


class PositionCreate(BaseModel):
    title: str


class PositionOut(PositionCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


class EmployeeCreate(BaseModel):
    """Form thêm mới hồ sơ nhân sự - SRS 3.1.2.A.

    Tạm thời chỉ bắt buộc 2 trường cơ bản nhất (employee_code, full_name) để giảm ma sát
    khi nhập liệu nhanh; các trường còn lại (kể cả email, CCCD) chưa bắt buộc ở giai đoạn này.
    Duplicate-check với employee_code/national_id vẫn áp dụng khi có giá trị.
    """

    employee_code: str = Field(min_length=1, max_length=50)
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

    department: DepartmentBrief | None = None
    position: PositionBrief | None = None
    contract_document: EmployeeDocumentOut | None = None


class EmployeePageOut(BaseModel):
    items: list[EmployeeOut]
    total: int
    page: int
    page_size: int
