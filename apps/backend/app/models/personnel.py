import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin


class EmployeeStatus(str, enum.Enum):
    ACTIVE = "active"
    ON_LEAVE = "on_leave"
    TERMINATED = "terminated"


class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class Department(TimestampMixin, Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    employees: Mapped[list["Employee"]] = relationship(
        "Employee", back_populates="department", foreign_keys="Employee.department_id"
    )


class Position(TimestampMixin, Base):
    __tablename__ = "positions"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)

    employees: Mapped[list["Employee"]] = relationship(
        "Employee", back_populates="position", foreign_keys="Employee.position_id"
    )


class Employee(TimestampMixin, Base):
    """Hồ sơ nhân sự - SRS mục 3.1."""

    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), unique=True, nullable=True
    )

    # Mã định danh nhân viên duy nhất (SRS 3.1.2.A) - dùng cho duplicate check khi tạo mới
    employee_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    # Thông tin cá nhân
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[Gender | None] = mapped_column(Enum(Gender), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    personal_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company_email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    national_id: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    emergency_contact_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(30), nullable=True)

    # Thông tin công việc
    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id"), nullable=True
    )
    position_id: Mapped[int | None] = mapped_column(ForeignKey("positions.id"), nullable=True)
    manager_id: Mapped[int | None] = mapped_column(ForeignKey("employees.id"), nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[EmployeeStatus] = mapped_column(
        Enum(EmployeeStatus), default=EmployeeStatus.ACTIVE, nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="employee")
    department: Mapped["Department | None"] = relationship(
        "Department", back_populates="employees", foreign_keys=[department_id]
    )
    position: Mapped["Position | None"] = relationship(
        "Position", back_populates="employees", foreign_keys=[position_id]
    )
    manager: Mapped["Employee | None"] = relationship(
        "Employee", remote_side=[id], foreign_keys=[manager_id]
    )
    documents: Mapped[list["EmployeeDocument"]] = relationship(
        "EmployeeDocument", back_populates="employee", cascade="all, delete-orphan"
    )
    employment_history: Mapped[list["EmploymentHistory"]] = relationship(
        "EmploymentHistory", back_populates="employee", cascade="all, delete-orphan"
    )

    @property
    def contract_document(self) -> "EmployeeDocument | None":
        """Bản hợp đồng lao động mới nhất đính kèm hồ sơ (SRS 3.1.2.D).

        Giá trị "employment_contract" phải khớp EMPLOYMENT_CONTRACT_DOC_TYPE ở
        app/modules/personnel/service.py.
        """
        contract_docs = [d for d in self.documents if d.doc_type == "employment_contract"]
        if not contract_docs:
            return None
        return max(contract_docs, key=lambda d: d.uploaded_at)


class EmployeeDocument(Base):
    """Tài liệu đính kèm: giấy tờ tùy thân, bằng cấp, chứng chỉ..."""

    __tablename__ = "employee_documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    doc_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    employee: Mapped["Employee"] = relationship("Employee", back_populates="documents")


class EmploymentHistory(Base):
    """Lịch sử thay đổi vị trí/chức vụ/phòng ban."""

    __tablename__ = "employment_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id"), nullable=True
    )
    position_id: Mapped[int | None] = mapped_column(ForeignKey("positions.id"), nullable=True)
    changed_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    employee: Mapped["Employee"] = relationship("Employee", back_populates="employment_history")
