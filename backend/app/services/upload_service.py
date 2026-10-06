"""
Stored uploads: profile photos and doctor verification documents.

Files are checked by their content (magic bytes), not by their name or the
type the browser claims, capped in size, and saved under random names in the
`stored_files` table. JPEG metadata (EXIF: camera, GPS position) is removed
from profile photos.
"""
import re
import secrets
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.stored_file import StoredFile

IMAGE_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
DOCUMENT_TYPES = {**IMAGE_TYPES, "application/pdf": "pdf"}
STORED_NAME = re.compile(r"^[0-9a-f]{32}\.(jpg|png|webp|pdf)$")


def sniff(data: bytes) -> str | None:
    """The real content type, from the first bytes of the file."""
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    if data.startswith(b"%PDF-"):
        return "application/pdf"
    return None


def strip_jpeg_metadata(data: bytes) -> bytes:
    """Drop APP1–APP15 and comment segments (EXIF, XMP, GPS…) from a JPEG.
    Keeps APP0 (JFIF) and APP2 (colour profile) so the image looks the same."""
    if not data.startswith(b"\xff\xd8"):
        return data
    out, i = bytearray(b"\xff\xd8"), 2
    while i + 4 <= len(data):
        if data[i] != 0xFF:
            return data                        # unexpected layout: leave the file as it is
        marker = data[i + 1]
        if marker == 0xDA:                     # start of scan: the rest is image data
            out += data[i:]
            return bytes(out)
        length = int.from_bytes(data[i + 2:i + 4], "big")
        segment = data[i:i + 2 + length]
        if not (0xE1 <= marker <= 0xEF and marker != 0xE2) and marker != 0xFE:
            out += segment
        i += 2 + length
    return data


def read_checked(upload: UploadFile, allowed: dict, max_bytes: int) -> tuple[bytes, str]:
    """Read an upload, enforcing the size limit and an allowed real content type."""
    data = upload.file.read(max_bytes + 1)
    if not data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "The file is empty")
    if len(data) > max_bytes:
        raise HTTPException(413, f"The file is too large (max {max_bytes // (1024 * 1024)} MB)")
    content_type = sniff(data)
    if content_type not in allowed:
        raise HTTPException(415, "Unsupported file type (allowed: " + ", ".join(sorted(set(allowed.values()))) + ")")
    return data, content_type


def save(db: Session, kind: str, data: bytes, content_type: str) -> str:
    """Store the bytes under a random name (committed with the caller's transaction)."""
    name = f"{secrets.token_hex(16)}.{DOCUMENT_TYPES[content_type]}"
    db.add(StoredFile(name=name, kind=kind, content_type=content_type, size=len(data), data=data))
    return name


def load(db: Session, kind: str, name: str) -> StoredFile | None:
    """A stored file, or None for a name that is not one of ours."""
    if not name or not STORED_NAME.match(name):
        return None
    return db.query(StoredFile).filter(StoredFile.name == name, StoredFile.kind == kind).first()


def remove(db: Session, kind: str, name: str | None) -> None:
    if name:
        db.query(StoredFile).filter(StoredFile.name == name, StoredFile.kind == kind).delete(synchronize_session=False)


def save_avatar(db: Session, upload: UploadFile) -> str:
    data, content_type = read_checked(upload, IMAGE_TYPES, settings.AVATAR_MAX_BYTES)
    if content_type == "image/jpeg":
        data = strip_jpeg_metadata(data)
    return save(db, "avatars", data, content_type)
