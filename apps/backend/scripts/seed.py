"""Seed dữ liệu ban đầu: 1 tài khoản System Admin mặc định.

Schema DB được quản lý bằng Alembic migration (`alembic upgrade head`), KHÔNG dùng
`Base.metadata.create_all()` nữa - xem alembic/versions/. Script này chỉ seed dữ liệu.

Chạy: python scripts/seed.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.security import hash_password
from app.db.base import Base  # noqa: F401 - import chuẩn hóa toàn bộ model registry trước khi query
from app.db.session import SessionLocal
from app.models.user import Role, User

DEFAULT_ADMIN_EMAIL = "admin@hrm.local"
DEFAULT_ADMIN_PASSWORD = "Admin@123"


def main() -> None:
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == DEFAULT_ADMIN_EMAIL).first()
        if existing:
            print(f"System Admin đã tồn tại: {DEFAULT_ADMIN_EMAIL}")
            return

        admin = User(
            email=DEFAULT_ADMIN_EMAIL,
            hashed_password=hash_password(DEFAULT_ADMIN_PASSWORD),
            role=Role.SYSTEM_ADMIN,
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print(f"Đã tạo System Admin mặc định: {DEFAULT_ADMIN_EMAIL} / {DEFAULT_ADMIN_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
