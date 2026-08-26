from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.common.deps import require_roles
from app.core.security import hash_password
from app.db.session import get_db
from app.models.user import Role, User
from app.modules.users.schemas import UserCreate, UserOut

router = APIRouter(
    prefix="/users", tags=["users"], dependencies=[Depends(require_roles(Role.SYSTEM_ADMIN))]
)


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).all()


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email đã tồn tại")

    user = User(email=payload.email, hashed_password=hash_password(payload.password), role=payload.role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
