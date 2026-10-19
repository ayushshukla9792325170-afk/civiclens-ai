from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from app.services.storage.storage_service import save_uploaded_file
from app.core.permissions import get_current_user_optional
from app.models.models import User

router = APIRouter(prefix="/evidence", tags=["Evidence & Uploads"])

@router.post("/upload")
def upload_evidence(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user_optional)
):
    """
    Accepts multipart image uploads, performs MIME type and size checks,
    and returns a safe storage reference URL.
    """
    storage_key, file_size = save_uploaded_file(file)
    return {
        "storage_key": storage_key,
        "original_filename": file.filename,
        "content_type": file.content_type,
        "file_size_bytes": file_size,
        "message": "File uploaded successfully."
    }
