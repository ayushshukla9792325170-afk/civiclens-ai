import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.models import User, Complaint, Department

client = TestClient(app)

def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert data["database"] == "ok"

def test_login_demo_admin():
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@civiclens.gov",
        "password": "Admin@12345"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "ADMIN"

def test_login_invalid_password():
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@civiclens.gov",
        "password": "WrongPassword999!"
    })
    assert response.status_code == 401

def test_register_new_citizen():
    import uuid
    random_email = f"test.citizen.{uuid.uuid4().hex[:6]}@example.com"
    response = client.post("/api/v1/auth/register", json={
        "name": "Test Citizen User",
        "email": random_email,
        "password": "SecurePassword@123",
        "phone": "+91 98000 12345",
        "default_location": "Shivaji Nagar"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["role"] == "CITIZEN"
    assert data["user"]["email"] == random_email

def test_ai_analysis_fallback_endpoint():
    response = client.post("/api/v1/ai/analyze", json={
        "text_content": "Huge dangerous crater pothole on Paud Road causing two wheeler accidents",
        "latitude": 18.5074,
        "longitude": 73.8077
    })
    assert response.status_code == 200
    data = response.json()
    assert data["suggested_category"] in ["POTHOLE", "ROAD_DAMAGE"]
    assert data["suggested_severity"] in ["MEDIUM", "HIGH", "CRITICAL"]
    assert data["analysis_mode"] in ["RULE_BASED", "AI_GEMINI"]
    assert len(data["severity_explanation"]) > 5

def test_public_complaints_list():
    response = client.get("/api/v1/complaints/public?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) > 0
    # Ensure reporter name is sanitized in public view
    assert data["items"][0]["reporter_name"] == "Anonymous Citizen"

def test_analytics_overview():
    response = client.get("/api/v1/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["metrics"]["total_complaints"] >= 20
    assert len(data["categories"]) > 0
    assert len(data["severities"]) > 0
    assert len(data["hotspots"]) >= 20

def test_status_transition_validation():
    # Login as PWD officer
    login_res = client.post("/api/v1/auth/login", json={
        "email": "officer.pwd@civiclens.gov",
        "password": "Officer@12345"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Find or create complaint in SUBMITTED status
    db = SessionLocal()
    comp = db.query(Complaint).filter(Complaint.status == "SUBMITTED").first()
    if not comp:
        user = db.query(User).filter(User.role == "CITIZEN").first()
        dept = db.query(Department).first()
        comp = Complaint(
            reference_number=f"TEST-{uuid.uuid4().hex[:6].upper()}",
            user_id=user.id,
            title="Pothole Test Issue",
            description="Deep pothole on arterial road",
            category="POTHOLE",
            severity="HIGH",
            status="SUBMITTED",
            latitude=18.5204,
            longitude=73.8567,
            address="Test Road, Pune",
            department_id=dept.id,
            is_public=True
        )
        db.add(comp)
        db.commit()
        db.refresh(comp)
    db.close()
    assert comp is not None

    # Invalid jump: SUBMITTED directly to RESOLVED without assigned or in_progress -> should return 400
    invalid_res = client.put(f"/api/v1/complaints/{comp.id}/status", json={
        "new_status": "RESOLVED",
        "public_comment": "Direct jump"
    }, headers=headers)
    assert invalid_res.status_code == 400

    # Valid step: SUBMITTED to VERIFIED or ASSIGNED
    valid_res = client.put(f"/api/v1/complaints/{comp.id}/status", json={
        "new_status": "VERIFIED",
        "public_comment": "Issue inspected and verified on municipal queue."
    }, headers=headers)
    assert valid_res.status_code == 200
    assert valid_res.json()["status"] == "VERIFIED"

def test_rejection_requires_mandatory_reason():
    # Login as SWM officer
    login_res = client.post("/api/v1/auth/login", json={
        "email": "officer.swm@civiclens.gov",
        "password": "Officer@12345"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    db = SessionLocal()
    comp = db.query(Complaint).filter(Complaint.status.in_(["SUBMITTED", "VERIFIED"])).first()
    if not comp:
        user = db.query(User).filter(User.role == "CITIZEN").first()
        dept = db.query(Department).first()
        comp = Complaint(
            reference_number=f"TEST-REJ-{uuid.uuid4().hex[:6].upper()}",
            user_id=user.id,
            title="Garbage Pile Test",
            description="Garbage dumped outside gate",
            category="GARBAGE",
            severity="MEDIUM",
            status="SUBMITTED",
            latitude=18.5204,
            longitude=73.8567,
            address="Test Corner, Pune",
            department_id=dept.id,
            is_public=True
        )
        db.add(comp)
        db.commit()
        db.refresh(comp)
    db.close()
    assert comp is not None

    # Rejection without reason -> 400
    fail_res = client.put(f"/api/v1/complaints/{comp.id}/status", json={
        "new_status": "REJECTED",
        "reason": ""
    }, headers=headers)
    assert fail_res.status_code == 400

    # Rejection with reason -> 200
    ok_res = client.put(f"/api/v1/complaints/{comp.id}/status", json={
        "new_status": "REJECTED",
        "reason": "Duplicate report already under active resolution."
    }, headers=headers)
    assert ok_res.status_code == 200
    assert ok_res.json()["status"] == "REJECTED"

def test_admin_user_directory_and_role_protection():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "admin@civiclens.gov",
        "password": "Admin@12345"
    })
    token = login_res.json()["access_token"]
    admin_id = login_res.json()["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}

    # List users
    users_res = client.get("/api/v1/admin/users", headers=headers)
    assert users_res.status_code == 200
    users = users_res.json()
    assert len(users) >= 4

    # Sole admin protection test: Attempt to demote sole admin -> 400
    demote_res = client.put(f"/api/v1/admin/users/{admin_id}/role", json={
        "role": "CITIZEN"
    }, headers=headers)
    assert demote_res.status_code in [400, 403]
    assert "last active administrator" in demote_res.json()["detail"].lower()

def test_departments_and_wards_api():
    # Public department list
    dept_res = client.get("/api/v1/departments")
    assert dept_res.status_code == 200
    depts = dept_res.json()
    assert len(depts) >= 5

    # Wards list
    ward_res = client.get("/api/v1/departments/wards")
    assert ward_res.status_code == 200
    wards = ward_res.json()
    assert len(wards) >= 5

def test_citizen_notifications_flow():
    # Login as citizen
    login_res = client.post("/api/v1/auth/login", json={
        "email": "citizen.aarav@example.com",
        "password": "Citizen@12345"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch notifications
    notif_res = client.get("/api/v1/notifications", headers=headers)
    assert notif_res.status_code == 200
    notifs = notif_res.json()
    assert isinstance(notifs, list)

    # Check unread count
    unread_res = client.get("/api/v1/notifications/unread-count", headers=headers)
    assert unread_res.status_code == 200
    assert "unread_count" in unread_res.json()

def test_admin_settings_persistence():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "admin@civiclens.gov",
        "password": "Admin@12345"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get settings
    settings_res = client.get("/api/v1/admin/settings", headers=headers)
    assert settings_res.status_code == 200
    settings = settings_res.json()
    assert "duplicate_distance_threshold_meters" in settings

    # Update setting
    up_res = client.put("/api/v1/admin/settings/duplicate_distance_threshold_meters", json={
        "value": 75
    }, headers=headers)
    assert up_res.status_code == 200

    # Verify updated value
    verify_res = client.get("/api/v1/admin/settings", headers=headers)
    assert verify_res.json()["duplicate_distance_threshold_meters"] == 75
