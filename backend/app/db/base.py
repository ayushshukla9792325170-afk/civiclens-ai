# Import Base and all models so Alembic can discover them
from app.db.session import Base
from app.models import (
    User,
    Department,
    Ward,
    Complaint,
    ComplaintEvidence,
    ComplaintUpdate,
    Feedback,
    DuplicateCandidate,
    AIAnalysis,
    Notification,
    AuditLog,
    SystemSetting,
)

__all__ = ["Base"]
