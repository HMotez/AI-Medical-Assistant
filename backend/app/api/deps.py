from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole

bearer_scheme = HTTPBearer()


def _get_user_from_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(User).filter(User.id == int(user_id), User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def get_current_user(user: User = Depends(_get_user_from_token)) -> User:
    return user


def require_role(*roles: UserRole):
    def _guard(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        # A doctor account only gets doctor access once an administrator verified it
        if user.role == UserRole.doctor and not user.is_verified_doctor:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor account awaiting verification")
        return user
    return _guard


require_patient = require_role(UserRole.patient)
require_doctor  = require_role(UserRole.doctor)
require_admin   = require_role(UserRole.admin)
require_doctor_or_admin = require_role(UserRole.doctor, UserRole.admin)
