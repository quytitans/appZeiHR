from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.user import Role


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: Role = Role.EMPLOYEE


class UserOut(BaseModel):
    """email: str (không phải EmailStr) - đây là schema OUTPUT, xem giải thích ở
    app/modules/auth/schemas.py::UserOut."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    role: Role
    is_active: bool
