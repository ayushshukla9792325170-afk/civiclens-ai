# CivicLens AI — REST API Reference Guide

All API endpoints are mounted under `/api/v1`. Authentication uses standard HTTP Bearer tokens (`Authorization: Bearer <token>`) returned on successful login or registration.

---

## 1. Authentication & Identity (`/api/v1/auth`)

### `POST /api/v1/auth/register`
Registers a new citizen account.
- **Request Body:**
  ```json
  {
    "name": "Aarav Sharma",
    "email": "aarav.sharma@example.com",
    "password": "SecurePassword@123",
    "phone": "+91 98220 12345",
    "default_location": "Kothrud, Pune"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "token_type": "bearer",
    "user": {
      "id": "uuid-v4",
      "name": "Aarav Sharma",
      "email": "aarav.sharma@example.com",
      "role": "CITIZEN",
      "account_status": "ACTIVE"
    }
  }
  ```

### `POST /api/v1/auth/login`
Authenticates existing citizen, officer, or administrator.
- **Request Body:**
  ```json
  {
    "email": "officer.pwd@civiclens.gov",
    "password": "Officer@12345"
  }
  ```
- **Response (200 OK):** Returns JWT access token and user metadata.

### `GET /api/v1/auth/me`
Returns profile information for the authenticated user session. Requires Bearer Token.

---

## 2. Civic Complaints (`/api/v1/complaints`)

### `GET /api/v1/complaints`
Paginated search and list complaints with multi-attribute filtering.
- **Query Parameters:**
  - `page` (`int`, default `1`): Page number.
  - `page_size` (`int`, default `10`): Items per page (max 100).
  - `status` (`string`): e.g. `SUBMITTED`, `IN_PROGRESS`, `RESOLVED`.
  - `category` (`string`): e.g. `POTHOLE`, `GARBAGE`, `STREETLIGHT`.
  - `severity` (`string`): `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
  - `department_id` (`string`): Filter by assigned department.
  - `ward_id` (`string`): Filter by geographic ward.
  - `search` (`string`): Search title, reference number, or address.
- **Response (200 OK):**
  ```json
  {
    "total": 24,
    "page": 1,
    "page_size": 10,
    "items": [
      {
        "id": "complaint-uuid",
        "reference_number": "CLN-2026-1001",
        "title": "Deep Pothole on FC Road",
        "category": "POTHOLE",
        "severity": "CRITICAL",
        "status": "IN_PROGRESS",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "address": "Ferguson College Road near Gate 2, Pune",
        "department_name": "Public Works Department",
        "created_at": "2026-10-15T10:00:00Z"
      }
    ]
  }
  ```

### `GET /api/v1/complaints/public`
Returns anonymized, public complaints suitable for citizen map transparency.

### `POST /api/v1/complaints`
Submits a newly drafted civic complaint. Requires `CITIZEN` or `ADMIN` role.
- **Request Body:**
  ```json
  {
    "title": "Broken Streetlight on Senapati Bapat Road",
    "description": "Streetlight pole flickering and completely dark at night near junction.",
    "category": "STREETLIGHT",
    "severity": "MEDIUM",
    "latitude": 18.5312,
    "longitude": 73.8295,
    "address": "SB Road, Opposite Crossword, Pune",
    "ward_id": "ward-uuid",
    "is_public": true,
    "evidence_storage_keys": ["evidence_1729012345_uuid.jpg"]
  }
  ```

### `PUT /api/v1/complaints/{id}/status`
Transitions a complaint along its lifecycle. Enforces valid state machine DAG. Requires `OFFICER` or `ADMIN`.
- **Request Body:**
  ```json
  {
    "new_status": "IN_PROGRESS",
    "public_comment": "Field maintenance team deployed on-site.",
    "internal_note": "Assigned truck crew #4 for hot-mix asphalt patching.",
    "resolution_proof_keys": []
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: If transition violates valid DAG or if `REJECTED` status lacks mandatory reason.

### `PUT /api/v1/complaints/{id}/assign`
Assigns or transfers a complaint to a specific department or officer.
- **Request Body:**
  ```json
  {
    "department_id": "dept-pwd-uuid",
    "assigned_officer_id": "user-officer-uuid",
    "notes": "Emergency triage dispatched"
  }
  ```

### `PUT /api/v1/complaints/{id}/override`
Allows an officer to override AI-generated category, severity, or department.
- **Request Body:**
  ```json
  {
    "category": "ROAD_DAMAGE",
    "severity": "HIGH",
    "reason": "Field inspection confirmed foundational trench collapse rather than standard pothole."
  }
  ```

### `POST /api/v1/complaints/{id}/feedback`
Citizen submits feedback and rating upon resolution verification.
- **Request Body:**
  ```json
  {
    "rating": 5,
    "comment": "Road smoothly resurfaced within 24 hours. Excellent response!"
  }
  ```

---

## 3. Multimodal AI Analysis (`/api/v1/ai`)

### `POST /api/v1/ai/analyze`
Submits image storage key, description, and GPS coordinates to the multimodal triage pipeline.
- **Request Body:**
  ```json
  {
    "text_content": "Huge crater in road with exposed iron rebar",
    "image_storage_key": "evidence_1729012345.jpg",
    "latitude": 18.5204,
    "longitude": 73.8567
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "suggested_category": "POTHOLE",
    "suggested_title": "Severe Pothole Crater with Rebar Hazard",
    "short_summary": "Deep asphalt cavity posing severe hazard to two-wheelers.",
    "suggested_severity": "CRITICAL",
    "severity_explanation": "Exposed steel mesh and depth over 10cm on active thoroughfare.",
    "confidence_score": 0.94,
    "suggested_department_code": "PWD",
    "suggested_department_name": "Public Works Department",
    "potential_duplicates": [],
    "analysis_mode": "AI_GEMINI"
  }
  ```

---

## 4. Evidence Uploads (`/api/v1/evidence`)

### `POST /api/v1/evidence/upload`
Uploads evidence image or audio file. Content type must be `multipart/form-data`.
- **Form Data:** `file: <binary image/jpeg or image/png>`
- **Response (200 OK):**
  ```json
  {
    "storage_key": "evidence_1729014521_a8f9c1.jpg",
    "file_size_bytes": 1048576,
    "original_filename": "crater_photo.jpg"
  }
  ```

---

## 5. Duplicate Candidates (`/api/v1/duplicates`)

### `GET /api/v1/duplicates/{complaint_id}`
Returns all detected duplicate candidate complaints for a given issue.

### `PUT /api/v1/duplicates/{candidate_id}/review`
Municipal officer reviews candidate and marks as `CONFIRMED_DUPLICATE` or `DISMISSED`.
- **Request Body:**
  ```json
  {
    "status": "CONFIRMED_DUPLICATE",
    "review_reason": "Same water main rupture reported by two neighboring shopkeepers."
  }
  ```

---

## 6. Municipal Governance & Admin (`/api/v1/admin`)

- `GET /api/v1/admin/users`: Lists registered platform users with role and status filtering.
- `PUT /api/v1/admin/users/{id}/role`: Updates user role (`CITIZEN`, `OFFICER`, `ADMIN`). Protected against demoting the last active administrator.
- `PUT /api/v1/admin/users/{id}/status`: Activates or suspends user accounts with mandatory reason.
- `GET /api/v1/admin/audit-logs`: Retrieves immutable audit trail with actor name, action, and JSON diffs.
- `GET /api/v1/admin/settings`: Retrieves all system settings.
- `PUT /api/v1/admin/settings/{key}`: Updates a specific runtime setting.
