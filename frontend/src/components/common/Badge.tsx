import React from 'react';
import { ComplaintStatus, IssueSeverity, IssueCategory } from '../../types';
import { 
  AlertTriangle, CheckCircle2, Clock, AlertCircle, 
  RotateCcw, XCircle, ArrowUpRight, Flame
} from 'lucide-react';

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const configs: Record<ComplaintStatus, { label: string; bg: string; text: string; icon: any; border: string }> = {
    SUBMITTED: {
      label: 'Submitted',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: Clock,
    },
    VERIFIED: {
      label: 'Verified',
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      icon: CheckCircle2,
    },
    ASSIGNED: {
      label: 'Assigned',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      icon: ArrowUpRight,
    },
    IN_PROGRESS: {
      label: 'In Progress',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      icon: AlertCircle,
    },
    RESOLVED: {
      label: 'Resolved',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: CheckCircle2,
    },
    CITIZEN_VERIFIED: {
      label: 'Citizen Verified',
      bg: 'bg-teal-50',
      text: 'text-teal-800',
      border: 'border-teal-300',
      icon: CheckCircle2,
    },
    REJECTED: {
      label: 'Rejected',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      icon: XCircle,
    },
    REOPENED: {
      label: 'Reopened',
      bg: 'bg-orange-50',
      text: 'text-orange-800',
      border: 'border-orange-200',
      icon: RotateCcw,
    },
  };

  const config = configs[status] || configs.SUBMITTED;
  const Icon = config.icon;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.text} ${config.border} ${padding}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};

interface SeverityBadgeProps {
  severity: IssueSeverity;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const configs: Record<IssueSeverity, { label: string; bg: string; text: string; border: string; icon?: any }> = {
    LOW: {
      label: 'Low Severity',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
    },
    MEDIUM: {
      label: 'Medium Severity',
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-200',
    },
    HIGH: {
      label: 'High Severity',
      bg: 'bg-amber-100',
      text: 'text-amber-900',
      border: 'border-amber-300',
      icon: AlertTriangle,
    },
    CRITICAL: {
      label: 'CRITICAL HAZARD',
      bg: 'bg-rose-100',
      text: 'text-rose-900',
      border: 'border-rose-300',
      icon: Flame,
    },
  };

  const config = configs[severity] || configs.MEDIUM;
  const Icon = config.icon;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-bold';

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border ${config.bg} ${config.text} ${config.border} ${padding}`}>
      {Icon && <Icon className="w-3.5 h-3.5" aria-hidden="true" />}
      <span>{config.label}</span>
    </span>
  );
};

interface CategoryBadgeProps {
  category: IssueCategory | string;
  size?: 'sm' | 'md';
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, size = 'md', className = '' }) => {
  const readable = category.replace(/_/g, ' ').toLowerCase();
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center rounded font-medium bg-slate-100 text-slate-700 capitalize border border-slate-200 ${padding} ${className}`}>
      {readable}
    </span>
  );
};
