from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import json

from app.core.database import get_db
from app.api.deps import get_current_user, require_doctor_or_admin
from app.models.user import User, UserRole
from app.models.analysis import Analysis, UrgencyLevel
from app.models.prediction import Prediction
from app.models.disease import Disease
from app.models.symptom import Symptom
from app.schemas.analysis import AnalysisCreate, AnalysisOut, AnalysisSummary, PredictionOut, TrendPoint
from app.services import ml_service

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.post("/", response_model=AnalysisOut, status_code=201)
def run_analysis(
    data: AnalysisCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    symptom_names = data.symptom_names
    if not symptom_names and data.free_text:
        symptom_names = ml_service.extract_symptoms(data.free_text)["symptoms"]
    if not symptom_names:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one symptom required")

    result = ml_service.analyze(symptom_names, severity=data.severity)

    analysis = Analysis(
        patient_id=current_user.id,
        symptom_duration=data.symptom_duration,
        severity=data.severity,
        additional_info=data.additional_info,
        free_text=data.free_text,
        urgency_level=UrgencyLevel(result["urgency_level"]),
        recommended_specialist=result["recommended_specialist"],
        explanation=json.dumps(result["shap_explanation"]),
        ml_details=result.get("details"),
    )
    analysis.symptoms = _get_or_create_symptoms(db, symptom_names)
    db.add(analysis)
    db.flush()

    for pred in result["predictions"]:
        disease = db.query(Disease).filter(Disease.name == pred["disease"]).first()
        if not disease:
            disease = Disease(name=pred["disease"], specialist=pred["specialist"])
            db.add(disease)
            db.flush()

        db.add(Prediction(
            analysis_id=analysis.id,
            disease_id=disease.id,
            confidence_score=pred["confidence"],
            rank=pred["rank"],
            shap_values=result["shap_explanation"] if pred["rank"] == 1 else None,
        ))

    db.commit()
    db.refresh(analysis)

    return _build_response(analysis, result["predictions"])


@router.get("/", response_model=list[AnalysisSummary])
def list_my_analyses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Analysis)
        .filter(Analysis.patient_id == current_user.id)
        .order_by(Analysis.created_at.desc())
        .all()
    )


# ── Static-path routes MUST come before /{analysis_id} ─────────────

@router.get("/trends", response_model=list[TrendPoint])
def get_trends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20,
):
    analyses = (
        db.query(Analysis)
        .filter(Analysis.patient_id == current_user.id)
        .order_by(Analysis.created_at.asc())
        .limit(limit)
        .all()
    )
    points = []
    prev_disease = None
    for a in analyses:
        preds = sorted(a.predictions, key=lambda p: p.rank)
        if not preds:
            continue
        top = preds[0]
        disease_name = top.disease.name if top.disease else "Unknown"
        rank_shift = None
        if prev_disease:
            same_in_current = next(
                (p.rank for p in preds if p.disease and p.disease.name == prev_disease), None
            )
            if same_in_current is not None:
                rank_shift = 1 - same_in_current  # positive = improved (rank went down)
        points.append({
            "analysis_id": a.id,
            "date": a.created_at,
            "top_disease": disease_name,
            "confidence": round(top.confidence_score, 4),
            "urgency": a.urgency_level,
            "rank_shift": rank_shift,
        })
        prev_disease = disease_name
    return points


@router.get("/all/patients", response_model=list[AnalysisSummary], dependencies=[Depends(require_doctor_or_admin)])
def list_all_analyses(db: Session = Depends(get_db)):
    return db.query(Analysis).order_by(Analysis.created_at.desc()).limit(100).all()


# ── Dynamic-path route ──────────────────────────────────────────────

@router.get("/{analysis_id}", response_model=AnalysisOut)
def get_analysis(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    analysis = _get_or_404(db, analysis_id)
    if current_user.role == UserRole.patient and analysis.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    preds = _format_predictions(db, analysis)
    return _build_response(analysis, preds)


@router.delete("/{analysis_id}", status_code=204)
def delete_analysis(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    analysis = _get_or_404(db, analysis_id)
    if analysis.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    db.delete(analysis)
    db.commit()


# --- helpers ---

def _get_or_create_symptoms(db: Session, names: list[str]) -> list[Symptom]:
    symptoms = []
    for name in dict.fromkeys(n.strip().lower().replace(" ", "_") for n in names if n.strip()):
        symptom = db.query(Symptom).filter(Symptom.name == name).first()
        if not symptom:
            symptom = Symptom(name=name)
            db.add(symptom)
        symptoms.append(symptom)
    return symptoms


def _get_or_404(db: Session, analysis_id: int) -> Analysis:
    a = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not a:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return a


def _format_predictions(db: Session, analysis: Analysis) -> list[dict]:
    return [
        {
            "disease":    p.disease.name,
            "confidence": p.confidence_score,
            "rank":       p.rank,
            "specialist": p.disease.specialist or "Médecin généraliste",
        }
        for p in sorted(analysis.predictions, key=lambda p: p.rank)
    ]


def _doctor_review(analysis: Analysis) -> dict | None:
    c = analysis.doctor_comment
    if not c:
        return None
    return {
        "comment":           c.comment,
        "corrected_disease": c.corrected_disease,
        "is_validated":      c.is_validated,
        "doctor_name":       c.doctor.full_name if c.doctor else None,
    }


def _build_response(analysis: Analysis, predictions: list[dict]) -> dict:
    return {
        "id":                     analysis.id,
        "urgency_level":          analysis.urgency_level,
        "recommended_specialist": analysis.recommended_specialist,
        "explanation":            analysis.explanation,
        "predictions":            predictions,
        "symptoms":               [s.name for s in analysis.symptoms],
        "severity":               analysis.severity,
        "symptom_duration":       analysis.symptom_duration,
        "free_text":              analysis.free_text,
        "details":                analysis.ml_details or {},
        "doctor_review":          _doctor_review(analysis),
        "created_at":             analysis.created_at,
    }
