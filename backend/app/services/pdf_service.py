"""
PDF report generator using fpdf2 (pure Python, no heavy deps).
Produces a professional medical report for a completed analysis.
"""
from __future__ import annotations
import json
from datetime import datetime
from pathlib import Path
from fpdf import FPDF, XPos, YPos

REPORTS_DIR = Path(__file__).parent.parent.parent / "reports"
REPORTS_DIR.mkdir(exist_ok=True)

URGENCY_FR = {
    "low":       "Faible",
    "moderate":  "Modere",
    "high":      "Eleve",
    "emergency": "URGENCE",
}
URGENCY_COLOR = {
    "low":       (39, 174, 96),
    "moderate":  (243, 156, 18),
    "high":      (231, 76, 60),
    "emergency": (192, 57, 43),
}

# ── palette ──────────────────────────────────────────────────────────────────
PRIMARY   = (41, 128, 185)
DARK      = (44, 62, 80)
LIGHT_BG  = (236, 240, 241)
WHITE     = (255, 255, 255)
GRAY      = (127, 140, 141)
SEPARATOR = (189, 195, 199)


class MedicalPDF(FPDF):
    def __init__(self, patient_name: str):
        super().__init__()
        self._patient_name = patient_name
        self.set_auto_page_break(auto=True, margin=20)
        self.set_margins(20, 20, 20)

    # ── header / footer ──────────────────────────────────────────────────────
    def header(self):
        self.set_fill_color(*PRIMARY)
        self.rect(0, 0, 210, 22, style="F")
        self.set_y(5)
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(*WHITE)
        self.cell(0, 12, "AI Medical Assistant", align="L", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_font("Helvetica", "", 8)
        self.set_y(14)
        self.cell(0, 6, "Rapport d'analyse medicale - Document informatif uniquement",
                  align="L", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_text_color(*DARK)
        self.ln(6)

    def footer(self):
        self.set_y(-14)
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(*GRAY)
        self.cell(0, 5,
                  "Ce document est genere automatiquement a titre indicatif. "
                  "Il ne remplace pas un avis medical. Consultez un professionnel de sante.",
                  align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.cell(0, 5, f"Page {self.page_no()}", align="C")

    # ── helpers ───────────────────────────────────────────────────────────────
    def section_title(self, text: str):
        self.ln(4)
        self.set_fill_color(*LIGHT_BG)
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*PRIMARY)
        self.cell(0, 9, f"  {text}", fill=True,
                  new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_text_color(*DARK)
        self.ln(2)

    def kv_row(self, label: str, value: str, bold_value: bool = False):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*GRAY)
        self.cell(55, 7, label + " :", new_x=XPos.RIGHT, new_y=YPos.LAST)
        self.set_font("Helvetica", "B" if bold_value else "", 10)
        self.set_text_color(*DARK)
        self.cell(0, 7, value, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def thin_line(self):
        self.set_draw_color(*SEPARATOR)
        self.line(20, self.get_y(), 190, self.get_y())
        self.ln(2)


def generate(
    analysis_id: int,
    patient_name: str,
    patient_age: int | None,
    patient_gender: str | None,
    symptoms: list[str],
    symptom_duration: str | None,
    severity: int | None,
    predictions: list[dict],
    urgency_level: str,
    recommended_specialist: str,
    explanation_json: str | None,
    created_at: datetime,
) -> Path:
    """
    Build the PDF and return its path on disk.
    predictions = [{"disease": str, "confidence": float, "rank": int, "specialist": str}, ...]
    """
    pdf = MedicalPDF(patient_name)
    pdf.add_page()

    # ── 1. Patient info ────────────────────────────────────────────────────
    pdf.section_title("Informations du patient")
    pdf.kv_row("Nom complet",   patient_name)
    pdf.kv_row("Age",           str(patient_age) + " ans" if patient_age else "Non renseigne")
    pdf.kv_row("Sexe",          patient_gender.capitalize() if patient_gender else "Non renseigne")
    pdf.kv_row("Date d'analyse", created_at.strftime("%d/%m/%Y a %H:%M"))
    pdf.kv_row("Ref. analyse",  f"#ANA-{analysis_id:05d}")

    # ── 2. Symptoms ────────────────────────────────────────────────────────
    pdf.section_title("Symptomes declares")
    if symptom_duration:
        pdf.kv_row("Duree",    symptom_duration)
    if severity:
        pdf.kv_row("Severite", f"{severity}/10")
    pdf.ln(1)
    pdf.set_font("Helvetica", "", 10)
    symptom_text = " | ".join(s.replace("_", " ").title() for s in symptoms)
    pdf.set_fill_color(*LIGHT_BG)
    pdf.multi_cell(0, 7, symptom_text, fill=True,
                   new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    # ── 3. Urgency ─────────────────────────────────────────────────────────
    pdf.section_title("Niveau d'urgence")
    color = URGENCY_COLOR.get(urgency_level, GRAY)
    label = URGENCY_FR.get(urgency_level, urgency_level.upper())
    pdf.set_fill_color(*color)
    pdf.set_text_color(*WHITE)
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 12, f"  {label}", fill=True,
             new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_text_color(*DARK)
    pdf.ln(2)
    pdf.kv_row("Specialiste recommande", recommended_specialist, bold_value=True)

    # ── 4. Predictions ─────────────────────────────────────────────────────
    pdf.section_title("Predictions du modele IA (Top 5)")

    col_w = [8, 80, 42, 40]
    headers = ["#", "Maladie", "Confiance", "Specialiste"]
    pdf.set_fill_color(*PRIMARY)
    pdf.set_text_color(*WHITE)
    pdf.set_font("Helvetica", "B", 9)
    for w, h in zip(col_w, headers):
        pdf.cell(w, 8, h, border=0, fill=True, align="C",
                 new_x=XPos.RIGHT, new_y=YPos.LAST)
    pdf.ln()

    for i, pred in enumerate(predictions[:5]):
        pdf.set_fill_color(*(LIGHT_BG if i % 2 == 0 else WHITE))
        pdf.set_text_color(*DARK)
        pdf.set_font("Helvetica", "B" if i == 0 else "", 9)
        conf_pct = f"{pred['confidence'] * 100:.1f}%"
        cells = [
            (col_w[0], str(pred["rank"])),
            (col_w[1], pred["disease"]),
            (col_w[2], conf_pct),
            (col_w[3], pred.get("specialist", "")),
        ]
        for w, val in cells:
            pdf.cell(w, 7, val, fill=True, align="C",
                     new_x=XPos.RIGHT, new_y=YPos.LAST)
        pdf.ln()

    # Confidence bar for rank-1
    if predictions:
        top = predictions[0]
        conf = top["confidence"]
        pdf.ln(4)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(*GRAY)
        pdf.cell(0, 5, f"Confiance #1 ({top['disease']}) : {conf*100:.1f}%",
                 new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        bar_w = int(conf * 150)
        pdf.set_fill_color(*PRIMARY)
        pdf.rect(20, pdf.get_y(), bar_w, 5, style="F")
        pdf.set_fill_color(*LIGHT_BG)
        pdf.rect(20 + bar_w, pdf.get_y(), 150 - bar_w, 5, style="F")
        pdf.ln(8)

    # ── 5. Explanation ─────────────────────────────────────────────────────
    if explanation_json:
        try:
            explanation = json.loads(explanation_json)
            if explanation:
                pdf.section_title("Explication de la prediction (IA)")
                pdf.set_font("Helvetica", "", 9)
                pdf.set_text_color(*GRAY)
                pdf.cell(0, 5,
                         "Contribution de chaque symptome a la prediction principale :",
                         new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.ln(2)

                max_val = max(abs(v) for v in explanation.values()) or 1
                for sym, score in list(explanation.items())[:8]:
                    label = sym.replace("_", " ").title()
                    bar_len = int(abs(score) / max_val * 80)
                    color = (39, 174, 96) if score >= 0 else (231, 76, 60)
                    sign = "+" if score >= 0 else "-"

                    pdf.set_text_color(*DARK)
                    pdf.set_font("Helvetica", "", 8)
                    pdf.cell(65, 6, label, new_x=XPos.RIGHT, new_y=YPos.LAST)
                    pdf.set_fill_color(*color)
                    pdf.rect(pdf.get_x(), pdf.get_y() + 1, bar_len, 4, style="F")
                    pdf.set_x(pdf.get_x() + bar_len + 2)
                    pdf.set_text_color(*color)
                    pdf.cell(20, 6, f"{sign}{abs(score):.3f}",
                             new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        except (json.JSONDecodeError, ValueError):
            pass

    # ── 6. Disclaimer ──────────────────────────────────────────────────────
    pdf.section_title("Avertissement important")
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(*GRAY)
    pdf.multi_cell(
        0, 6,
        "Ce rapport est genere par un systeme d'intelligence artificielle a titre INDICATIF uniquement. "
        "Les resultats ne constituent pas un diagnostic medical. Consultez obligatoirement un "
        "professionnel de sante qualifie avant toute decision medicale. En cas d'urgence, "
        "appelez le 15 (SAMU) ou le 18 (Pompiers).",
        new_x=XPos.LMARGIN, new_y=YPos.NEXT,
    )

    # ── Save ───────────────────────────────────────────────────────────────
    filename = f"report_ANA{analysis_id:05d}_{created_at.strftime('%Y%m%d_%H%M%S')}.pdf"
    path = REPORTS_DIR / filename
    pdf.output(str(path))
    return path
