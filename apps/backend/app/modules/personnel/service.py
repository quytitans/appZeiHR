from datetime import date

from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.models.personnel import Department, Employee, EmployeeDocument, Position
from app.modules.personnel.schemas import (
    DepartmentCreate,
    EmployeeCreate,
    EmployeeUpdate,
    PositionCreate,
)

EMPLOYMENT_CONTRACT_DOC_TYPE = "employment_contract"
EMPLOYEE_CODE_PREFIX = "ZEI"

SORTABLE_FIELDS = {
    "full_name": Employee.full_name,
    "start_date": Employee.start_date,
}


def list_departments(db: Session) -> list[Department]:
    return db.query(Department).all()


def create_department(db: Session, payload: DepartmentCreate) -> Department:
    department = Department(**payload.model_dump())
    db.add(department)
    db.commit()
    db.refresh(department)
    return department


def list_positions(db: Session) -> list[Position]:
    return db.query(Position).all()


def create_position(db: Session, payload: PositionCreate) -> Position:
    position = Position(**payload.model_dump())
    db.add(position)
    db.commit()
    db.refresh(position)
    return position


def _employee_query(db: Session):
    return db.query(Employee).options(
        selectinload(Employee.department),
        selectinload(Employee.position),
        selectinload(Employee.documents),
    )


def list_employees(
    db: Session,
    search: str | None,
    page: int,
    page_size: int,
    sort_by: str,
    sort_dir: str,
) -> tuple[list[Employee], int]:
    """Tìm kiếm đa trường (mã NV, họ tên, email, CCCD), không phân biệt hoa/thường,
    khớp một phần chuỗi - SRS 3.1.2.C."""

    query = _employee_query(db)

    if search:
        pattern = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Employee.employee_code).like(pattern),
                func.lower(Employee.full_name).like(pattern),
                func.lower(Employee.company_email).like(pattern),
                func.lower(Employee.national_id).like(pattern),
            )
        )

    total = query.order_by(None).with_entities(func.count(Employee.id)).scalar() or 0

    sort_column = SORTABLE_FIELDS.get(sort_by, Employee.full_name)
    sort_column = sort_column.desc() if sort_dir == "desc" else sort_column.asc()

    items = (
        query.order_by(sort_column)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def get_employee(db: Session, employee_id: int) -> Employee | None:
    return _employee_query(db).filter(Employee.id == employee_id).first()


def generate_next_employee_code(db: Session) -> str:
    """Sinh mã nhân viên tự động dạng ZEI<YYYYMM><STT 3 chữ số>, vd ZEI202608001.

    STT reset theo từng tháng, tính bằng cách lấy số lớn nhất đã dùng trong tháng hiện
    tại + 1 (không dùng COUNT vì nhân viên có thể bị xoá làm lệch số thứ tự)."""

    today = date.today()
    prefix = f"{EMPLOYEE_CODE_PREFIX}{today.year:04d}{today.month:02d}"

    existing_codes = (
        db.query(Employee.employee_code)
        .filter(Employee.employee_code.like(f"{prefix}%"))
        .all()
    )
    max_seq = 0
    for (code,) in existing_codes:
        suffix = code[len(prefix) :]
        if suffix.isdigit():
            max_seq = max(max_seq, int(suffix))

    return f"{prefix}{max_seq + 1:03d}"


def national_id_exists(db: Session, national_id: str, exclude_id: int | None = None) -> bool:
    query = db.query(Employee).filter(Employee.national_id == national_id)
    if exclude_id:
        query = query.filter(Employee.id != exclude_id)
    return db.query(query.exists()).scalar()


MAX_EMPLOYEE_CODE_RETRIES = 5


def create_employee(db: Session, payload: EmployeeCreate) -> Employee:
    """Sinh employee_code và tạo nhân viên trong cùng 1 bước (không sinh mã trước khi
    người dùng bấm Lưu). Nếu 2 request tạo cùng lúc tính ra trùng mã (đụng độ hiếm gặp),
    unique constraint ở DB sẽ chặn - retry sinh mã mới vài lần thay vì báo lỗi ngay."""

    data = payload.model_dump()
    last_error: IntegrityError | None = None

    for _ in range(MAX_EMPLOYEE_CODE_RETRIES):
        employee = Employee(**data, employee_code=generate_next_employee_code(db))
        db.add(employee)
        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            last_error = exc
            continue
        db.refresh(employee)
        return get_employee(db, employee.id)  # type: ignore[return-value]

    raise last_error or RuntimeError("Không thể sinh mã nhân viên duy nhất")


def update_employee(db: Session, employee: Employee, payload: EmployeeUpdate) -> Employee:
    for field, value in payload.model_dump().items():
        setattr(employee, field, value)
    db.commit()
    db.refresh(employee)
    return get_employee(db, employee.id)  # type: ignore[return-value]


def add_contract_document(
    db: Session, employee_id: int, file_name: str, file_url: str
) -> EmployeeDocument:
    document = EmployeeDocument(
        employee_id=employee_id,
        doc_type=EMPLOYMENT_CONTRACT_DOC_TYPE,
        file_name=file_name,
        file_url=file_url,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document
