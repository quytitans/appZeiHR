from datetime import date

from pydantic import BaseModel, ConfigDict

from app.models.benefit import BenefitCategory, EmployeeBenefitStatus


class BenefitPlanCreate(BaseModel):
    name: str
    category: BenefitCategory
    description: str | None = None


class BenefitPlanOut(BenefitPlanCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


class EmployeeBenefitCreate(BaseModel):
    employee_id: int
    benefit_plan_id: int
    start_date: date
    end_date: date | None = None


class EmployeeBenefitOut(EmployeeBenefitCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: EmployeeBenefitStatus
