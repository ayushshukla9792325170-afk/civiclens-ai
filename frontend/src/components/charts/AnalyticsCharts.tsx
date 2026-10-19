import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { CategoryCount, SeverityCount, StatusCount, MonthlyTrend } from '../../types';

interface AnalyticsChartsProps {
  categories: CategoryCount[];
  severities: SeverityCount[];
  statuses: StatusCount[];
  monthlyTrends: MonthlyTrend[];
}

const SEVERITY_COLORS: Record<string, string> = {
  LOW: '#64748b',       // Slate
  MEDIUM: '#3b82f6',    // Blue
  HIGH: '#f59e0b',      // Amber
  CRITICAL: '#ef4444',  // Red
};

const CATEGORY_COLORS = [
  '#0d9488', '#0284c7', '#ea580c', '#16a34a',
  '#ca8a04', '#9333ea', '#0891b2', '#475569', '#64748b'
];

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  categories,
  severities,
  statuses,
  monthlyTrends,
}) => {
  const formattedCategories = categories.map((c, i) => ({
    name: c.category.replace(/_/g, ' ').toLowerCase(),
    count: c.count,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
  }));

  const formattedSeverities = severities.map(s => ({
    name: s.severity,
    count: s.count,
    color: SEVERITY_COLORS[s.severity] || '#64748b'
  }));

  const formattedStatuses = statuses.map(s => ({
    name: s.status.replace(/_/g, ' ').toLowerCase(),
    count: s.count
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Monthly Submission vs Resolution Trend */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Submission vs. Resolution Velocity
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Tracking incoming citizen reports against municipal work closures.
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyTrends}>
              <defs>
                <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month_year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="submitted" stroke="#0d9488" fillOpacity={1} fill="url(#colorSub)" name="Submitted" />
              <Area type="monotone" dataKey="resolved" stroke="#10b981" fillOpacity={1} fill="url(#colorRes)" name="Resolved" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Issue Categories Distribution */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Issue Distribution by Category
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Breakdown of civic infrastructure damage across city sectors.
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedCategories} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={90} />
              <Tooltip />
              <Bar dataKey="count" fill="#0d9488" radius={[0, 4, 4, 0]}>
                {formattedCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Severity Risk Breakdown */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Severity & Hazard Priority
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Risk triage determined by AI evaluation and verified by municipal officers.
        </p>
        <div className="h-64 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={formattedSeverities}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="count"
                label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {formattedSeverities.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Municipal Operational Funnel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Workflow Pipeline Funnel
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Complaints progressing through lifecycle states from intake to verification.
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedStatuses} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={40} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#1e293b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
