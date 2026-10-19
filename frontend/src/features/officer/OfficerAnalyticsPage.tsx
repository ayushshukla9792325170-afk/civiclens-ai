import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AnalyticsOverview, Department } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { AnalyticsCharts } from '../../components/charts/AnalyticsCharts';
import { Button } from '../../components/common/Button';
import { 
  BarChart3, Clock, AlertTriangle, CheckCircle2, 
  Building2, ArrowDownRight, ArrowUpRight, Download, RefreshCw
} from 'lucide-react';

export const OfficerAnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>(user?.department_id || '');
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [deptRes, analyticsRes] = await Promise.all([
        api.getDepartments(),
        api.getAnalytics(selectedDept || undefined)
      ]);
      setDepartments(deptRes);
      setAnalytics(analyticsRes);
    } catch (err) {
      console.error('Failed to load officer analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedDept]);

  const metrics = analytics?.metrics;

  return (
    <div className="space-y-8">
      {/* Header and Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">Department Operational Intelligence & SLAs</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time municipal performance metrics, resolution velocity, and SLA adherence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="min-w-[200px]">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Select Department Scope
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              aria-label="Select department scope"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Municipal Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
              onClick={fetchAnalyticsData}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total Intake
          </span>
          <div className="text-3xl font-extrabold text-slate-900">
            {metrics?.total_complaints ?? 0}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Logged civic issues</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
            Resolution Rate
          </span>
          <div className="text-3xl font-extrabold text-emerald-700">
            {metrics?.total_complaints ? Math.round((((metrics.resolved || 0) + (metrics.citizen_verified || 0)) / metrics.total_complaints) * 100) : 0}%
          </div>
          <span className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {(metrics?.resolved || 0) + (metrics?.citizen_verified || 0)} tickets closed
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
            Avg Turnaround Time
          </span>
          <div className="text-3xl font-extrabold text-blue-700">
            {metrics?.avg_resolution_hours ? `${metrics.avg_resolution_hours}h` : 'N/A'}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Target SLA: 48h to 72h
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block mb-1">
            SLA Overdue Breaches
          </span>
          <div className="text-3xl font-extrabold text-rose-700">
            {metrics?.overdue_count ?? 0}
          </div>
          <span className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            Requires escalation
          </span>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      {analytics && (
        <AnalyticsCharts
          categories={analytics.categories}
          severities={analytics.severities}
          statuses={analytics.statuses}
          monthlyTrends={analytics.monthly_trends}
        />
      )}

      {/* Incident Hotspots Table */}
      {analytics?.hotspots && analytics.hotspots.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Spatial Hotspots & High-Density Incident Points</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Geographic coordinates with elevated civic infrastructure complaint frequency.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {analytics.hotspots.length} Hotspots Identified
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">Reference</th>
                  <th className="py-3 px-5">Incident Title</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Coordinates</th>
                  <th className="py-3 px-5">Priority Density</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {analytics.hotspots.map((h, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-5 font-mono font-bold text-teal-800">{h.reference_number}</td>
                    <td className="py-3.5 px-5 font-bold text-slate-900">{h.title}</td>
                    <td className="py-3.5 px-5 capitalize">{h.category.toLowerCase().replace(/_/g, ' ')}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-500">{h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}</td>
                    <td className="py-3.5 px-5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        Weight: {h.weight}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
