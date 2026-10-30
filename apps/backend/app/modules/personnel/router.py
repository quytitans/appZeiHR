from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.common.deps import get_current_user, require_roles
from app.common.storage import save_pdf_upload
from app.db.session import get_db
from app.models.user import Role
from app.modules.personnel import service
from app.modules.personnel.schemas import (
    CreateAccountPayload,
    DepartmentCreate,
    DepartmentOut,
    DepartmentUpdate,
    EmployeeCodePreviewOut,
    EmployeeCreate,
    EmployeeCreateResult,
    EmployeeDocumentType,
    EmployeeOut,
    EmployeePageOut,
    EmployeeUpdate,
    PositionCreate,
    PositionOut,
    PositionUpdate,
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
    if service.department_code_exists(db, payload.code):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Mã phòng ban đã tồn tại")
    return service.create_department(db, payload)


@router.put(
    "/departments/{department_id}",
    response_model=DepartmentOut,
    dependencies=[Depends(require_roles(*MANAGE_ROLES))],
)
def update_department(department_id: int, payload: DepartmentUpdate, db: Session = Depends(get_db)):
    department = service.get_department(db, department_id)
    if not department:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy phòng ban")
    if service.department_code_exists(db, payload.code, exclude_id=department_id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Mã phòng ban đã tồn tại")
    return service.update_department(db, department, payload)


@router.delete(
    "/departments/{department_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(*MANAGE_ROLES))],
)
def delete_department(department_id: int, db: Session = Depends(get_db)):
    department = service.get_department(db, department_id)
    if not department:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy phòng ban")
    if service.department_in_use(db, department_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Không thể xóa: đang có nhân viên thuộc phòng ban này",
        )
    service.delete_department(db, department)


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


@router.put(
    "/positions/{position_id}",
    response_model=PositionOut,
    dependencies=[Depends(require_roles(*MANAGE_ROLES))],
)
def update_position(position_id: int, payload: PositionUpdate, db: Session = Depends(get_db)):
    position = service.get_position(db, position_id)
    if not position:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy chức vụ")
    return service.update_position(db, position, payload)


@router.delete(
    "/positions/{position_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(*MANAGE_ROLES))],
)
def delete_position(position_id: int, db: Session = Depends(get_db)):
    position = service.get_position(db, position_id)
    if not position:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy chức vụ")
    if service.position_in_use(db, position_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Không thể xóa: đang có nhân viên giữ chức vụ này",
        )
    service.delete_position(db, position)


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


# Phải khai báo TRƯỚC /employees/{employee_id}, nếu không "code-preview" bị parse thành id
@router.get(
    "/employees/code-preview",
    response_model=EmployeeCodePreviewOut,
    dependencies=[Depends(require_roles(*MANAGE_ROLES))],
)
def preview_employee_code(
    full_name: str = Query(..., min_length=1, max_length=255), db: Session = Depends(get_db)
):
    """Mã nhân viên dự kiến cho form thêm mới. Chỉ để xem trước, không giữ chỗ - mã thật
    được chốt lúc POST /employees và có thể tăng số đuôi nếu có người tạo trước."""
    return EmployeeCodePreviewOut(employee_code=service.generate_employee_code(db, full_name))


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


def _assert_company_email_not_duplicate(
    db: Session, email: str | None, exclude_id: int | None = None
) -> None:
    if not email:
        return
    if service.company_email_exists(db, email, exclude_id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email đã được sử dụng")
    if service.login_email_exists(db, email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email này đã là tài khoản đăng nhập của người khác"
        )


@router.post(
    "/employees",
    response_model=EmployeeCreateResult,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(*MANAGE_ROLES))],
)
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db)):
    """employee_code KHÔNG nhận từ client - service.create_employee tự sinh mã từ họ tên
    ngay lúc tạo để tránh đụng độ giữa nhiều người dùng cùng thao tác. Nếu có company_email,
    tự tạo kèm tài khoản đăng nhập - response.temp_password chỉ xuất hiện đúng lần này."""
    _assert_national_id_not_duplicate(db, payload.national_id)
    _assert_company_email_not_duplicate(db, payload.company_email)
    employee, temp_password = service.create_employee(db, payload)
    result = EmployeeCreateResult.model_validate(employee)
    result.temp_password = temp_password
    return result


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
    _assert_company_email_not_duplicate(db, payload.company_email, exclude_id=employee_id)
    return service.update_employee(db, employee, payload)


@router.post(
    "/employees/{employee_id}/account",
    response_model=EmployeeCreateResult,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(*MANAGE_ROLES))],
)
def create_employee_account(
    employee_id: int, payload: CreateAccountPayload, db: Session = Depends(get_db)
):
    """Tạo tài khoản đăng nhập cho nhân viên đã có sẵn nhưng chưa được gắn account (vd nhân
    viên tạo trước khi tính năng tự-tạo-tài-khoản-lúc-thêm-mới có)."""
    employee = service.get_employee(db, employee_id)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy nhân viên")
    if employee.user_id is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Nhân viên đã có tài khoản")
    if not employee.company_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nhân viên cần có Email trước khi tạo tài khoản - cập nhật hồ sơ trước",
        )
    if service.login_email_exists(db, employee.company_email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email này đã là tài khoản đăng nhập của người khác"
        )

    temp_password = service.create_account_for_employee(db, employee, payload.role)
    result = EmployeeCreateResult.model_validate(employee)
    result.temp_password = temp_password
    return result


@router.post(
    "/employees/{employee_id}/documents",
    response_model=EmployeeOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(*MANAGE_ROLES))],
)
def upload_document(
    employee_id: int,
    file: UploadFile = File(...),
    doc_type: EmployeeDocumentType = Query("employment_contract"),
    db: Session = Depends(get_db),
):
    """Tải lên tài liệu PDF (hợp đồng, phụ lục, tài liệu khác) cho nhân viên - SRS
    3.1.2.A/D. Luôn thêm mới, giữ nguyên các tài liệu đã có."""
    employee = service.get_employee(db, employee_id)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy nhân viên")

    file_name, file_url = save_pdf_upload(file, subdir="employee_documents")
    service.add_document(db, employee_id, doc_type, file_name, file_url)
    return service.get_employee(db, employee_id)


@router.delete(
    "/employees/{employee_id}/documents/{document_id}",
    response_model=EmployeeOut,
    dependencies=[Depends(require_roles(*MANAGE_ROLES))],
)
def delete_document(employee_id: int, document_id: int, db: Session = Depends(get_db)):
    document = service.get_document(db, employee_id, document_id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tài liệu")
    service.delete_document(db, document)
    return service.get_employee(db, employee_id)
