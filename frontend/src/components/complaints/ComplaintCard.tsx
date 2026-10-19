import React from 'react';
import { Link } from 'react-router-dom';
import { Complaint } from '../../types';
import { StatusBadge, SeverityBadge, CategoryBadge } from '../common/Badge';
import { MapPin, Calendar, Building2, ChevronRight, ImageIcon } from 'lucide-react';

interface ComplaintCardProps {
  complaint: Complaint;
  baseLink?: string;
}

export const ComplaintCard: React.FC<ComplaintCardProps> = ({
  complaint,
  baseLink = '/complaints',
}) => {
  const evidenceList = complaint.evidence_items || complaint.evidence || [];
  const hasImage = evidenceList.length > 0;
  const primaryImage = hasImage ? evidenceList[0].storage_key : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group">
      <div>
        {/* Top Media or Placeholder Header */}
        {hasImage && primaryImage ? (
          <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
            <img
              src={primaryImage}
              alt={`Evidence for ${complaint.title}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold bg-slate-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded-md border border-white/20">
                {complaint.reference_number}
              </span>
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
              <CategoryBadge category={complaint.category} className="bg-white/90 text-slate-900 font-bold" />
              <SeverityBadge severity={complaint.severity} size="sm" />
            </div>
          </div>
        ) : (
          <div className="px-5 pt-5 pb-1 flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              {complaint.reference_number}
            </span>
            <div className="flex items-center gap-1.5">
              <CategoryBadge category={complaint.category} />
              <SeverityBadge severity={complaint.severity} size="sm" />
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <StatusBadge status={complaint.status} size="sm" />
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(complaint.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-teal-700 transition-colors">
            {complaint.title}
          </h3>

          <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
            {complaint.description}
          </p>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{complaint.address}</span>
            </div>
            {complaint.department_name && (
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate text-teal-700 font-medium">{complaint.department_name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {complaint.ai_analysis_mode === 'AI_GEMINI' ? '✨ Gemini AI verified' : '⚙️ Rule-based inspected'}
        </span>
        <Link
          to={`${baseLink}/${complaint.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded p-1"
          aria-label={`View details for complaint ${complaint.reference_number}`}
        >
          <span>View Details</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
