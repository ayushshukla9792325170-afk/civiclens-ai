import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Complaint, Department, Ward } from '../../types';
import { StatusBadge, SeverityBadge, CategoryBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { 
  ListChecks, Search, Filter, RefreshCw, ExternalLink, 
  MapPin, Clock, AlertTriangle, Eye, ChevronLeft, ChevronRight, Download
} from 'lucide-react';

export const AdminComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [wardFilter, setWardFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const [deptRes, wardRes, complaintsRes] = await Promise.all([
        api.getDepartments(),
        api.getWards(),
        api.listComplaints({
          page,
          page_size: pageSize,
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
          severity: severityFilter || undefined,
          department_id: deptFilter || undefined,
          ward_id: wardFilter || undefined,
          search: searchQuery || undefined,
        })
      ]);
      setDepartments(deptRes);
      setWards(wardRes);
      setComplaints(complaintsRes.items);
      const pages = Math.ceil((complaintsRes.total || 0) / pageSize) || 1;
      setTotalPages(pages);
      setTotalCount(complaintsRes.total || 0);
    } catch (err) {
      console.error('Failed to load master complaints ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, pageSize, statusFilter, categoryFilter, severityFilter, deptFilter, wardFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchComplaints();
  };

  const handleExportCSV = () => {
    if (complaints.length === 0) return;
    const headers = ['Reference Number', 'Title', 'Category', 'Severity', 'Status', 'Department', 'Ward', 'Address', 'Submitted At', 'Overdue'];
    const rows = complaints.map(c => [
      c.reference_number,
      `"${c.title.replace(/"/g, '""')}"`,
      c.category,
      c.severity,
      c.status,
      `"${c.department_name || ''}"`,
      `"${c.ward_name || ''}"`,
      `"${c.address.replace(/"/g, '""')}"`,
      c.created_at,
      c.is_overdue ? 'YES' : 'NO'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `civiclens-complaints-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Control / Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">Master Complaints Ledger</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {totalCount} Total Records
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
              onClick={fetchComplaints}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by reference number (e.g. CIV-2026-), title, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </form>

        {/* Filter Selectors Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              aria-label="Filter ledger by status"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="VERIFIED">Verified</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CITIZEN_VERIFIED">Citizen Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              aria-label="Filter ledger by category"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Categories</option>
              <option value="POTHOLE">Pothole</option>
              <option value="GARBAGE">Garbage</option>
              <option value="STREETLIGHT">Streetlight</option>
              <option value="DRAINAGE">Drainage</option>
              <option value="ROAD_DAMAGE">Road Damage</option>
              <option value="DAMAGED_SIGN">Damaged Sign</option>
              <option value="WATER_LEAKAGE">Water Leakage</option>
              <option value="ILLEGAL_DUMPING">Illegal Dumping</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Severity
            </label>
            <select
              value={severityFilter}
              onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
              aria-label="Filter ledger by severity"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Department
            </label>
            <select
              value={deptFilter}
              onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
              aria-label="Filter ledger by department"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.code}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Ward
            </label>
            <select
              value={wardFilter}
              onChange={(e) => { setWardFilter(e.target.value); setPage(1); }}
              aria-label="Filter ledger by ward"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Wards</option>
              {wards.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Master Complaints Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-5">Reference</th>
                <th className="py-3.5 px-5">Issue Title & Ward</th>
                <th className="py-3.5 px-5">Category</th>
                <th className="py-3.5 px-5">Severity</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Department</th>
                <th className="py-3.5 px-5">SLA Deadline</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {complaints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500 text-xs">
                    No complaints found matching the active filters.
                  </td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5">
                      <span className="font-mono text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {c.reference_number}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {new Date(c.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-4 px-5 max-w-xs">
                      <div className="font-bold text-slate-900 truncate">
                        {c.title}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{c.ward_name || c.address}</span>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <CategoryBadge category={c.category} size="sm" />
                    </td>

                    <td className="py-4 px-5">
                      <SeverityBadge severity={c.severity} size="sm" />
                    </td>

                    <td className="py-4 px-5">
                      <StatusBadge status={c.status} size="sm" />
                    </td>

                    <td className="py-4 px-5">
                      {c.department_name ? (
                        <span className="font-semibold text-slate-800">
                          {c.department_name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-4 px-5">
                      {c.sla_target_at ? (
                        <div className="space-y-0.5">
                          <span className={`text-[11px] font-semibold ${
                            c.is_overdue ? 'text-rose-600 font-bold' : 'text-slate-600'
                          }`}>
                            {new Date(c.sla_target_at).toLocaleDateString()}
                          </span>
                          {c.is_overdue && (
                            <span className="block text-[10px] text-rose-600 font-bold uppercase tracking-wider">
                              Overdue
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <Link to={`/officer/complaints/${c.id}`}>
                        <Button variant="outline" size="sm" icon={<Eye className="w-3.5 h-3.5" />}>
                          Inspect
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing page <span className="font-bold text-slate-900">{page}</span> of <span className="font-bold text-slate-900">{totalPages}</span> ({totalCount} total)
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<ChevronLeft className="w-3.5 h-3.5" />}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<ChevronRight className="w-3.5 h-3.5" />}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
