from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.common.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.contract import Contract
from app.models.user import Role
from app.modules.contracts.schemas import ContractCreate, ContractOut

router = APIRouter(prefix="/contracts", tags=["contracts"], dependencies=[Depends(get_current_user)])

MANAGE_ROLES = (Role.HR_ADMIN, Role.SYSTEM_ADMIN)


@router.get("", response_model=list[ContractOut])
def list_contracts(db: Session = Depends(get_db)):
    return db.query(Contract).all()


@router.get("/{contract_id}", response_model=ContractOut)
def get_contract(contract_id: int, db: Session = Depends(get_db)):
    contract = db.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hợp đồng")
    return contract


@router.post(
    "",
    response_model=ContractOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(*MANAGE_ROLES))],
)
def create_contract(payload: ContractCreate, db: Session = Depends(get_db)):
    if db.query(Contract).filter(Contract.contract_number == payload.contract_number).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Số hợp đồng đã tồn tại")

    contract = Contract(**payload.model_dump())
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract
