from sqlalchemy import Column, Integer, String, DateTime, LargeBinary
from sqlalchemy.sql import func
from app.core.database import Base


class StoredFile(Base):
    """An uploaded file kept in the database (profile photo or verification document).

    Keeping files in PostgreSQL means they survive redeploys on hosts without a
    persistent disk, are covered by database backups, and are never reachable
    through a public folder. Sizes are capped at upload (2 MB photos, 5 MB documents).
    """
    __tablename__ = "stored_files"

    name = Column(String(64), primary_key=True)          # random name, e.g. "3f2a….jpg"
    kind = Column(String(20), nullable=False)            # "avatars" | "documents"
    content_type = Column(String(50), nullable=False)
    size = Column(Integer, nullable=False)
    data = Column(LargeBinary, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
