from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.common.deps import get_current_user, require_roles
from app.common.storage import save_pdf_upload
from app.db.session import get_db
from app.models.user import Role
from app.modules.personnel import service
from app.modules.personnel.schemas import (
    DepartmentCreate,
    DepartmentOut,
    EmployeeCreate,
    EmployeeOut,
    EmployeePageOut,
    EmployeeUpdate,
    PositionCreate,
    PositionOut,
)

router = APIRouter(prefix="/personnel", tags=["personnel"], dependencies=[Depends(get_current_user)])

MANAGE_ROLES = (Role.HR_ADMIN, Role.SYSTEM_ADMIN)


@router.get("/departments", response_model=list[DepartmentOut])
def list_departments(db: Session = Depends(get_db)):
    return service.list_departments(db)


@router.post(
    "/departments",
    response_model=DepartmentOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(*MANAGE_ROLES))],
)
def create_department(payload: DepartmentCreate, db: Session = Depends(get_db)):
    return service.create_department(db, payload)


@router.get("/positions", response_model=list[PositionOut])
def list_positions(db: Session = Depends(get_db)):
    return service.list_positions(db)


@router.post(
    "/positions",
    response_model=PositionOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(*MANAGE_ROLES))],
)
def create_position(payload: PositionCreate, db: Session = Depends(get_db)):
    return service.create_position(db, payload)


@router.get("/employees", response_model=EmployeePageOut)
def list_employees(
    search: str | None = Query(None, description="Từ khóa tìm theo mã NV/họ tên/email/CCCD"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: Literal["full_name", "start_date"] = Query("full_name"),
    sort_dir: Literal["asc", "desc"] = Query("asc"),
    db: Session = Depends(get_db),
):
    items, total = service.list_employees(db, search, page, page_size, sort_by, sort_dir)
    return EmployeePageOut(items=items, total=total, page=page, page_size=page_size)


@router.get("/employees/{employee_id}", response_model=EmployeeOut)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    employee = service.get_employee(db, employee_id)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy nhân viên")
    return employee


def _assert_national_id_not_duplicate(
    db: Session, national_id: str | None, exclude_id: int | None = None
) -> None:
    if national_id and service.national_id_exists(db, national_id, exclude_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Số CCCD/CMND đã tồn tại"
        )


@router.post(
    "/employees",
    response_model=EmployeeOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(*MANAGE_ROLES))],
)
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db)):
    """employee_code KHÔNG nhận từ client - service.create_employee tự sinh mã ngay lúc
    tạo (không phải lúc mở form) để tránh đụng độ giữa nhiều người dùng cùng thao tác."""
    _assert_national_id_not_duplicate(db, payload.national_id)
    return service.create_employee(db, payload)


@router.put(
    "/employees/{employee_id}",
    response_model=EmployeeOut,
    dependencies=[Depends(require_roles(*MANAGE_ROLES))],
)
def update_employee(employee_id: int, payload: EmployeeUpdate, db: Session = Depends(get_db)):
    employee = service.get_employee(db, employee_id)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy nhân viên")
    _assert_national_id_not_duplicate(db, payload.national_id, exclude_id=employee_id)
    return service.update_employee(db, employee, payload)


@router.post(
    "/employees/{employee_id}/contract-document",
    response_model=EmployeeOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(*MANAGE_ROLES))],
)
def upload_contract_document(
    employee_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)
):
    """Tải lên file hợp đồng lao động PDF cho nhân viên - SRS 3.1.2.A/D."""
    employee = service.get_employee(db, employee_id)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy nhân viên")

    file_name, file_url = save_pdf_upload(file, subdir="employee_documents")
    service.add_contract_document(db, employee_id, file_name, file_url)
    return service.get_employee(db, employee_id)
