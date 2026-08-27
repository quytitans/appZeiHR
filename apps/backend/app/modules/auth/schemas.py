from pydantic import BaseModel, ConfigDict

from app.models.user import Role


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
