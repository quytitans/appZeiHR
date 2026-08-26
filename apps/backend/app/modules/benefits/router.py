from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.common.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.benefit import BenefitPlan, EmployeeBenefit
from app.models.user import Role
from app.modules.benefits.schemas import (
    BenefitPlanCreate,
    BenefitPlanOut,
    EmployeeBenefitCreate,
    EmployeeBenefitOut,
)

router = APIRouter(prefix="/benefits", tags=["benefits"], dependencies=[Depends(get_current_user)])

MANAGE_ROLES = (Role.HR_ADMIN, Role.SYSTEM_ADMIN)


@router.get("/plans", response_model=list[BenefitPlanOut])
def list_benefit_plans(db: Session = Depends(get_db)):
    return db.query(BenefitPlan).all()


@router.post(
    "/plans",
    response_model=BenefitPlanOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(*MANAGE_ROLES))],
)
def create_benefit_plan(payload: BenefitPlanCreate, db: Session = Depends(get_db)):
    plan = BenefitPlan(**payload.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/assignments", response_model=list[EmployeeBenefitOut])
def list_employee_benefits(db: Session = Depends(get_db)):
    return db.query(EmployeeBenefit).all()


@router.post(
    "/assignments",
    response_model=EmployeeBenefitOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(*MANAGE_ROLES))],
)
def assign_benefit(payload: EmployeeBenefitCreate, db: Session = Depends(get_db)):
    assignment = EmployeeBenefit(**payload.model_dump())
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment
