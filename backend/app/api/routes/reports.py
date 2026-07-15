from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.models.analysis import Analysis
from app.models.report import Report
from app.services import pdf_service

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/{analysis_id}/download")
def download_report(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate (or serve cached) PDF report for an analysis (EF16)."""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")

    if current_user.role == UserRole.patient and analysis.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    # Return cached PDF if already generated
    existing = db.query(Report).filter(Report.analysis_id == analysis_id).first()
    if existing:
        cached = Path(existing.file_path)
        if cached.exists():
            return FileResponse(
                path=str(cached),
                media_type="application/pdf",
                filename=cached.name,
            )
        # File was deleted — regenerate below and update record
        db.delete(existing)
        db.flush()

    # Gather data for PDF
    patient = analysis.patient
    symptoms = [s.name for s in analysis.symptoms]
    predictions = [
        {
            "disease":    p.disease.name,
            "confidence": p.confidence_score,
            "rank":       p.rank,
            "specialist": p.disease.specialist or "",
        }
        for p in sorted(analysis.predictions, key=lambda x: x.rank)
    ]

    pdf_path = pdf_service.generate(
        analysis_id=analysis.id,
        patient_name=patient.full_name,
        patient_age=patient.age,
        patient_gender=patient.gender,
        symptoms=symptoms,
        symptom_duration=analysis.symptom_duration,
        severity=analysis.severity,
        predictions=predictions,
        urgency_level=analysis.urgency_level.value if analysis.urgency_level else "low",
        recommended_specialist=analysis.recommended_specialist or "",
        explanation_json=analysis.explanation,
        created_at=analysis.created_at,
    )

    db.add(Report(analysis_id=analysis.id, file_path=str(pdf_path)))
    db.commit()

    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=pdf_path.name,
        headers={"Content-Disposition": f'attachment; filename="{pdf_path.name}"'},
    )
