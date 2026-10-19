import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Complaint } from '../../types';
import { StatusBadge, SeverityBadge, CategoryBadge } from '../../components/common/Badge';
import { StatusTimeline } from '../../components/complaints/StatusTimeline';
import { EvidenceViewer } from '../../components/complaints/EvidenceViewer';
import { FeedbackModal } from '../../components/complaints/FeedbackModal';
import { ComplaintsMap } from '../../components/maps/ComplaintsMap';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, MapPin, Calendar, Building2, User as UserIcon, 
  Sparkles, CheckCircle2, RotateCcw, ShieldAlert, Star
} from 'lucide-react';

export const ComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [isReopening, setIsReopening] = useState(false);

  const fetchComplaint = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.getComplaint(id);
      setComplaint(data);
    } catch (err: any) {
      setError(err.message || 'Complaint not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !reopenReason.trim()) return;
    setIsReopening(true);
    try {
      await api.updateStatus(id, {
        new_status: 'REOPENED',
        reason: reopenReason.trim(),
        public_comment: 'Citizen reported that problem remains unresolved after municipal closure.'
      });
      setReopenModalOpen(false);
      setReopenReason('');
      fetchComplaint();
    } catch (err: any) {
      alert(err.message || 'Failed to reopen complaint.');
    } finally {
      setIsReopening(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500">Loading complaint history...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Complaint Not Found</h2>
        <p className="text-xs text-slate-600 mt-2">{error || 'The requested complaint does not exist.'}</p>
        <Link to="/complaints" className="mt-6 inline-block">
          <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
            Back to Complaints
          </Button>
        </Link>
      </div>
    );
  }

  const isOwner = user && user.id === complaint.user_id;
  const isOfficerOrAdmin = user && (user.role === 'OFFICER' || user.role === 'ADMIN');

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Back button and Header */}
      <div>
        <Link
          to="/complaints"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded p-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Complaints Directory</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-extrabold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                {complaint.reference_number}
              </span>
              <StatusBadge status={complaint.status} />
              <SeverityBadge severity={complaint.severity} size="sm" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {complaint.title}
            </h1>
          </div>

          {/* Citizen action buttons if resolved */}
          {isOwner && complaint.status === 'RESOLVED' && (
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => setFeedbackModalOpen(true)}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Verify & Rate Fix
              </Button>
              <Button
                variant="outline"
                size="md"
                className="text-orange-700 hover:bg-orange-50 border-orange-200"
                onClick={() => setReopenModalOpen(true)}
                icon={<RotateCcw className="w-4 h-4" />}
              >
                Reopen Ticket
              </Button>
            </div>
          )}

          {isOfficerOrAdmin && (
            <Link to={`/officer/complaints/${complaint.id}`}>
              <Button variant="secondary" size="md">
                Open in Officer Desk
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Grid: Details Left, Timeline & Map Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Details & Evidence */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Info Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Citizen Incident Description
              </span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {complaint.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Assigned Department</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  {complaint.department_name || 'Public Works Department (Pending)'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Reported By</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <UserIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  {complaint.reporter_name || 'Anonymous Citizen'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Location Address</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  {complaint.address}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Submission Date</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  {new Date(complaint.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* AI Diagnostic Rationale Card */}
          <div className="bg-teal-50/50 p-6 rounded-3xl border border-teal-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                AI Triage & Severity Justification
              </span>
              <span className="text-[11px] font-mono font-bold text-teal-700">
                {complaint.ai_analysis_mode === 'AI_GEMINI' ? '✨ Gemini AI' : '⚙️ Rule-Based Heuristic'}
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed italic">
              "{complaint.severity_explanation || 'Assessed through standard civic risk metrics.'}"
            </p>
          </div>

          {/* Evidence Gallery */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <EvidenceViewer evidenceItems={complaint.evidence_items || []} />
          </div>

          {/* Citizen Feedback Banner if existing */}
          {complaint.feedback && (
            <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Citizen Verified Satisfaction
                </span>
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(complaint.feedback.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
              </div>
              {complaint.feedback.comment && (
                <p className="text-xs text-emerald-900 italic">
                  "{complaint.feedback.comment}"
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Mini Map & Status Timeline */}
        <div className="lg:col-span-5 space-y-6">
          {/* Location Map */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-2">
              Geographical Location
            </span>
            <ComplaintsMap
              complaints={[complaint]}
              center={[complaint.latitude, complaint.longitude]}
              zoom={15}
              height="240px"
            />
            <div className="text-[11px] text-slate-500 font-mono text-center pt-1">
              Lat: {complaint.latitude.toFixed(5)}, Lng: {complaint.longitude.toFixed(5)}
            </div>
          </div>

          {/* Lifecycle & Status Updates */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <StatusTimeline
              currentStatus={complaint.status}
              updates={complaint.updates || []}
            />
          </div>
        </div>
      </div>

      {/* Citizen Feedback Modal */}
      {complaint && (
        <FeedbackModal
          complaintId={complaint.id}
          referenceNumber={complaint.reference_number}
          isOpen={feedbackModalOpen}
          onClose={() => setFeedbackModalOpen(false)}
          onSuccess={() => fetchComplaint()}
        />
      )}

      {/* Citizen Reopen Modal */}
      <Modal
        isOpen={reopenModalOpen}
        onClose={() => setReopenModalOpen(false)}
        title={`Reopen Ticket #${complaint.reference_number}`}
      >
        <form onSubmit={handleReopenSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Please provide a mandatory explanation for why this issue requires rework. This will be recorded on the official public timeline.
          </p>

          <div>
            <label htmlFor="reopen-reason" className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Explanation / Evidence of Persistence *
            </label>
            <textarea
              id="reopen-reason"
              rows={3}
              required
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="e.g. Tar was improperly leveled and collapsed again after rain..."
              className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500"
              maxLength={500}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setReopenModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" size="sm" isLoading={isReopening}>
              Confirm Reopen
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
