from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import require_doctor_or_admin, get_current_user
from app.models.user import User
from app.models.analysis import Analysis
from app.models.doctor_comment import DoctorComment
from app.schemas.doctor import DoctorCommentCreate, DoctorCommentOut
from app.schemas.analysis import AnalysisOut, PredictionOut
from typing import List

router = APIRouter(prefix="/api/doctor", tags=["doctor"])


@router.get("/analyses", response_model=List[dict])
def list_patient_analyses(
    db: Session = Depends(get_db),
    _: User = Depends(require_doctor_or_admin),
):
    """EF18 — list all analyses across patients."""
    analyses = db.query(Analysis).order_by(Analysis.created_at.desc()).limit(100).all()
    return [
        {
            "id":                     a.id,
            "patient_name":           a.patient.full_name,
            "patient_id":             a.patient_id,
            "urgency_level":          a.urgency_level.value if a.urgency_level else None,
            "recommended_specialist": a.recommended_specialist,
            "top_disease":            a.predictions[0].disease.name if a.predictions else None,
            "has_comment":            a.doctor_comment is not None,
            "created_at":             a.created_at.isoformat(),
        }
        for a in analyses
    ]


@router.get("/analyses/{analysis_id}")
def get_analysis_detail(
    analysis_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_doctor_or_admin),
):
    a = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not a:
        raise HTTPException(status_code=404)
    return {
        "id":                     a.id,
        "patient_name":           a.patient.full_name,
        "patient_age":            a.patient.age,
        "patient_gender":         a.patient.gender,
        "symptoms":               [s.name for s in a.symptoms],
        "symptom_duration":       a.symptom_duration,
        "severity":               a.severity,
        "urgency_level":          a.urgency_level.value if a.urgency_level else None,
        "recommended_specialist": a.recommended_specialist,
        "explanation":            a.explanation,
        "predictions":            [
            {"disease": p.disease.name, "confidence": p.confidence_score, "rank": p.rank}
            for p in sorted(a.predictions, key=lambda x: x.rank)
        ],
        "doctor_comment":         {
            "comment":           a.doctor_comment.comment,
            "corrected_disease": a.doctor_comment.corrected_disease,
            "is_validated":      a.doctor_comment.is_validated,
        } if a.doctor_comment else None,
        "created_at": a.created_at.isoformat(),
    }


@router.post("/analyses/{analysis_id}/comment", response_model=DoctorCommentOut, status_code=201)
def add_comment(
    analysis_id: int,
    data: DoctorCommentCreate,
    db: Session = Depends(get_db),
    doctor: User = Depends(require_doctor_or_admin),
):
    """EF19 & EF20 — add/update comment and validate prediction."""
    a = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not a:
        raise HTTPException(status_code=404)

    existing = db.query(DoctorComment).filter(DoctorComment.analysis_id == analysis_id).first()
    if existing:
        existing.comment           = data.comment
        existing.corrected_disease = data.corrected_disease
        existing.is_validated      = data.is_validated
        existing.doctor_id         = doctor.id
        db.commit()
        db.refresh(existing)
        return existing

    comment = DoctorComment(
        analysis_id=analysis_id,
        doctor_id=doctor.id,
        comment=data.comment,
        corrected_disease=data.corrected_disease,
        is_validated=data.is_validated,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment
