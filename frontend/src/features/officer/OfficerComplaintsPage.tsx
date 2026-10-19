import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Complaint, Department, Ward, IssueCategory, IssueSeverity, ComplaintStatus } from '../../types';
import { StatusBadge, SeverityBadge, CategoryBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { 
  Search, Filter, RotateCcw, ChevronLeft, ChevronRight, 
  MapPin, Building2, AlertTriangle, Eye
} from 'lucide-react';

export const OfficerComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [wardId, setWardId] = useState('');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.listComplaints({
        page,
        page_size: 15,
        search: search.trim() || undefined,
        category: category || undefined,
        severity: severity || undefined,
        status: status || undefined,
        department_id: departmentId || undefined,
        ward_id: wardId || undefined,
      });
      setComplaints(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch of departments & wards for filters
    Promise.all([api.getDepartments(), api.getWards()])
      .then(([depts, wList]) => {
        setDepartments(depts);
        setWards(wList);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [page, category, severity, status, departmentId, wardId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchComplaints();
  };

  const handleReset = () => {
    setSearch('');
    setCategory('');
    setSeverity('');
    setStatus('');
    setDepartmentId('');
    setWardId('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, citizen title, address, or keywords..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <Button type="submit" variant="primary" size="sm">
            Search Records
          </Button>
          {(search || category || severity || status || departmentId || wardId) && (
            <Button type="button" variant="ghost" size="sm" onClick={handleReset} icon={<RotateCcw className="w-3.5 h-3.5" />}>
              Reset
            </Button>
          )}
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Category */}
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="p-2 rounded-xl border border-slate-300 bg-white"
          >
            <option value="">All Categories</option>
            <option value="POTHOLE">Potholes</option>
            <option value="GARBAGE">Garbage</option>
            <option value="STREETLIGHT">Streetlights</option>
            <option value="DRAINAGE">Drainage / Sewer</option>
            <option value="ROAD_DAMAGE">Road Damage</option>
            <option value="DAMAGED_SIGN">Damaged Signage</option>
            <option value="WATER_LEAKAGE">Water Leakage</option>
            <option value="ILLEGAL_DUMPING">Illegal Dumping</option>
          </select>

          {/* Severity */}
          <select
            value={severity}
            onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
            className="p-2 rounded-xl border border-slate-300 bg-white"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical Hazards</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="p-2 rounded-xl border border-slate-300 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="VERIFIED">Verified</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CITIZEN_VERIFIED">Citizen Verified</option>
            <option value="REJECTED">Rejected</option>
            <option value="REOPENED">Reopened</option>
          </select>

          {/* Department */}
          <select
            value={departmentId}
            onChange={(e) => { setDepartmentId(e.target.value); setPage(1); }}
            className="p-2 rounded-xl border border-slate-300 bg-white truncate"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </select>

          {/* Ward */}
          <select
            value={wardId}
            onChange={(e) => { setWardId(e.target.value); setPage(1); }}
            className="p-2 rounded-xl border border-slate-300 bg-white truncate"
          >
            <option value="">All Wards</option>
            {wards.map(w => (
              <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Querying municipal complaints database...</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <p className="text-xs text-slate-500">No complaints matching current filters.</p>
          <Button variant="outline" size="sm" onClick={handleReset} className="mt-3">
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Ref Number</th>
                  <th className="py-3.5 px-4">Problem & Location</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Department / Assignee</th>
                  <th className="py-3.5 px-4">Submitted</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-800">
                      {c.reference_number}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 truncate">{c.title}</div>
                      <div className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span>{c.address}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <CategoryBadge category={c.category} />
                    </td>

                    <td className="py-3.5 px-4">
                      <SeverityBadge severity={c.severity} size="sm" />
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-medium truncate max-w-[140px]">
                        {c.department_name || 'Unassigned'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {c.assigned_officer_name ? `Officer: ${c.assigned_officer_name}` : 'No officer'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link to={`/officer/complaints/${c.id}`}>
                        <Button variant="secondary" size="sm" icon={<Eye className="w-3.5 h-3.5" />}>
                          Inspect
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-slate-200 text-xs">
            <span className="text-slate-500">
              Showing {complaints.length} of {total} records (Page {page} of {Math.max(1, Math.ceil(total / 15))})
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                icon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page * 15 >= total}
                onClick={() => setPage((p) => p + 1)}
                icon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
