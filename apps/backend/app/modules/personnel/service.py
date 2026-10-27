import re
import unicodedata

from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.common.storage import delete_stored_file
from app.models.personnel import (
    Department,
    Employee,
    EmployeeCodeRegistry,
    EmployeeDocument,
    Position,
)
from app.modules.personnel.schemas import (
    DepartmentCreate,
    DepartmentUpdate,
    EmployeeCreate,
    EmployeeUpdate,
    PositionCreate,
    PositionUpdate,
)

# Dùng khi họ tên không còn chữ cái nào sau khi bỏ dấu/ký tự đặc biệt
EMPLOYEE_CODE_FALLBACK = "nv"

SORTABLE_FIELDS = {
    "full_name": Employee.full_name,
    "start_date": Employee.start_date,
}


def list_departments(db: Session) -> list[Department]:
    return db.query(Department).order_by(Department.name).all()


def get_department(db: Session, department_id: int) -> Department | None:
    return db.get(Department, department_id)


def department_code_exists(db: Session, code: str, exclude_id: int | None = None) -> bool:
    query = db.query(Department).filter(Department.code == code)
    if exclude_id:
        query = query.filter(Department.id != exclude_id)
    return db.query(query.exists()).scalar()


def create_department(db: Session, payload: DepartmentCreate) -> Department:
    department = Department(**payload.model_dump())
    db.add(department)
    db.commit()
    db.refresh(department)
    return department


def update_department(db: Session, department: Department, payload: DepartmentUpdate) -> Department:
    for field, value in payload.model_dump().items():
        setattr(department, field, value)
    db.commit()
    db.refresh(department)
    return department


def department_in_use(db: Session, department_id: int) -> bool:
    query = db.query(Employee).filter(Employee.department_id == department_id)
    return db.query(query.exists()).scalar()


def delete_department(db: Session, department: Department) -> None:
    db.delete(department)
    db.commit()


def list_positions(db: Session) -> list[Position]:
    return db.query(Position).order_by(Position.title).all()


def get_position(db: Session, position_id: int) -> Position | None:
    return db.get(Position, position_id)


def create_position(db: Session, payload: PositionCreate) -> Position:
    position = Position(**payload.model_dump())
    db.add(position)
    db.commit()
    db.refresh(position)
    return position


def update_position(db: Session, position: Position, payload: PositionUpdate) -> Position:
    for field, value in payload.model_dump().items():
        setattr(position, field, value)
    db.commit()
    db.refresh(position)
    return position


def position_in_use(db: Session, position_id: int) -> bool:
    query = db.query(Employee).filter(Employee.position_id == position_id)
    return db.query(query.exists()).scalar()


def delete_position(db: Session, position: Position) -> None:
    db.delete(position)
    db.commit()


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


def employee_code_base(full_name: str) -> str:
    """'Đặng Văn Long' -> 'longdv': tên + chữ cái đầu của họ và đệm, không dấu, chữ thường.

    Bỏ mọi ký tự không phải a-z (kể cả chữ số) để phần số đuôi do
    generate_employee_code() thêm vào không bị nhập nhằng."""

    plain = unicodedata.normalize("NFD", full_name.replace("Đ", "D").replace("đ", "d"))
    plain = "".join(c for c in plain if unicodedata.category(c) != "Mn").lower()
    words = [w for w in (re.sub(r"[^a-z]", "", w) for w in plain.split()) if w]
    if not words:
        return EMPLOYEE_CODE_FALLBACK
    return words[-1] + "".join(w[0] for w in words[:-1])


def generate_employee_code(db: Session, full_name: str) -> str:
    """Sinh mã nhân viên: longdv, nếu đã từng cấp thì longdv1, longdv2...

    Tra trong EmployeeCodeRegistry (mọi mã từng cấp, kể cả của nhân viên đã nghỉ/bị xoá)
    chứ không chỉ bảng employees. Lấy số đuôi lớn nhất đã dùng + 1, không lấp chỗ trống."""

    base = employee_code_base(full_name)
    used_codes = (
        db.query(EmployeeCodeRegistry.code)
        .filter(EmployeeCodeRegistry.code.like(f"{base}%"))
        .all()
    )
    max_suffix = -1
    for (code,) in used_codes:
        suffix = code[len(base) :]
        if suffix == "":
            max_suffix = max(max_suffix, 0)
        elif suffix.isdigit():
            max_suffix = max(max_suffix, int(suffix))

    return base if max_suffix < 0 else f"{base}{max_suffix + 1}"


def national_id_exists(db: Session, national_id: str, exclude_id: int | None = None) -> bool:
    query = db.query(Employee).filter(Employee.national_id == national_id)
    if exclude_id:
        query = query.filter(Employee.id != exclude_id)
    return db.query(query.exists()).scalar()


MAX_EMPLOYEE_CODE_RETRIES = 5


def create_employee(db: Session, payload: EmployeeCreate) -> Employee:
    """Sinh employee_code và tạo nhân viên trong cùng 1 bước. Mã hiển thị trên form chỉ
    là bản xem trước (GET /employees/code-preview), mã thật được chốt ở đây. Nếu 2 request
    tạo cùng lúc tính ra trùng mã (đụng độ hiếm gặp), PK của EmployeeCodeRegistry sẽ chặn -
    retry sinh mã mới vài lần thay vì báo lỗi ngay."""

    data = payload.model_dump()
    last_error: IntegrityError | None = None

    for _ in range(MAX_EMPLOYEE_CODE_RETRIES):
        code = generate_employee_code(db, payload.full_name)
        # Đăng ký mã cùng transaction: PK của registry chặn đụng độ, rollback thì bỏ cả 2
        db.add(EmployeeCodeRegistry(code=code))
        employee = Employee(**data, employee_code=code)
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


def add_document(
    db: Session, employee_id: int, doc_type: str, file_name: str, file_url: str
) -> EmployeeDocument:
    """Thêm tài liệu đính kèm hồ sơ (hợp đồng, phụ lục, tài liệu khác). Luôn thêm mới,
    không ghi đè - gỡ file sai bằng delete_document()."""

    document = EmployeeDocument(
        employee_id=employee_id,
        doc_type=doc_type,
        file_name=file_name,
        file_url=file_url,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


def get_document(db: Session, employee_id: int, document_id: int) -> EmployeeDocument | None:
    return (
        db.query(EmployeeDocument)
        .filter(EmployeeDocument.id == document_id, EmployeeDocument.employee_id == employee_id)
        .first()
    )


def delete_document(db: Session, document: EmployeeDocument) -> None:
    """Xóa hẳn tài liệu: bản ghi DB + file trên đĩa."""
    delete_stored_file(document.file_url)
    db.delete(document)
    db.commit()
