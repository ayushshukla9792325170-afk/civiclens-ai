import uuid
from pathlib import Path
from typing import Tuple
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

ALLOWED_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif"
}

def save_uploaded_file(file: UploadFile) -> Tuple[str, int]:
    """
    Saves an uploaded file to the secure local upload directory.
    Validates MIME type and file size.
    Returns (storage_key_url, file_size_bytes).
    """
    content_type = file.content_type or ""
    if content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{content_type}'. Allowed types: JPEG, PNG, WebP, GIF."
        )

    ext = ALLOWED_EXTENSIONS.get(content_type, ".jpg")
    unique_filename = f"evid_{uuid.uuid4().hex}{ext}"
    dest_path = settings.UPLOAD_DIR / unique_filename

    # Read and validate size
    try:
        contents = file.file.read()
        file_size = len(contents)
        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if file_size > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB."
            )

        with open(dest_path, "wb") as f:
            f.write(contents)

        storage_url = f"/uploads/{unique_filename}"
        return storage_url, file_size
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and store evidence file: {str(e)}"
        )
