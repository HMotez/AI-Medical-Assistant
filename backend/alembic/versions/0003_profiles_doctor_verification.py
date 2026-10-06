"""profiles and doctor verification

Revision ID: 0003
Revises: 0002
Create Date: 2026-10-05

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

USER_COLUMNS = [
    sa.Column("avatar_path", sa.String(64), nullable=True),
    sa.Column("city", sa.String(100), nullable=True),
    sa.Column("bio", sa.Text(), nullable=True),
    sa.Column("blood_type", sa.String(3), nullable=True),
    sa.Column("height_cm", sa.Integer(), nullable=True),
    sa.Column("weight_kg", sa.Float(), nullable=True),
    sa.Column("allergies", sa.Text(), nullable=True),
    sa.Column("chronic_conditions", sa.Text(), nullable=True),
    sa.Column("medications", sa.Text(), nullable=True),
    sa.Column("emergency_contact_name", sa.String(100), nullable=True),
    sa.Column("emergency_contact_phone", sa.String(20), nullable=True),
    sa.Column("specialty", sa.String(100), nullable=True),
    sa.Column("license_number", sa.String(30), nullable=True),
    sa.Column("workplace", sa.String(150), nullable=True),
    sa.Column("years_experience", sa.Integer(), nullable=True),
    sa.Column("doctor_status", sa.String(20), nullable=True),
    sa.Column("doctor_review_note", sa.Text(), nullable=True),
    sa.Column("doctor_reviewed_at", sa.DateTime(timezone=True), nullable=True),
]


def upgrade() -> None:
    for column in USER_COLUMNS:
        op.add_column("users", column)

    op.create_table(
        "doctor_documents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("kind", sa.String(20), nullable=False),
        sa.Column("original_name", sa.String(255), nullable=False),
        sa.Column("stored_name", sa.String(64), nullable=False, unique=True),
        sa.Column("content_type", sa.String(50), nullable=False),
        sa.Column("size", sa.Integer(), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_doctor_documents_id", "doctor_documents", ["id"])
    op.create_index("ix_doctor_documents_user_id", "doctor_documents", ["user_id"])

    # Doctors that existed before verification was introduced were set up by an admin
    op.execute("UPDATE users SET doctor_status = 'approved' WHERE role = 'doctor'")


def downgrade() -> None:
    op.drop_index("ix_doctor_documents_user_id", table_name="doctor_documents")
    op.drop_index("ix_doctor_documents_id", table_name="doctor_documents")
    op.drop_table("doctor_documents")
    for column in reversed(USER_COLUMNS):
        op.drop_column("users", column.name)
