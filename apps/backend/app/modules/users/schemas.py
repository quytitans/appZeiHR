from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.user import Role


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: Role = Role.EMPLOYEE


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    role: Role
    is_active: bool
