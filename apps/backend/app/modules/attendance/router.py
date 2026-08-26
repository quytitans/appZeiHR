from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.common.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.attendance import AttendanceRecord, LeaveRequest
from app.models.user import Role
from app.modules.attendance.schemas import (
    CheckInOut,
    LeaveDecision,
    LeaveRequestCreate,
    LeaveRequestOut,
)

router = APIRouter(prefix="/attendance", tags=["attendance"], dependencies=[Depends(get_current_user)])

APPROVER_ROLES = (Role.LINE_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)


@router.post("/check-in/{employee_id}", response_model=CheckInOut, status_code=status.HTTP_201_CREATED)
def check_in(employee_id: int, request: Request, db: Session = Depends(get_db)):
    today = date.today()
    record = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.employee_id == employee_id, AttendanceRecord.work_date == today)
        .first()
    )
    if record and record.check_in:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Đã check-in hôm nay")

    if not record:
        record = AttendanceRecord(employee_id=employee_id, work_date=today)
        db.add(record)

    record.check_in = datetime.now()
    record.check_in_ip = request.client.host if request.client else None
    db.commit()
    db.refresh(record)
    return record


@router.post("/check-out/{employee_id}", response_model=CheckInOut)
def check_out(employee_id: int, request: Request, db: Session = Depends(get_db)):
    today = date.today()
    record = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.employee_id == employee_id, AttendanceRecord.work_date == today)
        .first()
    )
    if not record or not record.check_in:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Chưa check-in hôm nay")

    record.check_out = datetime.now()
    record.check_out_ip = request.client.host if request.client else None
    db.commit()
    db.refresh(record)
    return record


@router.get("/records", response_model=list[CheckInOut])
def list_attendance_records(db: Session = Depends(get_db)):
    return db.query(AttendanceRecord).all()


@router.get("/leave-requests", response_model=list[LeaveRequestOut])
def list_leave_requests(db: Session = Depends(get_db)):
    return db.query(LeaveRequest).all()


@router.post("/leave-requests", response_model=LeaveRequestOut, status_code=status.HTTP_201_CREATED)
def create_leave_request(payload: LeaveRequestCreate, db: Session = Depends(get_db)):
    leave_request = LeaveRequest(**payload.model_dump())
    db.add(leave_request)
    db.commit()
    db.refresh(leave_request)
    return leave_request


@router.patch(
    "/leave-requests/{leave_request_id}",
    response_model=LeaveRequestOut,
    dependencies=[Depends(require_roles(*APPROVER_ROLES))],
)
def decide_leave_request(leave_request_id: int, payload: LeaveDecision, db: Session = Depends(get_db)):
    leave_request = db.get(LeaveRequest, leave_request_id)
    if not leave_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy đơn nghỉ phép")

    leave_request.status = payload.status
    db.commit()
    db.refresh(leave_request)
    return leave_request
