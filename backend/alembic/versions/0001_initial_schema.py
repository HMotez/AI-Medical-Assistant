"""initial_schema

Revision ID: 0001
Revises:
Create Date: 2026-06-29

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("email", sa.String(), nullable=False, unique=True, index=True),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("role", sa.Enum("patient", "doctor", "admin", name="userrole"), nullable=False, server_default="patient"),
        sa.Column("age", sa.Integer(), nullable=True),
        sa.Column("gender", sa.String(10), nullable=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now(), nullable=True),
    )

    op.create_table(
        "symptoms",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("name_fr", sa.String(100), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("body_system", sa.String(50), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true()),
    )

    op.create_table(
        "diseases",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("name", sa.String(150), nullable=False, unique=True),
        sa.Column("name_fr", sa.String(150), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("specialist", sa.String(100), nullable=True),
        sa.Column("icd10_code", sa.String(10), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true()),
    )

    op.create_table(
        "analyses",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("patient_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("symptom_duration", sa.String(50), nullable=True),
        sa.Column("severity", sa.Integer(), nullable=True),
        sa.Column("additional_info", sa.Text(), nullable=True),
        sa.Column("free_text", sa.Text(), nullable=True),
        sa.Column("urgency_level", sa.Enum("low", "moderate", "high", "emergency", name="urgencylevel"), nullable=True),
        sa.Column("recommended_specialist", sa.String(100), nullable=True),
        sa.Column("explanation", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "analysis_symptoms",
        sa.Column("analysis_id", sa.Integer(), sa.ForeignKey("analyses.id"), primary_key=True),
        sa.Column("symptom_id", sa.Integer(), sa.ForeignKey("symptoms.id"), primary_key=True),
    )

    op.create_table(
        "predictions",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("analysis_id", sa.Integer(), sa.ForeignKey("analyses.id"), nullable=False),
        sa.Column("disease_id", sa.Integer(), sa.ForeignKey("diseases.id"), nullable=False),
        sa.Column("confidence_score", sa.Float(), nullable=False),
        sa.Column("rank", sa.Integer(), nullable=False),
        sa.Column("shap_values", sa.JSON(), nullable=True),
    )

    op.create_table(
        "doctor_comments",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("analysis_id", sa.Integer(), sa.ForeignKey("analyses.id"), nullable=False, unique=True),
        sa.Column("doctor_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("comment", sa.Text(), nullable=False),
        sa.Column("corrected_disease", sa.Text(), nullable=True),
        sa.Column("is_validated", sa.Boolean(), server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "reports",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("analysis_id", sa.Integer(), sa.ForeignKey("analyses.id"), nullable=False, unique=True),
        sa.Column("file_path", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("reports")
    op.drop_table("doctor_comments")
    op.drop_table("predictions")
    op.drop_table("analysis_symptoms")
    op.drop_table("analyses")
    op.drop_table("diseases")
    op.drop_table("symptoms")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS urgencylevel")
    op.execute("DROP TYPE IF EXISTS userrole")
