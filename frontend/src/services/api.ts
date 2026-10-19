import {
  User, Department, Ward, Complaint, DuplicateCandidate,
  AIAnalysisResult, NotificationItem, AnalyticsOverview,
  AuditLog, PaginatedResponse, IssueCategory, IssueSeverity, ComplaintStatus
} from '../types';

const API_BASE = '/api/v1';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('civiclens_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('civiclens_token', token);
    } else {
      localStorage.removeItem('civiclens_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMsg = `HTTP Error ${res.status}`;
      try {
        const errorData = await res.json();
        if (errorData.detail) {
          errorMsg = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        }
      } catch {
        // Fallback to text
        const text = await res.text();
        if (text) errorMsg = text;
      }
      throw new Error(errorMsg);
    }

    return res.json();
  }

  // ----------------- Auth -----------------
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const data = await this.request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async register(payload: { name: string; email: string; password: string; phone?: string; default_location?: string }): Promise<{ access_token: string; user: User }> {
    const data = await this.request<{ access_token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(data.access_token);
    return data;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async updateProfile(payload: { name?: string; phone?: string; default_location?: string; current_password?: string; new_password?: string }): Promise<User> {
    return this.request<User>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // ----------------- Complaints -----------------
  async listComplaints(params: {
    page?: number;
    page_size?: number;
    status?: string;
    category?: string;
    severity?: string;
    department_id?: string;
    ward_id?: string;
    search?: string;
  } = {}): Promise<PaginatedResponse<Complaint>> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.page_size) query.append('page_size', params.page_size.toString());
    if (params.status) query.append('status', params.status);
    if (params.category) query.append('category', params.category);
    if (params.severity) query.append('severity', params.severity);
    if (params.department_id) query.append('department_id', params.department_id);
    if (params.ward_id) query.append('ward_id', params.ward_id);
    if (params.search) query.append('search', params.search);

    return this.request<PaginatedResponse<Complaint>>(`/complaints?${query.toString()}`);
  }

  async listPublicComplaints(params: { page?: number; page_size?: number; category?: string; status?: string } = {}): Promise<PaginatedResponse<Complaint>> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.page_size) query.append('page_size', params.page_size.toString());
    if (params.category) query.append('category', params.category);
    if (params.status) query.append('status', params.status);

    return this.request<PaginatedResponse<Complaint>>(`/complaints/public?${query.toString()}`);
  }

  async listMyComplaints(params: { page?: number; page_size?: number; status?: string } = {}): Promise<PaginatedResponse<Complaint>> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.page_size) query.append('page_size', params.page_size.toString());
    if (params.status) query.append('status', params.status);

    return this.request<PaginatedResponse<Complaint>>(`/complaints/my?${query.toString()}`);
  }

  async getComplaint(id: string): Promise<Complaint> {
    return this.request<Complaint>(`/complaints/${id}`);
  }

  async createComplaint(payload: {
    title: string;
    description: string;
    category: IssueCategory;
    severity?: IssueSeverity;
    severity_explanation?: string;
    latitude: number;
    longitude: number;
    address: string;
    ward_id?: string;
    ward_name?: string;
    is_public?: boolean;
    evidence_storage_keys?: string[];
  }): Promise<Complaint> {
    return this.request<Complaint>('/complaints', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateStatus(id: string, payload: {
    new_status: ComplaintStatus;
    public_comment?: string;
    internal_note?: string;
    reason?: string;
    resolution_proof_keys?: string[];
  }): Promise<Complaint> {
    return this.request<Complaint>(`/complaints/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async assignComplaint(id: string, payload: { department_id?: string; assigned_officer_id?: string; notes?: string }): Promise<Complaint> {
    return this.request<Complaint>(`/complaints/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async overrideComplaint(id: string, payload: { category?: string; severity?: string; department_id?: string; reason: string }): Promise<Complaint> {
    return this.request<Complaint>(`/complaints/${id}/override`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async submitFeedback(id: string, rating: number, comment?: string): Promise<any> {
    return this.request(`/complaints/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
  }

  // ----------------- Evidence & Uploads -----------------
  async uploadEvidence(file: File): Promise<{ storage_key: string; file_size_bytes: number; original_filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<{ storage_key: string; file_size_bytes: number; original_filename: string }>('/evidence/upload', {
      method: 'POST',
      body: formData,
    });
  }

  // ----------------- AI Services -----------------
  async analyzeCivicReport(payload: {
    text_content?: string;
    image_storage_key?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<AIAnalysisResult> {
    return this.request<AIAnalysisResult>('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ----------------- Departments & Wards -----------------
  async getDepartments(): Promise<Department[]> {
    return this.request<Department[]>('/departments');
  }

  async getWards(): Promise<Ward[]> {
    return this.request<Ward[]>('/departments/wards');
  }

  async createDepartment(payload: Partial<Department>): Promise<Department> {
    return this.request<Department>('/departments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateDepartment(id: string, payload: Partial<Department>): Promise<Department> {
    return this.request<Department>(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // ----------------- Duplicates -----------------
  async getDuplicates(complaintId: string): Promise<DuplicateCandidate[]> {
    return this.request<DuplicateCandidate[]>(`/duplicates/${complaintId}`);
  }

  async reviewDuplicate(candidateId: string, status: 'CONFIRMED_DUPLICATE' | 'DISMISSED', review_reason: string): Promise<any> {
    return this.request(`/duplicates/${candidateId}/review`, {
      method: 'PUT',
      body: JSON.stringify({ status, review_reason }),
    });
  }

  // ----------------- Notifications -----------------
  async getNotifications(): Promise<NotificationItem[]> {
    return this.request<NotificationItem[]>('/notifications');
  }

  async getUnreadCount(): Promise<{ unread_count: number }> {
    return this.request<{ unread_count: number }>('/notifications/unread-count');
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.request(`/notifications/${id}/read`, { method: 'PUT' });
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.request('/notifications/read-all', { method: 'PUT' });
  }

  // ----------------- Analytics -----------------
  async getAnalytics(department_id?: string): Promise<AnalyticsOverview> {
    const query = department_id ? `?department_id=${encodeURIComponent(department_id)}` : '';
    return this.request<AnalyticsOverview>(`/analytics/overview${query}`);
  }

  // ----------------- Maps GeoJSON -----------------
  async getComplaintsGeoJSON(params: { status?: string; category?: string; severity?: string } = {}): Promise<any> {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.category) query.append('category', params.category);
    if (params.severity) query.append('severity', params.severity);
    return this.request(`/maps/geojson?${query.toString()}`);
  }

  // ----------------- Admin -----------------
  async getUsers(params: { role?: string; status?: string; search?: string } = {}): Promise<User[]> {
    const query = new URLSearchParams();
    if (params.role) query.append('role', params.role);
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    return this.request<User[]>(`/admin/users?${query.toString()}`);
  }

  async updateUserRole(userId: string, role: string, departmentId?: string): Promise<User> {
    return this.request<User>(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role, department_id: departmentId }),
    });
  }

  async updateUserStatus(userId: string, account_status: string, reason?: string): Promise<User> {
    return this.request<User>(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ account_status, reason }),
    });
  }

  async getAuditLogs(params: { action?: string; entity_type?: string; limit?: number } = {}): Promise<AuditLog[]> {
    const query = new URLSearchParams();
    if (params.action) query.append('action', params.action);
    if (params.entity_type) query.append('entity_type', params.entity_type);
    if (params.limit) query.append('limit', params.limit.toString());
    return this.request<AuditLog[]>(`/admin/audit-logs?${query.toString()}`);
  }

  async getSettings(): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('/admin/settings');
  }

  async updateSetting(key: string, value: any): Promise<void> {
    await this.request(`/admin/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  }
}

export const api = new ApiService();
