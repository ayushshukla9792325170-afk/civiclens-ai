import React from 'react';
import { ComplaintStatus, ComplaintUpdate } from '../../types';
import { StatusBadge } from '../common/Badge';
import { 
  CheckCircle2, Clock, AlertCircle, ArrowUpRight, 
  RotateCcw, XCircle, ShieldCheck, User as UserIcon
} from 'lucide-react';

interface StatusTimelineProps {
  currentStatus: ComplaintStatus;
  updates?: ComplaintUpdate[];
}

const LIFECYCLE_STEPS: Array<{ key: ComplaintStatus; label: string; icon: any }> = [
  { key: 'SUBMITTED', label: 'Submitted', icon: Clock },
  { key: 'VERIFIED', label: 'Verified', icon: CheckCircle2 },
  { key: 'ASSIGNED', label: 'Assigned', icon: ArrowUpRight },
  { key: 'IN_PROGRESS', label: 'In Progress', icon: AlertCircle },
  { key: 'RESOLVED', label: 'Resolved', icon: ShieldCheck },
  { key: 'CITIZEN_VERIFIED', label: 'Verified by Citizen', icon: CheckCircle2 },
];

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  currentStatus,
  updates = [],
}) => {
  const isRejected = currentStatus === 'REJECTED';
  const isReopened = currentStatus === 'REOPENED';

  // Find step index in standard happy path
  const currentStepIndex = LIFECYCLE_STEPS.findIndex(s => s.key === currentStatus);

  return (
    <div className="space-y-6">
      {/* 1. Visual Lifecycle Stepper */}
      <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
          Lifecycle Progress Tracker
        </h4>

        {isRejected ? (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800">
            <XCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <div>
              <div className="font-bold text-sm">Complaint Formally Rejected</div>
              <div className="text-xs text-rose-700 mt-0.5">
                This complaint was reviewed and determined to be outside municipal jurisdiction or an invalid report.
              </div>
            </div>
          </div>
        ) : isReopened ? (
          <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3 text-orange-800">
            <RotateCcw className="w-5 h-5 flex-shrink-0 text-orange-600" />
            <div>
              <div className="font-bold text-sm">Complaint Reopened by Citizen</div>
              <div className="text-xs text-orange-700 mt-0.5">
                Citizen indicated the underlying infrastructure problem persists after initial closure. Queued for rework.
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {LIFECYCLE_STEPS.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;
                const Icon = step.icon;

                return (
                  <li
                    key={step.key}
                    className={`flex flex-col items-center text-center p-2.5 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-teal-50 border-teal-500 shadow-xs'
                        : isPassed
                        ? 'bg-white border-slate-200 text-slate-700'
                        : 'bg-slate-100/60 border-slate-200/50 text-slate-400'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center mb-1.5 ${
                        isCurrent
                          ? 'bg-teal-600 text-white ring-4 ring-teal-100'
                          : isPassed
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className={`text-[11px] leading-tight font-medium ${isCurrent ? 'font-bold text-teal-900' : ''}`}>
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>

      {/* 2. Audit Event Timeline */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Recorded Timeline Events ({updates.length})
        </h4>

        {updates.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No events recorded yet.</p>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {updates.map((u) => (
              <div key={u.id} className="relative group">
                {/* Dot */}
                <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-teal-600 group-hover:scale-125 transition-transform" />

                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={u.new_status as ComplaintStatus} size="sm" />
                      {u.previous_status && u.previous_status !== 'NONE' && (
                        <span className="text-xs text-slate-400">
                          (from {u.previous_status})
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(u.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {u.public_comment && (
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                      {u.public_comment}
                    </p>
                  )}

                  {u.internal_note && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200/80 rounded-md text-xs text-amber-900 font-mono">
                      <span className="font-bold">🔒 Internal Note:</span> {u.internal_note}
                    </div>
                  )}

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <UserIcon className="w-3 h-3 text-slate-400" />
                      {u.updated_by_name || 'System Auto-Processor'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
