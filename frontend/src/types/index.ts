export type UserRole = 'CITIZEN' | 'OFFICER' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type IssueCategory = 
  | 'POTHOLE'
  | 'GARBAGE'
  | 'STREETLIGHT'
  | 'DRAINAGE'
  | 'ROAD_DAMAGE'
  | 'DAMAGED_SIGN'
  | 'WATER_LEAKAGE'
  | 'ILLEGAL_DUMPING'
  | 'OTHER';

export type IssueSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ComplaintStatus = 
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CITIZEN_VERIFIED'
  | 'REJECTED'
  | 'REOPENED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  default_location?: string | null;
  department_id?: string | null;
  account_status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  coverage_areas?: string[];
  supported_categories?: string[];
  service_target_hours?: number;
  default_sla_hours?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Ward {
  id: string;
  name: string;
  code: string;
  city: string;
  center_latitude: number;
  center_longitude: number;
  radius_meters: number;
  ward_number?: number;
  office_address?: string;
}

export interface Evidence {
  id: string;
  complaint_id: string;
  storage_key: string;
  evidence_type: string;
  original_filename?: string | null;
  content_type: string;
  file_size_bytes: number;
  uploader_id?: string | null;
  created_at: string;
}

export interface ComplaintUpdate {
  id: string;
  complaint_id: string;
  previous_status: string;
  new_status: string;
  public_comment?: string | null;
  internal_note?: string | null;
  updated_by_id?: string | null;
  updated_by_name?: string | null;
  created_at: string;
}

export interface Feedback {
  id: string;
  complaint_id: string;
  citizen_id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
}

export interface Complaint {
  id: string;
  reference_number: string;
  user_id: string;
  reporter_name?: string | null;
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  severity_explanation?: string | null;
  ai_confidence: number;
  ai_analysis_mode: 'AI_GEMINI' | 'RULE_BASED' | 'MANUAL';
  department_id?: string | null;
  department_name?: string | null;
  assigned_officer_id?: string | null;
  assigned_officer_name?: string | null;
  status: ComplaintStatus;
  latitude: number;
  longitude: number;
  address: string;
  ward_id?: string | null;
  ward_name?: string | null;
  is_public: boolean;
  resolution_notes?: string | null;
  resolved_at?: string | null;
  citizen_verified_at?: string | null;
  sla_target_at?: string | null;
  is_overdue?: boolean;
  created_at: string;
  updated_at: string;
  evidence_items?: Evidence[];
  evidence?: Evidence[];
  feedback?: Feedback | null;
  updates?: ComplaintUpdate[];
  duplicate_count?: number;
}

export interface DuplicateCandidate {
  id: string;
  source_complaint_id: string;
  candidate_complaint_id: string;
  candidate_reference: string;
  candidate_title: string;
  candidate_category: string;
  candidate_status: string;
  candidate_created_at: string;
  distance_meters: number;
  similarity_score: number;
  status: 'DETECTED' | 'CONFIRMED_DUPLICATE' | 'DISMISSED';
  review_reason?: string | null;
  created_at: string;
}

export interface AIAnalysisResult {
  suggested_category: IssueCategory;
  suggested_title?: string;
  short_summary: string;
  suggested_severity: IssueSeverity;
  severity_explanation: string;
  confidence_score: number;
  suggested_department_code: string;
  suggested_department_name: string;
  potential_duplicates: Array<{
    complaint_id: string;
    reference_number: string;
    title: string;
    category: string;
    status: string;
    distance_meters: number;
    similarity_score: number;
    created_at: string;
  }>;
  recommended_next_step: string;
  analysis_mode: 'AI_GEMINI' | 'RULE_BASED';
  processing_status: string;
}

export interface NotificationItem {
  id: string;
  recipient_user_id: string;
  complaint_id?: string | null;
  notification_type: 'STATUS_CHANGE' | 'ASSIGNMENT' | 'RESOLUTION_VERIFY' | 'DUPLICATE_ALERT' | 'SYSTEM';
  title: string;
  message: string;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

export interface DashboardMetrics {
  total_complaints: number;
  pending_review: number;
  in_progress: number;
  resolved: number;
  citizen_verified: number;
  high_critical_count: number;
  avg_resolution_hours: number;
  overdue_count: number;
  citizen_satisfaction_avg: number;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface SeverityCount {
  severity: string;
  count: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface MonthlyTrend {
  month_year: string;
  submitted: number;
  resolved: number;
}

export interface HotspotPoint {
  latitude: number;
  longitude: number;
  weight: number;
  category: string;
  reference_number: string;
  title: string;
}

export interface AnalyticsOverview {
  metrics: DashboardMetrics;
  categories: CategoryCount[];
  severities: SeverityCount[];
  statuses: StatusCount[];
  monthly_trends: MonthlyTrend[];
  hotspots: HotspotPoint[];
}

export interface AuditLog {
  id: string;
  actor_user_id?: string | null;
  actor_name?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  before_state?: Record<string, any> | null;
  after_state?: Record<string, any> | null;
  reason?: string | null;
  ip_address?: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  page_size: number;
  items: T[];
}
