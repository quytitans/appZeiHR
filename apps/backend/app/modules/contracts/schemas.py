from datetime import date

from pydantic import BaseModel, ConfigDict

from app.models.contract import ContractStatus, ContractType


class ContractCreate(BaseModel):
    employee_id: int
    contract_number: str
    contract_type: ContractType
    sign_date: date
    effective_date: date
    expiry_date: date | None = None
    salary: float | None = None


class ContractOut(ContractCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: ContractStatus
