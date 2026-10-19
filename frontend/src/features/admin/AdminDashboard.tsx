import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { AnalyticsOverview, User, AuditLog, Department } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { AnalyticsCharts } from '../../components/charts/AnalyticsCharts';
import { Button } from '../../components/common/Button';
import { 
  Users, Building2, ShieldAlert, Sliders, ListChecks, 
  CheckCircle2, AlertTriangle, ArrowRight, Activity, Clock
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminOverview = async () => {
      try {
        const [analyticsRes, usersRes, deptsRes, logsRes] = await Promise.all([
          api.getAnalytics(),
          api.getUsers(),
          api.getDepartments(),
          api.getAuditLogs({ limit: 5 })
        ]);
        setAnalytics(analyticsRes);
        setUsersList(usersRes);
        setDepartments(deptsRes);
        setRecentLogs(logsRes);
      } catch (err) {
        console.error('Failed to load admin overview:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminOverview();
  }, []);

  const totalUsers = usersList.length;
  const officersCount = usersList.filter(u => u.role === 'OFFICER').length;
  const citizensCount = usersList.filter(u => u.role === 'CITIZEN').length;
  const metrics = analytics?.metrics;
  const resolvedCount = (metrics?.resolved || 0) + (metrics?.citizen_verified || 0);
  const resolutionRate = metrics?.total_complaints ? Math.round((resolvedCount / metrics.total_complaints) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Top Banner / System Health */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            CivicLens Central Administration
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Municipal Command & Control Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Real-time management of municipal departments, citizen complaints, officer authorizations, and AI audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/admin/users">
            <Button variant="secondary" size="sm" icon={<Users className="w-4 h-4" />}>
              Users ({totalUsers})
            </Button>
          </Link>
          <Link to="/admin/departments">
            <Button variant="outline" size="sm" className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700" icon={<Building2 className="w-4 h-4" />}>
              Departments ({departments.length})
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Operational Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Complaints */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Platform Complaints
          </span>
          <div className="text-3xl font-extrabold text-slate-900">
            {metrics?.total_complaints ?? 0}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Across {departments.length} departments
          </span>
        </div>

        {/* Resolution Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
            Overall Resolution
          </span>
          <div className="text-3xl font-extrabold text-emerald-700">
            {resolutionRate}%
          </div>
          <span className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {resolvedCount} resolved
          </span>
        </div>

        {/* Registered Users */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
            Active Accounts
          </span>
          <div className="text-3xl font-extrabold text-blue-700">
            {totalUsers}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {officersCount} Officers, {citizensCount} Citizens
          </span>
        </div>

        {/* Overdue SLA Breaches */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block mb-1">
            SLA Escalations
          </span>
          <div className="text-3xl font-extrabold text-rose-700">
            {metrics?.overdue_count ?? 0}
          </div>
          <span className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            Breached target SLA
          </span>
        </div>
      </div>

      {/* Quick Admin Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/users"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-sm transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
            User & Role Management
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Promote citizens to officers, assign department jurisdictions, and activate/suspend accounts.
          </p>
          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-teal-600">
            <span>Manage users</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/admin/departments"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-sm transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
            Departments & SLAs
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Configure municipal departments, default turnaround targets (hours), and contact points.
          </p>
          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-600">
            <span>Configure SLAs</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/admin/complaints"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-sm transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <ListChecks className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
            Master Complaints Ledger
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Audit and filter all citizen submissions across every ward and department.
          </p>
          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <span>View all issues</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/admin/audit-logs"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-sm transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
            System Audit Trail
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Immutable log of role changes, overrides, rejections, and administrative security events.
          </p>
          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-purple-600">
            <span>View audit logs</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Analytics Visuals */}
      {analytics && (
        <AnalyticsCharts
          categories={analytics.categories}
          severities={analytics.severities}
          statuses={analytics.statuses}
          monthlyTrends={analytics.monthly_trends}
        />
      )}

      {/* Recent Audit Events Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Recent Security & Governance Actions</h3>
          </div>
          <Link to="/admin/audit-logs" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
            <span>Full Audit Trail</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recentLogs.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">No recent audit events recorded.</p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {recentLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="text-slate-500 font-medium">{log.entity_type}</span>
                    {log.entity_id && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        #{log.entity_id.slice(0, 8)}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 mt-1">
                    Actor: <span className="font-semibold text-slate-800">{log.actor_name || 'System'}</span>
                  </p>
                </div>
                <div className="text-[11px] text-slate-400 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
