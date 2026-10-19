# CivicLens AI — Security, Governance & Privacy Review

This document outlines the security architecture, risk mitigations, privacy protections, and defensive safeguards implemented across CivicLens AI.

---

## 1. Authentication & Session Security

### Password Hashing
- Passwords are never stored in plaintext or reversible formats.
- Uses **bcrypt** with randomly generated per-user salt rounds.
- Resistant to rainbow table attacks and GPU-accelerated hash cracking.

### JWT Bearer Tokens
- Sessions use JSON Web Tokens (JWT) signed with HMAC-SHA256 (`HS256`).
- Tokens include user UUID, email, assigned role, and explicit expiration timestamp (`exp`).
- Expired tokens or tampered signatures are rejected by the FastAPI dependency pipeline with `401 Unauthorized`.

### Role-Based Access Control (RBAC)
- Enforced strictly on backend API endpoints:
  - `require_admin`: Grants access exclusively to users with `role == "ADMIN"`.
  - `require_officer`: Grants access to `role in ["OFFICER", "ADMIN"]`.
  - `get_current_user`: Ensures valid session identity for all authenticated endpoints.
- Front-end route guards (`DashboardLayout`) provide immediate UI access controls, but security is never client-dependent.

### Last Administrator Lockout Prevention
- A critical platform governance rule prevents municipal systems from becoming unmanaged:
- When an administrator attempts to demote or suspend an admin account, the server checks the active admin pool:
  ```python
  admin_count = db.query(User).filter(User.role == "ADMIN", User.account_status == "ACTIVE").count()
  if admin_count <= 1:
      raise HTTPException(status_code=400, detail="Security constraint: Cannot demote or deactivate the last active administrator.")
  ```

---

## 2. Input Sanitization & File Upload Hardening

### Multi-Layer File Validation (`app/api/v1/evidence.py`)
- **MIME Type Whitelist:** Only valid image formats (`image/jpeg`, `image/png`, `image/webp`) and audio recordings (`audio/webm`, `audio/mp4`, `audio/mpeg`) are accepted. Executables, scripts, HTML, or SVG files with embedded script tags are rejected immediately with `400 Bad Request`.
- **File Size Ceiling:** Maximum upload size is enforced at 10 MB per file to prevent Denial of Service (DoS) attacks.
- **Storage Sanitization:** Uploaded files are renamed using cryptographically secure random UUIDs (`evidence_{timestamp}_{uuid}.ext`) rather than preserving user-supplied file system paths. This eliminates directory traversal attacks (`../../etc/passwd`).

### SQL Injection Prevention
- All database queries use **SQLAlchemy 2.0 ORM** parameterized statements.
- User input is bound to query parameters rather than concatenated into raw SQL strings, completely preventing SQL injection vulnerabilities.

### Strong Schema Validation
- All inbound JSON payloads pass through **Pydantic v2** models with strict type enforcement, string length restrictions, and regex format validations (e.g., email format, phone numbers, valid status transitions).

---

## 3. Citizen Privacy & Location Protection

### Public Ledger Anonymization (`/api/v1/complaints/public`)
- Citizen reports displayed on public transparency dashboards and interactive maps are sanitized:
  - Reporting citizen's name, user ID, email address, and phone number are completely omitted from the public response schema.
  - Only non-sensitive public details (complaint reference number, defect category, severity, address, and status) are surfaced.

### Immutable Audit Trail (`app/models/models.py`)
- Sensitive administrative events are written to an append-only `audit_logs` table:
  - Role modifications (`USER_ROLE_CHANGED`)
  - Account status suspensions (`USER_STATUS_CHANGED`)
  - Status overrides and officer justifications (`AI_OVERRIDE`)
  - Duplicate reviews (`DUPLICATE_REVIEWED`)
- Logs capture actor ID, timestamp, before/after JSON diffs, reason, and client IP address.

---

## 4. AI Copilot Safety & Fallback Integrity

### No Vendor Lock-In / Safe Fallback
- If the Gemini API key is omitted, invalid, or reaches quota exhaustion, the platform does not fail or display blank screens. It transparently shifts to a deterministic keyword heuristic engine.
- Every analysis payload clearly reports its operating mode:
  - `"AI_GEMINI"`: Processed by Gemini Multimodal Vision & Reasoning.
  - `"RULE_BASED"`: Processed by server-side deterministic heuristics.
- The platform never fabricates or simulates successful external AI analysis.

### Human-in-the-Loop Override
- AI recommendations are never binding on civic records.
- Officers retain full legal discretion to change category, adjust priority, or re-route tickets, ensuring accountability remains with authorized municipal personnel.
