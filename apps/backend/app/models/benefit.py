import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin


class BenefitCategory(str, enum.Enum):
    """SRS 3.3 - danh mục phúc lợi công ty."""

    HEALTH_INSURANCE = "health_insurance"
    SOCIAL_INSURANCE = "social_insurance"
    PREMIUM_HEALTHCARE = "premium_healthcare"
    MEAL_ALLOWANCE = "meal_allowance"
    TRANSPORT_ALLOWANCE = "transport_allowance"
    PHONE_ALLOWANCE = "phone_allowance"
    HEALTH_CHECKUP = "health_checkup"
    OTHER = "other"


class EmployeeBenefitStatus(str, enum.Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class BenefitPlan(TimestampMixin, Base):
    __tablename__ = "benefit_plans"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[BenefitCategory] = mapped_column(Enum(BenefitCategory), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    employee_benefits: Mapped[list["EmployeeBenefit"]] = relationship(
        "EmployeeBenefit", back_populates="benefit_plan"
    )


class EmployeeBenefit(Base):
    """Gán gói phúc lợi cho từng nhân viên."""

    __tablename__ = "employee_benefits"

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    benefit_plan_id: Mapped[int] = mapped_column(ForeignKey("benefit_plans.id"), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[EmployeeBenefitStatus] = mapped_column(
        Enum(EmployeeBenefitStatus), default=EmployeeBenefitStatus.ACTIVE, nullable=False
    )

    employee: Mapped["Employee"] = relationship("Employee")
    benefit_plan: Mapped["BenefitPlan"] = relationship(
        "BenefitPlan", back_populates="employee_benefits"
    )
    usage_logs: Mapped[list["BenefitUsageLog"]] = relationship(
        "BenefitUsageLog", back_populates="employee_benefit", cascade="all, delete-orphan"
    )


class BenefitUsageLog(Base):
    """Lịch sử sử dụng/thanh toán phúc lợi."""

    __tablename__ = "benefit_usage_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_benefit_id: Mapped[int] = mapped_column(
        ForeignKey("employee_benefits.id"), nullable=False
    )
    used_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    amount: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    employee_benefit: Mapped["EmployeeBenefit"] = relationship(
        "EmployeeBenefit", back_populates="usage_logs"
    )
