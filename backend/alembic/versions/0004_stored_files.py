"""uploaded files stored in the database

Revision ID: 0004
Revises: 0003
Create Date: 2026-10-06

Profile photos and verification documents move from the local disk to the
database, so they survive redeploys on hosts without a persistent disk.
"""
from pathlib import Path
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

CONTENT_TYPES = {"jpg": "image/jpeg", "png": "image/png", "webp": "image/webp", "pdf": "application/pdf"}


def upgrade() -> None:
    table = op.create_table(
        "stored_files",
        sa.Column("name", sa.String(64), primary_key=True),
        sa.Column("kind", sa.String(20), nullable=False),
        sa.Column("content_type", sa.String(50), nullable=False),
        sa.Column("size", sa.Integer(), nullable=False),
        sa.Column("data", sa.LargeBinary(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    # Bring over files saved on disk by the previous version (uploads/avatars, uploads/documents)
    rows = []
    for kind in ("avatars", "documents"):
        folder = Path("uploads") / kind
        if folder.is_dir():
            for f in folder.iterdir():
                ext = f.suffix.lstrip(".")
                if f.is_file() and ext in CONTENT_TYPES:
                    data = f.read_bytes()
                    rows.append({"name": f.name, "kind": kind, "content_type": CONTENT_TYPES[ext], "size": len(data), "data": data})
    if rows:
        op.bulk_insert(table, rows)


def downgrade() -> None:
    op.drop_table("stored_files")
