import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Complaint, NotificationItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ComplaintCard } from '../../components/complaints/ComplaintCard';
import { ComplaintsMap } from '../../components/maps/ComplaintsMap';
import { Button } from '../../components/common/Button';
import { 
  PlusCircle, Clock, AlertCircle, CheckCircle2, 
  MapPin, Bell, ArrowRight, ShieldCheck, ChevronRight
} from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCitizenData = async () => {
      try {
        const [complaintsRes, notifsRes] = await Promise.all([
          api.listMyComplaints({ page: 1, page_size: 10 }),
          api.getNotifications()
        ]);
        setComplaints(complaintsRes.items);
        setNotifications(notifsRes.slice(0, 4));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCitizenData();
  }, []);

  const total = complaints.length;
  const pending = complaints.filter(c => c.status === 'SUBMITTED' || c.status === 'VERIFIED').length;
  const inProgress = complaints.filter(c => c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS').length;
  const resolved = complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CITIZEN_VERIFIED').length;

  return (
    <div className="space-y-8">
      {/* KPI Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Submitted By You</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">{total}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Awaiting Review</span>
          <div className="text-3xl font-extrabold text-blue-700 mt-1">{pending}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">In Progress</span>
          <div className="text-3xl font-extrabold text-amber-700 mt-1">{inProgress}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Resolved</span>
          <div className="text-3xl font-extrabold text-emerald-700 mt-1">{resolved}</div>
        </div>
      </div>

      {/* Map of citizen's reports & recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map */}
        <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-600" />
              <span>Your Reported Incident Locations</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">{complaints.length} plotted</span>
          </div>

          {complaints.length > 0 ? (
            <ComplaintsMap complaints={complaints} height="320px" zoom={13} />
          ) : (
            <div className="h-64 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
              <MapPin className="w-8 h-8 mb-2 text-slate-300" />
              <p>You haven't reported any civic problems yet.</p>
              <Link to="/report" className="mt-3">
                <Button variant="primary" size="sm">File First Report</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Notifications preview */}
        <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-teal-600" />
                <span>Recent Updates</span>
              </h3>
              <Link to="/citizen/notifications" className="text-xs text-teal-600 font-bold hover:text-teal-800">
                View all
              </Link>
            </div>

            <div className="space-y-2.5">
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No recent activity.</p>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <span className="font-bold text-slate-900 block">{n.title}</span>
                    <p className="text-slate-600 line-clamp-2">{n.message}</p>
                    <span className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Link to="/report">
              <Button variant="primary" size="md" className="w-full" icon={<PlusCircle className="w-4 h-4" />}>
                Report Another Issue
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Personal Complaints */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Your Active Complaint Records</h3>
          <Link to="/citizen/my-complaints" className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1">
            <span>Manage All Reports</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {complaints.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
            <p className="text-xs text-slate-500">You have not submitted any complaints yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complaints.slice(0, 3).map(c => (
              <ComplaintCard key={c.id} complaint={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
