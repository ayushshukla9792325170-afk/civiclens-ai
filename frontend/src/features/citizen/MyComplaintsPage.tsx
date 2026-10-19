import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Complaint } from '../../types';
import { StatusBadge, SeverityBadge, CategoryBadge } from '../../components/common/Badge';
import { FeedbackModal } from '../../components/complaints/FeedbackModal';
import { Button } from '../../components/common/Button';
import { 
  PlusCircle, Filter, Calendar, MapPin, Building2, 
  ExternalLink, CheckCircle2, RotateCcw
} from 'lucide-react';

export const MyComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [feedbackComplaint, setFeedbackComplaint] = useState<Complaint | null>(null);

  const fetchMyComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.listMyComplaints({
        page: 1,
        page_size: 50,
        status: statusFilter || undefined,
      });
      setComplaints(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyComplaints();
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Filter & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Filter by Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-2 rounded-xl border border-slate-300 bg-white focus:ring-teal-500"
          >
            <option value="">All Statuses ({complaints.length})</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="VERIFIED">Verified</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved (Action Required)</option>
            <option value="CITIZEN_VERIFIED">Citizen Verified</option>
            <option value="REJECTED">Rejected</option>
            <option value="REOPENED">Reopened</option>
          </select>
        </div>

        <Link to="/report">
          <Button variant="primary" size="sm" icon={<PlusCircle className="w-4 h-4" />}>
            New Complaint
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Loading your complaints...</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <h3 className="text-base font-bold text-slate-900">No Complaints Recorded</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You currently have no complaints matching the selected filter criteria.
          </p>
          <Link to="/report" className="inline-block mt-2">
            <Button variant="primary" size="sm">File a Report</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Table / List layout on larger screens, card layout on mobile */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Ref Number</th>
                    <th className="py-3.5 px-4">Issue Title & Category</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Submitted</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {complaints.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-teal-800">
                        {c.reference_number}
                      </td>

                      <td className="py-4 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 truncate">{c.title}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <CategoryBadge category={c.category} />
                          <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                            {c.address}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <SeverityBadge severity={c.severity} size="sm" />
                      </td>

                      <td className="py-4 px-4">
                        <StatusBadge status={c.status} size="sm" />
                      </td>

                      <td className="py-4 px-4 text-slate-600 font-medium">
                        {c.department_name || 'Pending routing'}
                      </td>

                      <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-4 text-right space-x-2">
                        {c.status === 'RESOLVED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setFeedbackComplaint(c)}
                            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          >
                            Verify
                          </Button>
                        )}

                        <Link to={`/complaints/${c.id}`}>
                          <Button variant="outline" size="sm">
                            Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Verification Feedback Modal */}
      {feedbackComplaint && (
        <FeedbackModal
          complaintId={feedbackComplaint.id}
          referenceNumber={feedbackComplaint.reference_number}
          isOpen={!!feedbackComplaint}
          onClose={() => setFeedbackComplaint(null)}
          onSuccess={() => {
            fetchMyComplaints();
          }}
        />
      )}
    </div>
  );
};
