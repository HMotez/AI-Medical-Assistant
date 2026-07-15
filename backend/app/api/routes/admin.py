from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, status
from pydantic import BaseModel
from app.api.deps import require_admin
from app.models.user import User, UserRole
from app.schemas.user import UserOut

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _retrain_task():
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent.parent))
    from ml.src.trainer import train
    result = train()
    from ml.src.predictor import Predictor
    Predictor._instance = None
    print(f"Retrain complete: {result}")


@router.post("/retrain", status_code=202)
def retrain_model(
    background_tasks: BackgroundTasks,
    _: User = Depends(require_admin),
):
    background_tasks.add_task(_retrain_task)
    return {"message": "Retraining started in background"}


@router.get("/stats")
def get_stats(_: User = Depends(require_admin)):
    from app.core.database import SessionLocal
    from app.models.user import User as UserModel, UserRole
    from app.models.analysis import Analysis, UrgencyLevel
    from app.models.report import Report

    db = SessionLocal()
    try:
        total_patients  = db.query(UserModel).filter(UserModel.role == UserRole.patient).count()
        total_doctors   = db.query(UserModel).filter(UserModel.role == UserRole.doctor).count()
        total_admins    = db.query(UserModel).filter(UserModel.role == UserRole.admin).count()
        total_users     = total_patients + total_doctors + total_admins
        total_analyses  = db.query(Analysis).count()
        total_reports   = db.query(Report).count()

        return {
            "total_users":        total_users,
            "total_patients":     total_patients,
            "total_doctors":      total_doctors,
            "total_admins":       total_admins,
            "total_analyses":     total_analyses,
            "total_reports":      total_reports,
            "urgency_emergency":  db.query(Analysis).filter(Analysis.urgency_level == UrgencyLevel.emergency).count(),
            "urgency_high":       db.query(Analysis).filter(Analysis.urgency_level == UrgencyLevel.high).count(),
            "urgency_moderate":   db.query(Analysis).filter(Analysis.urgency_level == UrgencyLevel.moderate).count(),
            "urgency_low":        db.query(Analysis).filter(Analysis.urgency_level == UrgencyLevel.low).count(),
        }
    finally:
        db.close()


class RoleUpdate(BaseModel):
    role: UserRole


@router.patch("/users/{user_id}/role", response_model=UserOut)
def change_user_role(
    user_id: int,
    body: RoleUpdate,
    admin: User = Depends(require_admin),
):
    """Promote or demote a user's role (admin only). Cannot change your own role."""
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        if user_id == admin.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot change your own role")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        user.role = body.role
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()
