import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  Complaint, Department, User, DuplicateCandidate,
  ComplaintStatus, IssueCategory, IssueSeverity 
} from '../../types';
import { StatusBadge, SeverityBadge, CategoryBadge } from '../../components/common/Badge';
import { StatusTimeline } from '../../components/complaints/StatusTimeline';
import { EvidenceViewer } from '../../components/complaints/EvidenceViewer';
import { ComplaintsMap } from '../../components/maps/ComplaintsMap';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, Building2, User as UserIcon, Calendar, MapPin, 
  Sparkles, CheckCircle2, AlertTriangle, ShieldAlert, Sliders,
  Upload, CopyCheck, FileText, Send, X, ArrowUpRight, Check
} from 'lucide-react';

export const OfficerComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [officers, setOfficers] = useState<User[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  // Status transition state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<ComplaintStatus>('IN_PROGRESS');
  const [statusComment, setStatusComment] = useState('');
  const [statusInternalNote, setStatusInternalNote] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [resolutionProofKey, setResolutionProofKey] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Assignment state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // AI Override state
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideCategory, setOverrideCategory] = useState<string>('');
  const [overrideSeverity, setOverrideSeverity] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState('');
  const [isOverriding, setIsOverriding] = useState(false);

  // Duplicate Review modal state
  const [dupModalOpen, setDupModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<DuplicateCandidate | null>(null);
  const [dupStatus, setDupStatus] = useState<'CONFIRMED_DUPLICATE' | 'DISMISSED'>('CONFIRMED_DUPLICATE');
  const [dupReason, setDupReason] = useState('');
  const [isReviewingDup, setIsReviewingDup] = useState(false);

  const proofFileRef = useRef<HTMLInputElement>(null);

  const fetchAllData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [compData, deptsData, dupsData, usersData] = await Promise.all([
        api.getComplaint(id),
        api.getDepartments(),
        api.getDuplicates(id),
        api.getUsers({ role: 'OFFICER' })
      ]);
      setComplaint(compData);
      setDepartments(deptsData);
      setDuplicates(dupsData);
      setOfficers(usersData);

      setSelectedDeptId(compData.department_id || '');
      setSelectedOfficerId(compData.assigned_officer_id || '');
      setOverrideCategory(compData.category);
      setOverrideSeverity(compData.severity);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [id]);

  // Handle proof upload
  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingProof(true);
    try {
      const res = await api.uploadEvidence(file);
      setResolutionProofKey(res.storage_key);
    } catch (err: any) {
      alert(err.message || 'Failed to upload proof.');
    } finally {
      setIsUploadingProof(false);
    }
  };

  // Submit Status Transition
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (['REJECTED', 'REOPENED'].includes(targetStatus) && !statusReason.trim()) {
      alert('A mandatory justification reason must be specified for rejection or reopening.');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await api.updateStatus(id, {
        new_status: targetStatus,
        public_comment: statusComment.trim() || undefined,
        internal_note: statusInternalNote.trim() || undefined,
        reason: statusReason.trim() || undefined,
        resolution_proof_keys: resolutionProofKey ? [resolutionProofKey] : undefined,
      });
      setStatusModalOpen(false);
      setStatusComment('');
      setStatusInternalNote('');
      setStatusReason('');
      setResolutionProofKey(null);
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Status transition failed.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Submit Assignment
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsAssigning(true);
    try {
      await api.assignComplaint(id, {
        department_id: selectedDeptId || undefined,
        assigned_officer_id: selectedOfficerId || undefined,
        notes: assignNotes.trim() || undefined,
      });
      setAssignModalOpen(false);
      setAssignNotes('');
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Assignment failed.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Submit AI Recommendation Override
  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !overrideReason.trim()) {
      alert('Please provide a mandatory explanation for overriding AI recommendations.');
      return;
    }
    setIsOverriding(true);
    try {
      await api.overrideComplaint(id, {
        category: overrideCategory || undefined,
        severity: overrideSeverity || undefined,
        reason: overrideReason.trim(),
      });
      setOverrideModalOpen(false);
      setOverrideReason('');
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Override failed.');
    } finally {
      setIsOverriding(false);
    }
  };

  // Submit Duplicate Review
  const handleDuplicateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate || !dupReason.trim()) {
      alert('Please provide a review reason.');
      return;
    }
    setIsReviewingDup(true);
    try {
      await api.reviewDuplicate(selectedCandidate.id, dupStatus, dupReason.trim());
      setDupModalOpen(false);
      setSelectedCandidate(null);
      setDupReason('');
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Duplicate review failed.');
    } finally {
      setIsReviewingDup(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500">Loading operational record...</p>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <h3 className="text-base font-bold text-slate-900">Complaint Not Found</h3>
        <Link to="/officer/complaints" className="mt-3 inline-block">
          <Button variant="outline" size="sm">Back to Queue</Button>
        </Link>
      </div>
    );
  }

  // Determine allowed next statuses
  const allowedTransitions: Record<string, ComplaintStatus[]> = {
    SUBMITTED: ['VERIFIED', 'ASSIGNED', 'REJECTED'],
    VERIFIED: ['ASSIGNED', 'IN_PROGRESS', 'REJECTED'],
    ASSIGNED: ['IN_PROGRESS', 'RESOLVED', 'REJECTED'],
    IN_PROGRESS: ['RESOLVED', 'REJECTED'],
    RESOLVED: ['REOPENED'],
    REOPENED: ['IN_PROGRESS', 'ASSIGNED', 'REJECTED'],
    REJECTED: ['REOPENED'],
    CITIZEN_VERIFIED: ['REOPENED'],
  };
  const availableNextStates = allowedTransitions[complaint.status] || [];

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <Link
            to="/officer/complaints"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Queue</span>
          </Link>

          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
              {complaint.reference_number}
            </span>
            <StatusBadge status={complaint.status} />
            <SeverityBadge severity={complaint.severity} size="sm" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900">{complaint.title}</h2>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {availableNextStates.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setTargetStatus(availableNextStates[0]);
                setStatusModalOpen(true);
              }}
              icon={<ArrowUpRight className="w-4 h-4" />}
            >
              Advance Status
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setAssignModalOpen(true)}
            icon={<Building2 className="w-4 h-4 text-teal-600" />}
          >
            Assign / Reassign
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setOverrideModalOpen(true)}
            icon={<Sliders className="w-4 h-4 text-slate-500" />}
          >
            Override AI
          </Button>
        </div>
      </div>

      {/* Main Operational Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Details, AI Audit, Evidence */}
        <div className="lg:col-span-7 space-y-6">
          {/* Detailed Info Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Citizen Incident Narrative
              </span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {complaint.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Assigned Department</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  {complaint.department_name || 'Unassigned'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Assigned Officer</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <UserIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  {complaint.assigned_officer_name || 'Pending Officer Assignment'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Exact Address</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  {complaint.address}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Submission Timestamp</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  {new Date(complaint.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* AI Intelligence Assessment */}
          <div className="bg-teal-50/50 p-6 rounded-3xl border border-teal-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                AI Triage & Risk Justification
              </span>
              <span className="text-[11px] font-mono font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                Confidence: {(complaint.ai_confidence * 100).toFixed(0)}% ({complaint.ai_analysis_mode})
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed italic">
              "{complaint.severity_explanation || 'Assessed through standard algorithmic triage rules.'}"
            </p>
          </div>

          {/* Photographic Evidence Gallery */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <EvidenceViewer evidenceItems={complaint.evidence_items || []} />
          </div>

          {/* Duplicate Candidates Panel */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CopyCheck className="w-4 h-4 text-amber-600" />
                <span>Nearby Duplicate Candidates ({duplicates.length})</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">150m spatial radius</span>
            </div>

            {duplicates.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No duplicate complaint candidates detected nearby.</p>
            ) : (
              <div className="space-y-3">
                {duplicates.map((dup) => (
                  <div key={dup.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">{dup.candidate_reference}</span>
                        <CategoryBadge category={dup.candidate_category} />
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
                          {dup.status}
                        </span>
                      </div>
                      <div className="text-slate-700 font-medium">{dup.candidate_title}</div>
                      <div className="text-slate-400 text-[11px]">
                        Distance: <span className="font-bold text-amber-700">{dup.distance_meters.toFixed(1)}m</span> | Similarity: {(dup.similarity_score * 100).toFixed(0)}%
                      </div>
                      {dup.review_reason && (
                        <div className="text-slate-500 italic text-[11px]">
                          Officer Note: "{dup.review_reason}"
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCandidate(dup);
                          setDupStatus('CONFIRMED_DUPLICATE');
                          setDupModalOpen(true);
                        }}
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Map & Immutable Status Timeline */}
        <div className="lg:col-span-5 space-y-6">
          {/* Map */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-2">
              Geospatial Coordinates
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

          {/* Timeline */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <StatusTimeline
              currentStatus={complaint.status}
              updates={complaint.updates || []}
            />
          </div>
        </div>
      </div>

      {/* ================= MODAL: ADVANCE STATUS ================= */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={`Advance Lifecycle Status #${complaint.reference_number}`}
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Target Lifecycle Status *
            </label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as ComplaintStatus)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white focus:ring-teal-500"
            >
              {availableNextStates.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {['REJECTED', 'REOPENED'].includes(targetStatus) && (
            <div>
              <label htmlFor="status-reason-input" className="block text-xs font-bold text-rose-700 uppercase mb-1">
                Mandatory Explanation / Justification *
              </label>
              <textarea
                id="status-reason-input"
                rows={2}
                required
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Explain why this complaint is being rejected or reopened..."
                className="w-full text-xs p-3 rounded-xl border border-rose-300 focus:ring-rose-500"
              />
            </div>
          )}

          <div>
            <label htmlFor="status-comment-input" className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Public Status Comment (Visible to Citizen)
            </label>
            <textarea
              id="status-comment-input"
              rows={2}
              value={statusComment}
              onChange={(e) => setStatusComment(e.target.value)}
              placeholder="e.g. Field team dispatched with asphalt roller..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-teal-500"
            />
          </div>

          <div>
            <label htmlFor="status-internal-note-input" className="block text-xs font-bold text-amber-800 uppercase mb-1">
              🔒 Internal Municipal Note (Restricted to Staff)
            </label>
            <textarea
              id="status-internal-note-input"
              rows={2}
              value={statusInternalNote}
              onChange={(e) => setStatusInternalNote(e.target.value)}
              placeholder="Private contractor dispatch details, crew shift notes..."
              className="w-full text-xs p-3 rounded-xl border border-amber-200 bg-amber-50/30 focus:ring-amber-500"
            />
          </div>

          {targetStatus === 'RESOLVED' && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3">
              <span className="text-xs font-bold text-emerald-900 uppercase block">
                Attach Official Photographic Proof of Resolution
              </span>
              {resolutionProofKey ? (
                <div className="flex items-center gap-2 text-xs text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Resolution image attached</span>
                  <button
                    type="button"
                    onClick={() => setResolutionProofKey(null)}
                    className="ml-auto text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => proofFileRef.current?.click()}
                  isLoading={isUploadingProof}
                  icon={<Upload className="w-3.5 h-3.5" />}
                >
                  Upload Repair Photo
                </Button>
              )}
              <input
                ref={proofFileRef}
                type="file"
                accept="image/*"
                onChange={handleProofUpload}
                className="hidden"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isUpdatingStatus}>
              Confirm Transition
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: ASSIGN DEPARTMENT / OFFICER ================= */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Municipal Department / Officer"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Responsible Department
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white focus:ring-teal-500"
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Assign Field Officer
            </label>
            <select
              value={selectedOfficerId}
              onChange={(e) => setSelectedOfficerId(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white focus:ring-teal-500"
            >
              <option value="">Select Field Officer</option>
              {officers.map((o) => (
                <option key={o.id} value={o.id}>{o.name} ({o.email})</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="assign-notes-input" className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Work Order Notes / SLA Instructions
            </label>
            <textarea
              id="assign-notes-input"
              rows={3}
              value={assignNotes}
              onChange={(e) => setAssignNotes(e.target.value)}
              placeholder="Instructions for on-site field team..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isAssigning}>
              Save Assignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: OVERRIDE AI ================= */}
      <Modal
        isOpen={overrideModalOpen}
        onClose={() => setOverrideModalOpen(false)}
        title="Override AI Triage Recommendation"
      >
        <form onSubmit={handleOverrideSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Record a formal human override for the problem category or severity classification. The override reason is logged in the permanent audit trail.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Revise Category
              </label>
              <select
                value={overrideCategory}
                onChange={(e) => setOverrideCategory(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white focus:ring-teal-500"
              >
                <option value="POTHOLE">Pothole / Road Crater</option>
                <option value="GARBAGE">Overflowing Garbage</option>
                <option value="STREETLIGHT">Broken Streetlight</option>
                <option value="DRAINAGE">Open Drain / Sewer</option>
                <option value="ROAD_DAMAGE">Road & Divider Damage</option>
                <option value="DAMAGED_SIGN">Damaged Signage</option>
                <option value="WATER_LEAKAGE">Water Pipeline Leak</option>
                <option value="ILLEGAL_DUMPING">Illegal Dumping</option>
                <option value="OTHER">Other Issue</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Revise Severity
              </label>
              <select
                value={overrideSeverity}
                onChange={(e) => setOverrideSeverity(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white focus:ring-teal-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical Hazard</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="override-reason-input" className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Mandatory Override Justification *
            </label>
            <textarea
              id="override-reason-input"
              rows={3}
              required
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Field inspection confirmed the crater is over 8 inches deep on heavy transit bus lane..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOverrideModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isOverriding}>
              Record Override
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: DUPLICATE REVIEW ================= */}
      {selectedCandidate && (
        <Modal
          isOpen={dupModalOpen}
          onClose={() => setDupModalOpen(false)}
          title={`Review Duplicate Candidate #${selectedCandidate.candidate_reference}`}
        >
          <form onSubmit={handleDuplicateReview} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-900">{selectedCandidate.candidate_title}</span>
              <p className="text-slate-500">
                Spatial Proximity: <strong>{selectedCandidate.distance_meters.toFixed(1)}m</strong> | Calculated Similarity: <strong>{(selectedCandidate.similarity_score * 100).toFixed(0)}%</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Decision
              </label>
              <select
                value={dupStatus}
                onChange={(e) => setDupStatus(e.target.value as any)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white"
              >
                <option value="CONFIRMED_DUPLICATE">Confirm as Duplicate (Link to Cluster)</option>
                <option value="DISMISSED">Dismiss (Separate Defect at Nearby Location)</option>
              </select>
            </div>

            <div>
              <label htmlFor="dup-reason-input" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Review Reason *
              </label>
              <textarea
                id="dup-reason-input"
                rows={3}
                required
                value={dupReason}
                onChange={(e) => setDupReason(e.target.value)}
                placeholder="State why this is confirmed as the same incident or separate problem..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setDupModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isReviewingDup}>
                Save Decision
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
