from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, require_admin
from app.schemas.user import UserOut, UserUpdate, PasswordChange, DocumentOut
from app.services import user_service, upload_service
from app.models.user import User, UserRole
from app.models.doctor_document import DoctorDocument
from typing import List

router = APIRouter(prefix="/api/users", tags=["users"])
files_router = APIRouter(tags=["files"])


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_service.update_user(db, current_user, data)


@router.put("/me/password", status_code=204)
def change_password(
    data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_service.change_password(db, current_user, data.current_password, data.new_password)


@router.post("/me/avatar", response_model=UserOut)
def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Profile photo: JPEG, PNG or WebP, up to 2 MB."""
    return user_service.set_avatar(db, current_user, file)


@router.delete("/me/avatar", response_model=UserOut)
def delete_avatar(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return user_service.set_avatar(db, current_user, None)


@router.get("/me/documents", response_model=List[DocumentOut])
def my_documents(current_user: User = Depends(get_current_user)):
    return current_user.documents


@router.post("/me/documents", response_model=DocumentOut, status_code=201)
def upload_document(
    kind: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """A doctor not yet verified sends (again) their identity card or diploma."""
    return user_service.replace_document(db, current_user, kind, file)


@router.delete("/me", status_code=204)
def delete_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_service.delete_user(db, current_user)


# Admin only
@router.get("/", response_model=List[UserOut], dependencies=[Depends(require_admin)])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).all()


@router.delete("/{user_id}", status_code=204, dependencies=[Depends(require_admin)])
def admin_delete_user(user_id: int, db: Session = Depends(get_db)):
    user = user_service.get_by_id(db, user_id)
    if user:
        user_service.delete_user(db, user)


# ── Files ─────────────────────────────────────────────────────────────────────
@files_router.get("/api/avatars/{name}", include_in_schema=False)
def get_avatar(name: str):
    """Profile photos are public under an unguessable name (an <img> can't send a token)."""
    path = upload_service.path_of("avatars", name)
    if not path:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    return FileResponse(path, headers={"Cache-Control": "public, max-age=604800, immutable",
                                       "X-Content-Type-Options": "nosniff"})


@files_router.get("/api/documents/{doc_id}")
def get_document(doc_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """A verification document — only for its owner and for administrators."""
    doc = db.query(DoctorDocument).filter(DoctorDocument.id == doc_id).first()
    if not doc or (current_user.role != UserRole.admin and doc.user_id != current_user.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    path = upload_service.path_of("documents", doc.stored_name)
    if not path:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    return FileResponse(path, media_type=doc.content_type, filename=doc.original_name,
                        content_disposition_type="inline",
                        headers={"Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff"})
