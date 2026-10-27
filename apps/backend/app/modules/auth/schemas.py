from pydantic import BaseModel, ConfigDict, model_validator

from app.models.personnel import ApprovalLevel, Employee
from app.models.user import Role
from app.modules.attendance.service import approval_level_of


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    """Lưu ý: email khai báo `str` (không phải `EmailStr`) vì đây là schema OUTPUT -
    dữ liệu đã tồn tại trong DB không cần re-validate định dạng. `EmailStr` (qua
    email-validator) từ chối domain đặc biệt như `.local`/`.internal` ngay cả khi chỉ
    dùng để hiển thị lại - từng khiến tài khoản seed admin@hrm.local vỡ 500 ở /auth/me."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    role: Role
    is_active: bool
    employee: "MyEmployeeOut | None" = None


class MyEmployeeOut(BaseModel):
    """Hồ sơ nhân viên của tài khoản đang đăng nhập (None với tài khoản hệ thống)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_code: str
    full_name: str
    approval_level: ApprovalLevel

    @model_validator(mode="before")
    @classmethod
    def _approval_level_from_position(cls, data):
        if isinstance(data, Employee):
            return {
                "id": data.id,
                "employee_code": data.employee_code,
                "full_name": data.full_name,
                "approval_level": approval_level_of(data),
            }
        return data


UserOut.model_rebuild()
