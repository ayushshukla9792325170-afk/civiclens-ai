import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Float, Integer, Boolean, DateTime, ForeignKey, Index, JSON
)
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="CITIZEN", index=True, nullable=False)  # CITIZEN, OFFICER, ADMIN
    phone = Column(String(30), nullable=True)
    default_location = Column(String(255), nullable=True)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    account_status = Column(String(20), default="ACTIVE", index=True, nullable=False)  # ACTIVE, INACTIVE, SUSPENDED
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    department = relationship("Department", back_populates="officers", foreign_keys=[department_id])
    complaints = relationship("Complaint", back_populates="reporter", foreign_keys="Complaint.user_id")
    assigned_complaints = relationship("Complaint", back_populates="assigned_officer", foreign_keys="Complaint.assigned_officer_id")
    notifications = relationship("Notification", back_populates="recipient", foreign_keys="Notification.recipient_user_id")

class Department(Base):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(120), unique=True, index=True, nullable=False)
    code = Column(String(20), unique=True, index=True, nullable=False)  # PWD, SWM, ELEC, WATER, TRAFFIC
    description = Column(Text, nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    coverage_areas = Column(JSON, default=list, nullable=False)  # list of ward codes/names
    supported_categories = Column(JSON, default=list, nullable=False)  # list of issue categories
    service_target_hours = Column(Integer, default=48, nullable=False)  # SLA target in hours
    is_active = Column(Boolean, default=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    officers = relationship("User", back_populates="department", foreign_keys="User.department_id")
    complaints = relationship("Complaint", back_populates="department", foreign_keys="Complaint.department_id")

class Ward(Base):
    __tablename__ = "wards"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, index=True, nullable=False)
    code = Column(String(20), unique=True, index=True, nullable=False)
    city = Column(String(100), default="Metro City", nullable=False)
    center_latitude = Column(Float, nullable=False)
    center_longitude = Column(Float, nullable=False)
    radius_meters = Column(Float, default=2500.0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    complaints = relationship("Complaint", back_populates="ward", foreign_keys="Complaint.ward_id")

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    reference_number = Column(String(30), unique=True, index=True, nullable=False)  # CLN-2026-XXXX
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    
    # Categorization & AI Fields
    category = Column(String(50), index=True, nullable=False)  # POTHOLE, GARBAGE, STREETLIGHT, DRAINAGE, ROAD_DAMAGE, DAMAGED_SIGN, WATER_LEAKAGE, ILLEGAL_DUMPING, OTHER
    severity = Column(String(20), index=True, default="MEDIUM", nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    severity_explanation = Column(Text, nullable=True)
    ai_confidence = Column(Float, default=0.0, nullable=False)
    ai_analysis_mode = Column(String(30), default="RULE_BASED", nullable=False)  # RULE_BASED, AI_GEMINI, MANUAL
    
    # Routing & Assignment
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_officer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Lifecycle Status: SUBMITTED -> VERIFIED -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CITIZEN_VERIFIED
    # (also REJECTED, REOPENED)
    status = Column(String(30), index=True, default="SUBMITTED", nullable=False)
    
    # Geospatial Coordinates & Location
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    address = Column(Text, nullable=False)
    ward_id = Column(String(36), ForeignKey("wards.id", ondelete="SET NULL"), nullable=True, index=True)
    ward_name = Column(String(100), nullable=True)
    
    is_public = Column(Boolean, default=True, index=True, nullable=False)
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    citizen_verified_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=get_utc_now, index=True, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    reporter = relationship("User", back_populates="complaints", foreign_keys=[user_id])
    assigned_officer = relationship("User", back_populates="assigned_complaints", foreign_keys=[assigned_officer_id])
    department = relationship("Department", back_populates="complaints", foreign_keys=[department_id])
    ward = relationship("Ward", back_populates="complaints", foreign_keys=[ward_id])
    evidence_items = relationship("ComplaintEvidence", back_populates="complaint", cascade="all, delete-orphan")
    updates = relationship("ComplaintUpdate", back_populates="complaint", cascade="all, delete-orphan", order_by="ComplaintUpdate.created_at.desc()")
    feedback = relationship("Feedback", back_populates="complaint", uselist=False, cascade="all, delete-orphan")
    duplicate_candidates = relationship("DuplicateCandidate", back_populates="source_complaint", foreign_keys="DuplicateCandidate.source_complaint_id")

class ComplaintEvidence(Base):
    __tablename__ = "complaint_evidence"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    storage_key = Column(String(500), nullable=False)  # Local relative URL e.g. /uploads/evidence_uuid.jpg or external S3 URL
    evidence_type = Column(String(50), default="INITIAL_REPORT", nullable=False)  # INITIAL_REPORT, RESOLUTION_PROOF, INSPECTION
    original_filename = Column(String(255), nullable=True)
    content_type = Column(String(100), default="image/jpeg", nullable=False)
    file_size_bytes = Column(Integer, default=0, nullable=False)
    uploader_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    complaint = relationship("Complaint", back_populates="evidence_items")
    uploader = relationship("User")

class ComplaintUpdate(Base):
    __tablename__ = "complaint_updates"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_status = Column(String(30), nullable=False)
    new_status = Column(String(30), nullable=False)
    public_comment = Column(Text, nullable=True)
    internal_note = Column(Text, nullable=True)
    updated_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, index=True, nullable=False)

    complaint = relationship("Complaint", back_populates="updates")
    updated_by = relationship("User")

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    citizen_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)  # 1 to 5 stars
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    complaint = relationship("Complaint", back_populates="feedback")
    citizen = relationship("User")

class DuplicateCandidate(Base):
    __tablename__ = "duplicate_candidates"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source_complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    distance_meters = Column(Float, nullable=False)
    similarity_score = Column(Float, default=0.0, nullable=False)
    status = Column(String(30), default="DETECTED", nullable=False)  # DETECTED, CONFIRMED_DUPLICATE, DISMISSED
    reviewed_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    review_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    source_complaint = relationship("Complaint", foreign_keys=[source_complaint_id], back_populates="duplicate_candidates")
    candidate_complaint = relationship("Complaint", foreign_keys=[candidate_complaint_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])

class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=True, index=True)
    model_provider = Column(String(100), default="rule-based-engine-v1", nullable=False)
    analysis_mode = Column(String(30), default="RULE_BASED", nullable=False)  # AI_GEMINI, RULE_BASED
    structured_output = Column(JSON, nullable=False)
    confidence_score = Column(Float, default=0.0, nullable=False)
    processing_status = Column(String(30), default="SUCCESS", nullable=False)  # SUCCESS, FALLBACK, FAILED
    error_category = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    complaint = relationship("Complaint")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    recipient_user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="SET NULL"), nullable=True, index=True)
    notification_type = Column(String(50), default="STATUS_CHANGE", nullable=False)  # STATUS_CHANGE, ASSIGNMENT, RESOLUTION_VERIFY, DUPLICATE_ALERT, SYSTEM
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, index=True, nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, index=True, nullable=False)

    recipient = relationship("User", back_populates="notifications")
    complaint = relationship("Complaint")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    actor_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), index=True, nullable=False)  # USER_LOGIN, STATUS_CHANGE, OVERRIDE_SEVERITY, ASSIGN_OFFICER, ROLE_UPDATE, etc.
    entity_type = Column(String(50), index=True, nullable=False)  # COMPLAINT, USER, DEPARTMENT, SETTING
    entity_id = Column(String(36), nullable=True, index=True)
    before_state = Column(JSON, nullable=True)
    after_state = Column(JSON, nullable=True)
    reason = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, index=True, nullable=False)

    actor = relationship("User")

class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String(100), primary_key=True)
    value = Column(JSON, nullable=False)
    description = Column(String(255), nullable=True)
    updated_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)
