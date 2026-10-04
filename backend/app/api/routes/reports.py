from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.models.analysis import Analysis
from app.models.report import Report
from app.services import pdf_service, labels

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/{analysis_id}/download")
def download_report(
    analysis_id: int,
    lang: Optional[str] = Query(default=None, description="Report language: fr or en (default fr)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate (or serve cached) PDF report for an analysis (EF16), in French or English."""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")

    if current_user.role == UserRole.patient and analysis.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    lang = labels.normalize_lang(lang)
    pdf_path = pdf_service.REPORTS_DIR / pdf_service.report_filename(analysis.id, lang)

    # Cached per analysis and language; generate on first request
    if not pdf_path.exists():
        patient = analysis.patient
        predictions = [
            {
                "disease":    p.disease.name,
                "confidence": p.confidence_score,
                "rank":       p.rank,
                "specialist": p.disease.specialist or "",
            }
            for p in sorted(analysis.predictions, key=lambda x: x.rank)
        ]
        pdf_service.generate(
            analysis_id=analysis.id,
            patient_name=patient.full_name,
            patient_age=patient.age,
            patient_gender=patient.gender,
            symptoms=[s.name for s in analysis.symptoms],
            symptom_duration=analysis.symptom_duration,
            severity=analysis.severity,
            predictions=predictions,
            urgency_level=analysis.urgency_level.value if analysis.urgency_level else "low",
            recommended_specialist=analysis.recommended_specialist or "",
            explanation_json=analysis.explanation,
            created_at=analysis.created_at,
            lang=lang,
            free_text=analysis.free_text,
            red_flags=(analysis.ml_details or {}).get("red_flags"),
            output_path=pdf_path,
        )

    # One Report row per analysis (used for platform statistics)
    report = db.query(Report).filter(Report.analysis_id == analysis.id).first()
    if report is None:
        db.add(Report(analysis_id=analysis.id, file_path=str(pdf_path)))
    else:
        report.file_path = str(pdf_path)
    db.commit()

    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=pdf_path.name,
        headers={"Content-Disposition": f'attachment; filename="{pdf_path.name}"'},
    )
