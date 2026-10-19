import os
import sys
from pathlib import Path
from datetime import datetime, timedelta, timezone

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.db.session import SessionLocal, Base, engine
from app.models.models import (
    User, Department, Ward, Complaint, ComplaintEvidence,
    ComplaintUpdate, Feedback, DuplicateCandidate, AIAnalysis, Notification, SystemSetting
)
from app.core.security import get_password_hash
from app.core.config import settings

def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. System Settings
        default_settings = [
            ("duplicate_distance_threshold_meters", 150.0, "Threshold distance in meters to flag duplicate complaints"),
            ("default_sla_hours", 48, "Standard department resolution target in hours"),
            ("critical_sla_hours", 12, "Critical safety resolution target in hours"),
            ("citizen_verification_timeout_days", 14, "Days citizen has to verify before auto-closing")
        ]
        for key, val, desc in default_settings:
            existing = db.query(SystemSetting).filter(SystemSetting.key == key).first()
            if not existing:
                db.add(SystemSetting(key=key, value=val, description=desc))
        db.commit()

        # 2. Wards (Metro City / Pune demonstration coordinates)
        # Center lat ~ 18.5204, lon ~ 73.8567
        wards_data = [
            ("Ward 1 - Shivaji Nagar & Central", "W-01", 18.5314, 73.8446, 2200.0),
            ("Ward 2 - Koregaon Park & Tech Park", "W-02", 18.5362, 73.8940, 2500.0),
            ("Ward 3 - Kothrud West", "W-03", 18.5074, 73.8077, 2800.0),
            ("Ward 4 - Hadapsar Industrial Belt", "W-04", 18.5089, 73.9260, 3200.0),
            ("Ward 5 - Viman Nagar & Airport Area", "W-05", 18.5679, 73.9143, 2600.0),
            ("Ward 6 - Swargate & Market Yard", "W-06", 18.4988, 73.8580, 2400.0),
        ]
        wards_map = {}
        for name, code, lat, lon, rad in wards_data:
            ward = db.query(Ward).filter(Ward.code == code).first()
            if not ward:
                ward = Ward(name=name, code=code, city="Pune Metro", center_latitude=lat, center_longitude=lon, radius_meters=rad)
                db.add(ward)
                db.flush()
            wards_map[code] = ward
        db.commit()

        # 3. Departments
        departments_data = [
            ("Public Works Department", "PWD", "Responsible for roads, pavements, potholes, bridges, and civil infrastructure maintenance.", "pwd@civiclens.gov", "+91 20 2550 1101", ["W-01", "W-02", "W-03", "W-04", "W-05", "W-06"], ["POTHOLE", "ROAD_DAMAGE", "OTHER"], 48),
            ("Sanitation & Waste Management", "SWM", "Handles municipal solid waste, garbage clearance, bins, and illegal dumping prevention.", "swm@civiclens.gov", "+91 20 2550 1102", ["W-01", "W-02", "W-03", "W-04", "W-05", "W-06"], ["GARBAGE", "ILLEGAL_DUMPING"], 24),
            ("Water Supply & Sewerage Board", "WATER", "Manages drinking water distribution pipelines, drainage cleaning, and sewer repairs.", "water@civiclens.gov", "+91 20 2550 1103", ["W-01", "W-02", "W-03", "W-04", "W-05", "W-06"], ["DRAINAGE", "WATER_LEAKAGE"], 36),
            ("Electricity & Street Lighting", "ELEC", "Maintains public streetlights, high-mast lamps, timers, and electrical safety poles.", "lighting@civiclens.gov", "+91 20 2550 1104", ["W-01", "W-02", "W-03", "W-04", "W-05", "W-06"], ["STREETLIGHT"], 24),
            ("Traffic Infrastructure & Safety", "TRAFFIC", "Manages traffic signs, signals, road markings, delineators, and pedestrian crossings.", "traffic@civiclens.gov", "+91 20 2550 1105", ["W-01", "W-02", "W-03", "W-04", "W-05", "W-06"], ["DAMAGED_SIGN"], 48)
        ]
        dept_map = {}
        for name, code, desc, email, phone, areas, cats, sla in departments_data:
            dept = db.query(Department).filter(Department.code == code).first()
            if not dept:
                dept = Department(
                    name=name, code=code, description=desc, contact_email=email,
                    contact_phone=phone, coverage_areas=areas, supported_categories=cats,
                    service_target_hours=sla, is_active=True
                )
                db.add(dept)
                db.flush()
            dept_map[code] = dept
        db.commit()

        # 4. Users (Admin, Officers, Citizens)
        users_data = [
            # Admin
            ("Municipal Chief Commissioner", "admin@civiclens.gov", "Admin@12345", "ADMIN", None, "+91 98220 00001", "Municipal HQ, Shivaji Nagar"),
            # Officers
            ("Rajesh Shinde (PWD Chief)", "officer.pwd@civiclens.gov", "Officer@12345", "OFFICER", "PWD", "+91 98220 00002", "PWD Divisional Office"),
            ("Sunita Deshmukh (Sanitation Head)", "officer.swm@civiclens.gov", "Officer@12345", "OFFICER", "SWM", "+91 98220 00003", "Sanitation Depot, Swargate"),
            ("Anil Kulkarni (Water Supply Engineer)", "officer.water@civiclens.gov", "Officer@12345", "OFFICER", "WATER", "+91 98220 00004", "Water Works, Kothrud"),
            ("Pooja Nair (Lighting Executive)", "officer.elec@civiclens.gov", "Officer@12345", "OFFICER", "ELEC", "+91 98220 00005", "Electrical Control Room, Viman Nagar"),
            # Citizens
            ("Aarav Mehta", "citizen.aarav@example.com", "Citizen@12345", "CITIZEN", None, "+91 99230 11111", "Koregaon Park, Pune"),
            ("Priya Sharma", "citizen.priya@example.com", "Citizen@12345", "CITIZEN", None, "+91 99230 22222", "Kothrud, Pune"),
            ("Vikram Patil", "citizen.vikram@example.com", "Citizen@12345", "CITIZEN", None, "+91 99230 33333", "Shivaji Nagar, Pune"),
            ("Sneha Joshi", "citizen.sneha@example.com", "Citizen@12345", "CITIZEN", None, "+91 99230 44444", "Viman Nagar, Pune")
        ]
        user_map = {}
        for name, email, pwd, role, d_code, phone, loc in users_data:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    name=name, email=email, password_hash=get_password_hash(pwd),
                    role=role, department_id=dept_map[d_code].id if d_code else None,
                    phone=phone, default_location=loc, account_status="ACTIVE"
                )
                db.add(user)
                db.flush()
            user_map[email] = user
        db.commit()

        # 5. Create demo SVG evidence images in uploads/
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        demo_images = {
            "pothole_sample.jpg": """<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="#334155"/><path d="M120 220 Q200 160 380 200 Q480 240 440 320 Q320 370 180 340 Z" fill="#1e293b" stroke="#0f172a" stroke-width="4"/><text x="30" y="50" fill="#f8fafc" font-size="22" font-family="sans-serif">Civic Evidence: Severe Pothole Damage on Main Road</text><circle cx="280" cy="260" r="30" fill="#0f172a"/><path d="M100 380 L500 380" stroke="#fbbf24" stroke-width="8" stroke-dasharray="20 20"/></svg>""",
            "garbage_sample.jpg": """<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="#475569"/><rect x="150" y="180" width="180" height="180" fill="#059669" rx="8"/><path d="M120 240 Q250 120 420 220 L400 360 L140 360 Z" fill="#d97706" opacity="0.8"/><text x="30" y="50" fill="#f8fafc" font-size="22" font-family="sans-serif">Civic Evidence: Overflowing Waste Bin at Market Entrance</text></svg>""",
            "drain_sample.jpg": """<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="#1e293b"/><circle cx="300" cy="220" r="90" fill="#0284c7" stroke="#38bdf8" stroke-width="6"/><circle cx="300" cy="220" r="40" fill="#0f172a"/><text x="30" y="50" fill="#f8fafc" font-size="22" font-family="sans-serif">Civic Evidence: Open Manhole and Waterlogging Hazard</text></svg>""",
            "streetlight_sample.jpg": """<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="#090d16"/><line x1="250" y1="380" x2="250" y2="120" stroke="#94a3b8" stroke-width="10"/><path d="M250 120 Q320 80 360 140" stroke="#94a3b8" stroke-width="8" fill="none"/><circle cx="360" cy="150" r="15" fill="#475569"/><text x="30" y="50" fill="#f8fafc" font-size="22" font-family="sans-serif">Civic Evidence: Broken Streetlight Blackout on Lane 4</text></svg>""",
            "resolution_sample.jpg": """<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="#10b981"/><path d="M180 220 L260 300 L420 140" stroke="#ffffff" stroke-width="24" stroke-linecap="round" fill="none"/><text x="30" y="60" fill="#ffffff" font-size="26" font-weight="bold" font-family="sans-serif">MUNICIPAL RESOLUTION VERIFIED — REPAIRED</text><text x="30" y="360" fill="#ecfdf5" font-size="18" font-family="sans-serif">CivicLens Official Work Order Completion Proof</text></svg>"""
        }
        for fname, svg_content in demo_images.items():
            fpath = settings.UPLOAD_DIR / fname
            if not fpath.exists():
                with open(fpath, "w", encoding="utf-8") as f:
                    f.write(svg_content)

        # 6. Seed 24 Realistic Complaints
        now = datetime.now(timezone.utc)
        complaints_specs = [
            # 1. Critical open drain
            ("CLN-2026-1001", "citizen.aarav@example.com", "Dangerous open manhole near bus stop", "Deep open manhole without cover near primary school entrance on main lane. Massive hazard for pedestrians and children at night.", "DRAINAGE", "CRITICAL", "WATER", "officer.water@civiclens.gov", "IN_PROGRESS", 18.5312, 73.8441, "Opposite Shivaji Nagar Bus Depot, Pune", "W-01", 5, "drain_sample.jpg", None),
            # 2. Critical live wire
            ("CLN-2026-1002", "citizen.priya@example.com", "Live electric wire sparking from street pole", "Heavy rain caused live exposed electric wire to snap and dangle above wet footpath. Sparks visible, risk of electric shock.", "STREETLIGHT", "CRITICAL", "ELEC", "officer.elec@civiclens.gov", "ASSIGNED", 18.5070, 73.8072, "Paud Road, Near Kothrud Post Office, Pune", "W-03", 2, "streetlight_sample.jpg", None),
            # 3. High severity pothole
            ("CLN-2026-1003", "citizen.vikram@example.com", "Deep crater pothole on North Main Road", "Multiple two-wheelers slipping due to large pothole right after turn. Tar has completely peeled away.", "POTHOLE", "HIGH", "PWD", "officer.pwd@civiclens.gov", "RESOLVED", 18.5365, 73.8945, "North Main Road, Lane 5, Koregaon Park, Pune", "W-02", 12, "pothole_sample.jpg", "resolution_sample.jpg"),
            # 4. Verified duplicate candidate of complaint #3
            ("CLN-2026-1004", "citizen.aarav@example.com", "Very bad pothole causing traffic jam", "Car wheels getting stuck in deep depression on North Main Road near Lane 5 corner.", "POTHOLE", "HIGH", "PWD", "officer.pwd@civiclens.gov", "RESOLVED", 18.5366, 73.8943, "Lane 5 junction, Koregaon Park, Pune", "W-02", 11, "pothole_sample.jpg", "resolution_sample.jpg"),
            # 5. Garbage accumulation
            ("CLN-2026-1005", "citizen.sneha@example.com", "Overflowing community waste bin rotting", "Garbage not collected for 4 days. Waste spilling across pavement with stray animals gathering.", "GARBAGE", "MEDIUM", "SWM", "officer.swm@civiclens.gov", "CITIZEN_VERIFIED", 18.5674, 73.9140, "Symbiosis Road, Viman Nagar, Pune", "W-05", 20, "garbage_sample.jpg", "resolution_sample.jpg"),
            # 6. Pipeline burst
            ("CLN-2026-1006", "citizen.priya@example.com", "Drinking water pipeline burst wasting thousands of liters", "High pressure pipeline rupture gushing clean water into storm drain for 6 hours continuously.", "WATER_LEAKAGE", "HIGH", "WATER", "officer.water@civiclens.gov", "IN_PROGRESS", 18.5085, 73.8080, "Karve Road, Kothrud, Pune", "W-03", 3, "drain_sample.jpg", None),
            # 7. Streetlight blackout
            ("CLN-2026-1007", "citizen.vikram@example.com", "Entire stretch of 8 streetlights dark", "Complete blackout from corner of Market Yard to Gate 2. Extremely unsafe for women walking after 8 PM.", "STREETLIGHT", "HIGH", "ELEC", "officer.elec@civiclens.gov", "SUBMITTED", 18.4985, 73.8575, "Market Yard Outer Road, Swargate, Pune", "W-06", 1, "streetlight_sample.jpg", None),
            # 8. Illegal construction debris
            ("CLN-2026-1008", "citizen.aarav@example.com", "Illegal dumping of concrete debris on public footpath", "Truck dumped construction debris blocking wheelchair ramp and footpath overnight.", "ILLEGAL_DUMPING", "MEDIUM", "SWM", "officer.swm@civiclens.gov", "VERIFIED", 18.5095, 73.9265, "Gadital Chowk, Hadapsar, Pune", "W-04", 4, "garbage_sample.jpg", None),
            # 9. Damaged directional sign
            ("CLN-2026-1009", "citizen.sneha@example.com", "Fallen highway directional sign blocking left turn", "Metal sign board bent by vehicle collision now hanging dangerously into traffic lane.", "DAMAGED_SIGN", "MEDIUM", "TRAFFIC", None, "ASSIGNED", 18.5685, 73.9150, "Airport Road Junction, Viman Nagar, Pune", "W-05", 6, "pothole_sample.jpg", None),
            # 10. Road cave in
            ("CLN-2026-1010", "citizen.vikram@example.com", "Asphalt collapsed over sewer trench", "Trench settled by 6 inches right in the middle of Shivaji Road. Two-wheelers skidding.", "ROAD_DAMAGE", "HIGH", "PWD", "officer.pwd@civiclens.gov", "IN_PROGRESS", 18.5305, 73.8450, "Shivaji Road, Near Municipal Court, Pune", "W-01", 7, "pothole_sample.jpg", None),
            # 11. Minor street litter
            ("CLN-2026-1011", "citizen.aarav@example.com", "Dry leaves and paper litter accumulated along curb", "Minor accumulation of fallen tree leaves and commercial flyers along median.", "GARBAGE", "LOW", "SWM", "officer.swm@civiclens.gov", "RESOLVED", 18.5370, 73.8950, "South Main Road, Koregaon Park, Pune", "W-02", 15, "garbage_sample.jpg", "resolution_sample.jpg"),
            # 12. Clogged stormwater drain
            ("CLN-2026-1012", "citizen.priya@example.com", "Stormwater drain choked causing puddle", "Plastic bags trapped inside metal grill preventing water flow during light showers.", "DRAINAGE", "MEDIUM", "WATER", "officer.water@civiclens.gov", "CITIZEN_VERIFIED", 18.5065, 73.8065, "Mayur Colony, Kothrud, Pune", "W-03", 22, "drain_sample.jpg", "resolution_sample.jpg"),
            # 13. Broken road divider
            ("CLN-2026-1013", "citizen.vikram@example.com", "Concrete median block displaced into fast lane", "Heavy vehicle hit divider, concrete block displaced into oncoming vehicle lane.", "ROAD_DAMAGE", "HIGH", "PWD", "officer.pwd@civiclens.gov", "ASSIGNED", 18.5090, 73.9250, "Magarpatta Road, Hadapsar, Pune", "W-04", 8, "pothole_sample.jpg", None),
            # 14. Streetlight flickering
            ("CLN-2026-1014", "citizen.sneha@example.com", "High mast LED light continuously strobing", "Defective ballast causing strobe-light effect right outside residential apartment windows.", "STREETLIGHT", "LOW", "ELEC", "officer.elec@civiclens.gov", "VERIFIED", 18.5670, 73.9135, "Clover Park, Viman Nagar, Pune", "W-05", 9, "streetlight_sample.jpg", None),
            # 15. Garbage burning hazard
            ("CLN-2026-1015", "citizen.aarav@example.com", "Toxic plastic garbage burning on vacant plot", "Dense smoke from unauthorized waste burning spreading across neighborhood.", "ILLEGAL_DUMPING", "HIGH", "SWM", "officer.swm@civiclens.gov", "RESOLVED", 18.5320, 73.8460, "Behind Sangam Bridge, Shivaji Nagar, Pune", "W-01", 16, "garbage_sample.jpg", "resolution_sample.jpg"),
            # 16. Water valve leak
            ("CLN-2026-1016", "citizen.priya@example.com", "Leaking underground valve bubbling on road", "Continuous stream of water seeping through road surface weakening road sub-base.", "WATER_LEAKAGE", "MEDIUM", "WATER", "officer.water@civiclens.gov", "ASSIGNED", 18.5080, 73.8090, "Gujrat Colony, Kothrud, Pune", "W-03", 10, "drain_sample.jpg", None),
            # 17. Traffic signal blackout
            ("CLN-2026-1017", "citizen.vikram@example.com", "Traffic signal dead at four-way intersection", "Red/Yellow/Green all dark during peak morning rush hour. Traffic gridlock occurring.", "DAMAGED_SIGN", "CRITICAL", "TRAFFIC", None, "IN_PROGRESS", 18.4990, 73.8590, "Swargate Chowk, Pune", "W-06", 1, "pothole_sample.jpg", None),
            # 18. Pothole cluster
            ("CLN-2026-1018", "citizen.sneha@example.com", "Multiple potholes on bus route near school", "Series of 4 connected potholes forcing buses onto opposite lane.", "POTHOLE", "HIGH", "PWD", "officer.pwd@civiclens.gov", "SUBMITTED", 18.5690, 73.9160, "Tingre Nagar Road, Viman Nagar, Pune", "W-05", 3, "pothole_sample.jpg", None),
            # 19. Open sewer trench
            ("CLN-2026-1019", "citizen.aarav@example.com", "Contractor left 5-foot sewer ditch unbarricaded", "Deep ditch dug across public lane without hazard tape, barricades, or warning lights.", "DRAINAGE", "CRITICAL", "WATER", "officer.water@civiclens.gov", "ASSIGNED", 18.5310, 73.8435, "Ghole Road, Shivaji Nagar, Pune", "W-01", 2, "drain_sample.jpg", None),
            # 20. Faded zebra crossing
            ("CLN-2026-1020", "citizen.priya@example.com", "Zebra crossing completely faded outside elderly clinic", "Vehicles do not stop for pedestrians because paint has vanished completely.", "ROAD_DAMAGE", "LOW", "PWD", "officer.pwd@civiclens.gov", "RESOLVED", 18.5075, 73.8085, "Ideal Colony, Kothrud, Pune", "W-03", 25, "pothole_sample.jpg", "resolution_sample.jpg"),
            # 21. Medical waste dumping
            ("CLN-2026-1021", "citizen.vikram@example.com", "Unidentified bags dumped in canal stream", "Plastic bags containing clinical or chemical waste dumped along water channel.", "ILLEGAL_DUMPING", "CRITICAL", "SWM", "officer.swm@civiclens.gov", "IN_PROGRESS", 18.5098, 73.9270, "Mutha Right Bank Canal, Hadapsar, Pune", "W-04", 4, "garbage_sample.jpg", None),
            # 22. Broken streetlight glass
            ("CLN-2026-1022", "citizen.sneha@example.com", "Shattered glass luminaire hanging from pole", "Lamp casing broken after storm; glass shards dropping onto sidewalk.", "STREETLIGHT", "HIGH", "ELEC", "officer.elec@civiclens.gov", "REOPENED", 18.5680, 73.9145, "Konark Nagar, Viman Nagar, Pune", "W-05", 14, "streetlight_sample.jpg", None),
            # 23. Invalid complaint (Rejected test case)
            ("CLN-2026-1023", "citizen.aarav@example.com", "Private residential balcony paint complaint", "Neighbor's interior balcony wall paint does not match society scheme.", "OTHER", "LOW", "PWD", "officer.pwd@civiclens.gov", "REJECTED", 18.5325, 73.8455, "FC Road, Shivaji Nagar, Pune", "W-01", 18, "pothole_sample.jpg", None),
            # 24. Clean citizen verified case
            ("CLN-2026-1024", "citizen.priya@example.com", "Commercial trash bin cleaned and sanitized", "Bin was overflowing with food waste; municipal team arrived within 18 hours.", "GARBAGE", "MEDIUM", "SWM", "officer.swm@civiclens.gov", "CITIZEN_VERIFIED", 18.5060, 73.8070, "Dahanukar Colony, Kothrud, Pune", "W-03", 28, "garbage_sample.jpg", "resolution_sample.jpg")
        ]

        created_complaints = {}
        for (ref, cit_email, title, desc, cat, sev, dept_code, off_email, status, lat, lon, addr, w_code, days_ago, img_name, res_img) in complaints_specs:
            comp = db.query(Complaint).filter(Complaint.reference_number == ref).first()
            cit = user_map[cit_email]
            off = user_map[off_email] if off_email else None
            dept = dept_map[dept_code] if dept_code else None
            ward = wards_map[w_code] if w_code else None
            comp_time = now - timedelta(days=days_ago)

            resolved_time = comp_time + timedelta(hours=28) if status in ["RESOLVED", "CITIZEN_VERIFIED"] else None
            verified_time = resolved_time + timedelta(hours=14) if status == "CITIZEN_VERIFIED" else None

            if not comp:
                comp = Complaint(
                    reference_number=ref,
                    user_id=cit.id,
                    title=title,
                    description=desc,
                    category=cat,
                    severity=sev,
                    severity_explanation=f"Demo evaluated risk assessment for {cat} in {ward.name}.",
                    ai_confidence=0.91,
                    ai_analysis_mode="RULE_BASED",
                    department_id=dept.id if dept else None,
                    assigned_officer_id=off.id if off else None,
                    status=status,
                    latitude=lat,
                    longitude=lon,
                    address=addr,
                    ward_id=ward.id if ward else None,
                    ward_name=ward.name if ward else None,
                    is_public=True,
                    resolution_notes="Work completed by municipal field squad with verification." if status in ["RESOLVED", "CITIZEN_VERIFIED"] else None,
                    resolved_at=resolved_time,
                    citizen_verified_at=verified_time,
                    created_at=comp_time,
                    updated_at=comp_time + timedelta(hours=2)
                )
                db.add(comp)
                db.flush()

                # Evidence
                if img_name:
                    db.add(ComplaintEvidence(
                        complaint_id=comp.id,
                        storage_key=f"/uploads/{img_name}",
                        evidence_type="INITIAL_REPORT",
                        original_filename=img_name,
                        content_type="image/jpeg",
                        file_size_bytes=42000,
                        uploader_id=cit.id,
                        created_at=comp_time
                    ))
                if res_img and status in ["RESOLVED", "CITIZEN_VERIFIED"]:
                    db.add(ComplaintEvidence(
                        complaint_id=comp.id,
                        storage_key=f"/uploads/{res_img}",
                        evidence_type="RESOLUTION_PROOF",
                        original_filename=res_img,
                        content_type="image/jpeg",
                        file_size_bytes=52000,
                        uploader_id=off.id if off else cit.id,
                        created_at=resolved_time or comp_time
                    ))

                # Updates timeline
                db.add(ComplaintUpdate(
                    complaint_id=comp.id,
                    previous_status="NONE",
                    new_status="SUBMITTED",
                    public_comment="Complaint logged via CivicLens citizen portal.",
                    updated_by_id=cit.id,
                    created_at=comp_time
                ))
                if status in ["ASSIGNED", "IN_PROGRESS", "RESOLVED", "CITIZEN_VERIFIED"]:
                    db.add(ComplaintUpdate(
                        complaint_id=comp.id,
                        previous_status="SUBMITTED",
                        new_status="ASSIGNED",
                        public_comment=f"Assigned to {dept.name} ward inspection unit.",
                        internal_note="Priority verified on dispatch queue.",
                        updated_by_id=off.id if off else cit.id,
                        created_at=comp_time + timedelta(hours=3)
                    ))
                if status in ["IN_PROGRESS", "RESOLVED", "CITIZEN_VERIFIED"]:
                    db.add(ComplaintUpdate(
                        complaint_id=comp.id,
                        previous_status="ASSIGNED",
                        new_status="IN_PROGRESS",
                        public_comment="Field team mobilized on site with repair machinery.",
                        updated_by_id=off.id if off else cit.id,
                        created_at=comp_time + timedelta(hours=8)
                    ))
                if status in ["RESOLVED", "CITIZEN_VERIFIED"]:
                    db.add(ComplaintUpdate(
                        complaint_id=comp.id,
                        previous_status="IN_PROGRESS",
                        new_status="RESOLVED",
                        public_comment="Rectification finished. Photographic proof uploaded.",
                        updated_by_id=off.id if off else cit.id,
                        created_at=resolved_time or comp_time
                    ))
                if status == "CITIZEN_VERIFIED":
                    db.add(ComplaintUpdate(
                        complaint_id=comp.id,
                        previous_status="RESOLVED",
                        new_status="CITIZEN_VERIFIED",
                        public_comment="Citizen confirmed on-site that issue has been satisfactorily resolved.",
                        updated_by_id=cit.id,
                        created_at=verified_time or comp_time
                    ))
                    # Add 5 star feedback
                    db.add(Feedback(
                        complaint_id=comp.id,
                        citizen_id=cit.id,
                        rating=5,
                        comment="Prompt response and clean road repair! Thank you.",
                        created_at=verified_time or comp_time
                    ))
                if status == "REJECTED":
                    db.add(ComplaintUpdate(
                        complaint_id=comp.id,
                        previous_status="SUBMITTED",
                        new_status="REJECTED",
                        public_comment="Private property dispute outside municipal jurisdiction. Re-directed to cooperative society.",
                        internal_note="Not under municipal public works purview.",
                        updated_by_id=off.id if off else cit.id,
                        created_at=comp_time + timedelta(hours=6)
                    ))

                # AI Analysis record
                db.add(AIAnalysis(
                    complaint_id=comp.id,
                    model_provider="CivicLens Intelligence Engine v1",
                    analysis_mode="RULE_BASED",
                    structured_output={
                        "category": cat,
                        "severity": sev,
                        "confidence": 0.91,
                        "department": dept.name if dept else "Public Works"
                    },
                    confidence_score=0.91,
                    processing_status="SUCCESS",
                    created_at=comp_time
                ))

            created_complaints[ref] = comp

        db.commit()

        # 7. Connect duplicate candidate pair (CLN-2026-1004 is duplicate of CLN-2026-1003)
        c3 = created_complaints.get("CLN-2026-1003")
        c4 = created_complaints.get("CLN-2026-1004")
        if c3 and c4:
            dup_exist = db.query(DuplicateCandidate).filter(
                DuplicateCandidate.source_complaint_id == c4.id,
                DuplicateCandidate.candidate_complaint_id == c3.id
            ).first()
            if not dup_exist:
                db.add(DuplicateCandidate(
                    source_complaint_id=c4.id,
                    candidate_complaint_id=c3.id,
                    distance_meters=24.5,
                    similarity_score=0.92,
                    status="CONFIRMED_DUPLICATE",
                    reviewed_by_id=user_map["officer.pwd@civiclens.gov"].id,
                    review_reason="Both reports describe the same pothole crater on North Main Road Lane 5.",
                    created_at=now - timedelta(days=10)
                ))
                db.commit()

        # 8. Notifications for demo users
        notif_samples = [
            ("citizen.aarav@example.com", "CLN-2026-1001", "STATUS_CHANGE", "Complaint #CLN-2026-1001 In Progress", "Municipal field squad mobilized on site for open drain barricading."),
            ("officer.pwd@civiclens.gov", "CLN-2026-1003", "ASSIGNMENT", "New High Priority Assignment: #CLN-2026-1003", "Deep crater pothole on North Main Road assigned to your unit."),
            ("citizen.sneha@example.com", "CLN-2026-1005", "RESOLUTION_VERIFY", "Complaint #CLN-2026-1005 Resolved", "Sanitation squad cleared waste bin. Please verify resolution.")
        ]
        for u_email, ref, n_type, title, msg in notif_samples:
            usr = user_map.get(u_email)
            cmp = created_complaints.get(ref)
            if usr and cmp:
                db.add(Notification(
                    recipient_user_id=usr.id,
                    complaint_id=cmp.id,
                    notification_type=n_type,
                    title=title,
                    message=msg,
                    is_read=False,
                    created_at=now - timedelta(hours=2)
                ))
        db.commit()

        print("Seed data successfully loaded with 24 complaints, 5 departments, 6 wards, and demo users!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
