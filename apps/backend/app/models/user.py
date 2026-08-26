import enum

from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin


class Role(str, enum.Enum):
    """4 vai trò người dùng theo SRS mục 2.1."""

    EMPLOYEE = "employee"
    LINE_MANAGER = "line_manager"
    HR_ADMIN = "hr_admin"
    SYSTEM_ADMIN = "system_admin"


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[Role] = mapped_column(Enum(Role), default=Role.EMPLOYEE, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    employee: Mapped["Employee"] = relationship(
        "Employee", back_populates="user", uselist=False
    )
