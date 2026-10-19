from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.core.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Health and readiness check for containerized deployment & uptime monitoring."""
    db_status = "ok"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    uploads_ok = settings.UPLOAD_DIR.exists() and settings.UPLOAD_DIR.is_dir()

    return {
        "status": "healthy" if db_status == "ok" and uploads_ok else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": db_status,
        "storage": "ok" if uploads_ok else "missing_upload_dir"
    }
