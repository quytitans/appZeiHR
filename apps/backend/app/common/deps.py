from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.personnel import Employee
from app.models.user import Role, User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")

CREDENTIALS_ERROR = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Không thể xác thực thông tin đăng nhập",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    payload = decode_access_token(token)
    if payload is None or payload.get("sub") is None:
        raise CREDENTIALS_ERROR

    user = db.get(User, int(payload["sub"]))
    if user is None or not user.is_active:
        raise CREDENTIALS_ERROR
    return user


def require_roles(*allowed_roles: Role):
    """Dependency factory áp RBAC theo bảng phân quyền SRS mục 2.1."""

    def _checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền thực hiện thao tác này",
            )
        return current_user

    return _checker


def get_current_employee(current_user: User = Depends(get_current_user)) -> Employee:
    """Hồ sơ nhân viên gắn với tài khoản đang đăng nhập - dùng cho thao tác "của tôi"
    (tạo đơn nghỉ, duyệt đơn...). Tài khoản hệ thống như admin@hrm.local không có hồ sơ."""
    if current_user.employee is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tài khoản chưa liên kết hồ sơ nhân viên",
        )
    return current_user.employee
