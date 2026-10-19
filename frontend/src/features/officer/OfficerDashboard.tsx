import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { AnalyticsOverview, Complaint } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ComplaintCard } from '../../components/complaints/ComplaintCard';
import { ComplaintsMap } from '../../components/maps/ComplaintsMap';
import { Button } from '../../components/common/Button';
import { 
  Building2, AlertTriangle, Clock, CheckCircle2, 
  MapPin, ArrowRight, ShieldAlert, BarChart3, ChevronRight
} from 'lucide-react';

export const OfficerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOfficerData = async () => {
      try {
        const [overviewRes, complaintsRes] = await Promise.all([
          api.getAnalytics(user?.department_id || undefined),
          api.listComplaints({ page: 1, page_size: 6, department_id: user?.department_id || undefined })
        ]);
        setAnalytics(overviewRes);
        setComplaints(complaintsRes.items);
      } catch (err) {
        console.error('Failed to load officer dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOfficerData();
  }, [user]);

  const metrics = analytics?.metrics;

  return (
    <div className="space-y-8">
      {/* KPI Operational Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Assigned */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Department Total
          </span>
          <div className="text-3xl font-extrabold text-slate-900">
            {metrics?.total_complaints ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Active municipal jurisdiction</span>
        </div>

        {/* Unassigned / Pending Review */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
            Pending Intake Review
          </span>
          <div className="text-3xl font-extrabold text-blue-700">
            {metrics?.pending_review ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Needs officer triage</span>
        </div>

        {/* High & Critical Emergency Cases */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            High / Critical Priority
          </span>
          <div className="text-3xl font-extrabold text-rose-700">
            {metrics?.high_critical_count ?? 0}
          </div>
          <span className="text-[10px] text-rose-600 mt-1 block">Fast-track response target</span>
        </div>

        {/* Overdue vs SLA */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
            Overdue Beyond SLA
          </span>
          <div className="text-3xl font-extrabold text-amber-800">
            {metrics?.overdue_count ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Avg SLA: {metrics?.avg_resolution_hours ?? 0}h
          </span>
        </div>
      </div>

      {/* Map & Operational Heatmap */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-600" />
              <span>Operational GIS Queue</span>
            </h3>
            <p className="text-xs text-slate-500">
              Real-time geocoded coordinates of pending defects in assigned municipal wards.
            </p>
          </div>
          <Link to="/officer/map">
            <Button variant="outline" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
              Open Fullscreen Map
            </Button>
          </Link>
        </div>

        {complaints.length > 0 ? (
          <ComplaintsMap
            complaints={complaints}
            height="340px"
            zoom={13}
          />
        ) : (
          <div className="h-64 flex items-center justify-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No complaints currently queued in your jurisdiction.
          </div>
        )}
      </div>

      {/* Quick Action Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Priority Complaints Awaiting Action</h3>
            <p className="text-xs text-slate-500">Review recommendations, assign field squads, and advance work orders.</p>
          </div>
          <Link to="/officer/complaints" className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1">
            <span>View All ({complaints.length})</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {complaints.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-900">All Clear!</h4>
            <p className="text-xs text-slate-500 mt-1">
              There are currently no active complaints awaiting review in your department.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complaints.slice(0, 3).map(c => (
              <ComplaintCard key={c.id} complaint={c} baseLink="/officer/complaints" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
