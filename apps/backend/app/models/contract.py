import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin


class ContractType(str, enum.Enum):
    """SRS 3.2 - loại hợp đồng."""

    PROBATION = "probation"
    FIXED_TERM = "fixed_term"
    INDEFINITE_TERM = "indefinite_term"
    SEASONAL = "seasonal"


class ContractStatus(str, enum.Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    TERMINATED = "terminated"


class Contract(TimestampMixin, Base):
    __tablename__ = "contracts"

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    contract_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    contract_type: Mapped[ContractType] = mapped_column(Enum(ContractType), nullable=False)
    sign_date: Mapped[date] = mapped_column(Date, nullable=False)
    effective_date: Mapped[date] = mapped_column(Date, nullable=False)
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    salary: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    status: Mapped[ContractStatus] = mapped_column(
        Enum(ContractStatus), default=ContractStatus.ACTIVE, nullable=False
    )

    employee: Mapped["Employee"] = relationship("Employee")
    appendices: Mapped[list["ContractAppendix"]] = relationship(
        "ContractAppendix", back_populates="contract", cascade="all, delete-orphan"
    )


class ContractAppendix(Base):
    """Phụ lục hợp đồng kèm theo."""

    __tablename__ = "contract_appendices"

    id: Mapped[int] = mapped_column(primary_key=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    file_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    effective_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    contract: Mapped["Contract"] = relationship("Contract", back_populates="appendices")
