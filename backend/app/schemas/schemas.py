from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# ----------------- User Schemas -----------------
class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    phone: Optional[str] = None
    default_location: Optional[str] = None

class UserRegister(UserBase):
    password: str = Field(..., min_length=8, max_length=72)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    role: str
    department_id: Optional[str] = None
    account_status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    phone: Optional[str] = None
    default_location: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = Field(None, min_length=8, max_length=72)

class UserRoleUpdate(BaseModel):
    role: str = Field(..., pattern="^(CITIZEN|OFFICER|ADMIN)$")
    department_id: Optional[str] = None

class UserStatusUpdate(BaseModel):
    account_status: str = Field(..., pattern="^(ACTIVE|INACTIVE|SUSPENDED)$")
    reason: Optional[str] = None

# ----------------- Ward Schemas -----------------
class WardResponse(BaseModel):
    id: str
    name: str
    code: str
    city: str
    center_latitude: float
    center_longitude: float
    radius_meters: float

    class Config:
        from_attributes = True

# ----------------- Department Schemas -----------------
class DepartmentBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    code: str = Field(..., min_length=2, max_length=20)
    description: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    coverage_areas: List[str] = []
    supported_categories: List[str] = []
    service_target_hours: int = 48
    is_active: bool = True

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    coverage_areas: Optional[List[str]] = None
    supported_categories: Optional[List[str]] = None
    service_target_hours: Optional[int] = None
    is_active: Optional[bool] = None

class DepartmentResponse(DepartmentBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ----------------- Complaint Evidence Schemas -----------------
class EvidenceResponse(BaseModel):
    id: str
    complaint_id: str
    storage_key: str
    evidence_type: str
    original_filename: Optional[str] = None
    content_type: str
    file_size_bytes: int
    uploader_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Complaint Updates & Timeline -----------------
class ComplaintUpdateResponse(BaseModel):
    id: str
    complaint_id: str
    previous_status: str
    new_status: str
    public_comment: Optional[str] = None
    internal_note: Optional[str] = None
    updated_by_id: Optional[str] = None
    updated_by_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Feedback Schemas -----------------
class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=1000)

class FeedbackResponse(BaseModel):
    id: str
    complaint_id: str
    citizen_id: str
    rating: int
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Complaint Schemas -----------------
class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=4, max_length=200)
    description: str = Field(..., min_length=10, max_length=5000)
    category: str = Field(..., pattern="^(POTHOLE|GARBAGE|STREETLIGHT|DRAINAGE|ROAD_DAMAGE|DAMAGED_SIGN|WATER_LEAKAGE|ILLEGAL_DUMPING|OTHER)$")
    severity: str = Field(default="MEDIUM", pattern="^(LOW|MEDIUM|HIGH|CRITICAL)$")
    severity_explanation: Optional[str] = None
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    address: str = Field(..., min_length=3, max_length=500)
    ward_id: Optional[str] = None
    ward_name: Optional[str] = None
    is_public: bool = True
    ai_confidence: float = 0.0
    ai_analysis_mode: str = "RULE_BASED"
    evidence_storage_keys: List[str] = []

class ComplaintStatusChangeRequest(BaseModel):
    new_status: str = Field(..., pattern="^(VERIFIED|ASSIGNED|IN_PROGRESS|RESOLVED|CITIZEN_VERIFIED|REJECTED|REOPENED)$")
    public_comment: Optional[str] = None
    internal_note: Optional[str] = None
    reason: Optional[str] = None  # Mandatory for REJECTED and REOPENED
    resolution_proof_keys: Optional[List[str]] = None

class ComplaintAssignRequest(BaseModel):
    department_id: Optional[str] = None
    assigned_officer_id: Optional[str] = None
    notes: Optional[str] = None

class ComplaintOverrideRequest(BaseModel):
    category: Optional[str] = None
    severity: Optional[str] = None
    department_id: Optional[str] = None
    reason: str = Field(..., min_length=5, max_length=500)

class ComplaintResponse(BaseModel):
    id: str
    reference_number: str
    user_id: str
    reporter_name: Optional[str] = None
    title: str
    description: str
    category: str
    severity: str
    severity_explanation: Optional[str] = None
    ai_confidence: float
    ai_analysis_mode: str
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    assigned_officer_id: Optional[str] = None
    assigned_officer_name: Optional[str] = None
    status: str
    latitude: float
    longitude: float
    address: str
    ward_id: Optional[str] = None
    ward_name: Optional[str] = None
    is_public: bool
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    citizen_verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    evidence_items: List[EvidenceResponse] = []
    feedback: Optional[FeedbackResponse] = None

    class Config:
        from_attributes = True

class ComplaintDetailResponse(ComplaintResponse):
    updates: List[ComplaintUpdateResponse] = []
    duplicate_count: int = 0

class PaginatedComplaintsResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[ComplaintResponse]

# ----------------- Duplicate Candidate Schemas -----------------
class DuplicateCandidateResponse(BaseModel):
    id: str
    source_complaint_id: str
    candidate_complaint_id: str
    candidate_reference: str
    candidate_title: str
    candidate_category: str
    candidate_status: str
    candidate_created_at: datetime
    distance_meters: float
    similarity_score: float
    status: str
    review_reason: Optional[str] = None
    created_at: datetime

class DuplicateReviewRequest(BaseModel):
    status: str = Field(..., pattern="^(CONFIRMED_DUPLICATE|DISMISSED)$")
    review_reason: str = Field(..., min_length=3, max_length=500)

# ----------------- AI Schemas -----------------
class AIAnalysisRequest(BaseModel):
    text_content: Optional[str] = None
    image_storage_key: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class AIAnalysisResponse(BaseModel):
    suggested_category: str
    suggested_title: Optional[str] = None
    short_summary: str
    suggested_severity: str
    severity_explanation: str
    confidence_score: float
    suggested_department_code: str
    suggested_department_name: str
    potential_duplicates: List[Dict[str, Any]] = []
    recommended_next_step: str
    analysis_mode: str  # AI_GEMINI or RULE_BASED
    processing_status: str

# ----------------- Notification Schemas -----------------
class NotificationResponse(BaseModel):
    id: str
    recipient_user_id: str
    complaint_id: Optional[str] = None
    notification_type: str
    title: str
    message: str
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Analytics Schemas -----------------
class DashboardMetrics(BaseModel):
    total_complaints: int
    pending_review: int
    in_progress: int
    resolved: int
    citizen_verified: int
    high_critical_count: int
    avg_resolution_hours: float
    overdue_count: int
    citizen_satisfaction_avg: float

class CategoryCount(BaseModel):
    category: str
    count: int

class SeverityCount(BaseModel):
    severity: str
    count: int

class StatusCount(BaseModel):
    status: str
    count: int

class MonthlyTrend(BaseModel):
    month_year: str
    submitted: int
    resolved: int

class HotspotPoint(BaseModel):
    latitude: float
    longitude: float
    weight: int
    category: str
    reference_number: str
    title: str

class AnalyticsOverviewResponse(BaseModel):
    metrics: DashboardMetrics
    categories: List[CategoryCount]
    severities: List[SeverityCount]
    statuses: List[StatusCount]
    monthly_trends: List[MonthlyTrend]
    hotspots: List[HotspotPoint]

# ----------------- Audit Schemas -----------------
class AuditLogResponse(BaseModel):
    id: str
    actor_user_id: Optional[str] = None
    actor_name: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    before_state: Optional[Dict[str, Any]] = None
    after_state: Optional[Dict[str, Any]] = None
    reason: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
