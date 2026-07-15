from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, require_admin
from app.schemas.user import UserOut, UserUpdate
from app.services import user_service
from app.models.user import User
from typing import List

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_service.update_user(db, current_user, data)


@router.delete("/me", status_code=204)
def delete_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_service.delete_user(db, current_user)


# Admin only
@router.get("/", response_model=List[UserOut], dependencies=[Depends(require_admin)])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).all()


@router.delete("/{user_id}", status_code=204, dependencies=[Depends(require_admin)])
def admin_delete_user(user_id: int, db: Session = Depends(get_db)):
    user = user_service.get_by_id(db, user_id)
    if user:
        user_service.delete_user(db, user)
