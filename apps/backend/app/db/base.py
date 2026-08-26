"""Import toàn bộ models để Alembic autogenerate nhận diện đầy đủ bảng."""

from app.db.base_class import Base  # noqa: F401
from app.models.attendance import AttendanceRecord, LeaveBalance, LeaveRequest  # noqa: F401
from app.models.benefit import BenefitPlan, BenefitUsageLog, EmployeeBenefit  # noqa: F401
from app.models.contract import Contract, ContractAppendix  # noqa: F401
from app.models.personnel import (  # noqa: F401
    Department,
    Employee,
    EmployeeDocument,
    EmploymentHistory,
    Position,
)
from app.models.user import User  # noqa: F401
