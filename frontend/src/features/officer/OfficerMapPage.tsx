import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Complaint, Department, Ward } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ComplaintsMap } from '../../components/maps/ComplaintsMap';
import { StatusBadge, SeverityBadge, CategoryBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { 
  MapPin, Filter, RefreshCw, ExternalLink, AlertTriangle, 
  Clock, ShieldAlert, CheckCircle2, ChevronRight, Eye
} from 'lucide-react';

export const OfficerMapPage: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>(user?.department_id || '');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [selectedWard, setSelectedWard] = useState<string>('');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const fetchMapData = async () => {
    setLoading(true);
    try {
      const [deptRes, wardRes, complaintsRes] = await Promise.all([
        api.getDepartments(),
        api.getWards(),
        api.listComplaints({
          page: 1,
          page_size: 100,
          department_id: selectedDept || undefined,
          status: selectedStatus || undefined,
          severity: selectedSeverity || undefined,
          ward_id: selectedWard || undefined,
        })
      ]);
      setDepartments(deptRes);
      setWards(wardRes);
      setComplaints(complaintsRes.items);
      
      // If selectedComplaint is no longer in complaints, update or keep
      if (selectedComplaint) {
        const updated = complaintsRes.items.find(c => c.id === selectedComplaint.id);
        if (updated) setSelectedComplaint(updated);
      }
    } catch (err) {
      console.error('Failed to load operational map data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, [selectedDept, selectedStatus, selectedSeverity, selectedWard]);

  // Compute map center from complaints or fallback to demo center
  const mapCenter = useMemo<[number, number]>(() => {
    if (selectedComplaint) {
      return [selectedComplaint.latitude, selectedComplaint.longitude];
    }
    if (complaints.length > 0) {
      const valid = complaints.filter(c => c.latitude && c.longitude);
      if (valid.length > 0) {
        const avgLat = valid.reduce((acc, c) => acc + c.latitude, 0) / valid.length;
        const avgLng = valid.reduce((acc, c) => acc + c.longitude, 0) / valid.length;
        return [avgLat, avgLng];
      }
    }
    return [18.5204, 73.8567]; // Pune Metro default
  }, [selectedComplaint, complaints]);

  const criticalCount = complaints.filter(c => c.severity === 'CRITICAL').length;
  const overdueCount = complaints.filter(c => c.is_overdue).length;

  return (
    <div className="space-y-6">
      {/* Top Filter and Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">Municipal GIS Operations Map</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {complaints.length} Incidents Plotted
            </span>
          </div>

          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                {criticalCount} Critical
              </span>
            )}
            {overdueCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                {overdueCount} Overdue
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
              onClick={fetchMapData}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Filter Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              aria-label="Filter by department"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by status"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Lifecycle Stages</option>
              <option value="SUBMITTED">Submitted (New)</option>
              <option value="VERIFIED">Verified</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CITIZEN_VERIFIED">Citizen Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Severity
            </label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              aria-label="Filter by severity"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical (Danger / Emergency)</option>
              <option value="HIGH">High Severity</option>
              <option value="MEDIUM">Medium Severity</option>
              <option value="LOW">Low Severity</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Ward / Zone
            </label>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              aria-label="Filter by ward"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Wards</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.ward_number ? `(Ward #${w.ward_number})` : `(${w.code})`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Map + Selected Incident Drawer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ComplaintsMap
            complaints={complaints}
            center={mapCenter}
            zoom={selectedComplaint ? 15 : 12}
            height="620px"
            onSelectComplaint={(c) => setSelectedComplaint(c)}
            selectedId={selectedComplaint?.id}
          />
        </div>

        {/* Selected Complaint Detail Panel */}
        <div className="lg:col-span-1">
          {selectedComplaint ? (
            <div className="bg-white rounded-2xl border border-teal-200 shadow-md p-5 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-[11px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {selectedComplaint.reference_number}
                </span>
                <StatusBadge status={selectedComplaint.status} size="sm" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                  {selectedComplaint.title}
                </h3>
                <p className="text-xs text-slate-600 mt-2 line-clamp-3">
                  {selectedComplaint.description}
                </p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 pt-1">
                <CategoryBadge category={selectedComplaint.category} size="sm" />
                <SeverityBadge severity={selectedComplaint.severity} size="sm" />
              </div>

              {/* Photo Evidence Preview */}
              {(() => {
                const evidenceList = selectedComplaint.evidence_items || selectedComplaint.evidence || [];
                if (evidenceList.length === 0) return null;
                return (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Filed Photo Evidence
                    </span>
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img
                        src={`/uploads/${evidenceList[0].storage_key}`}
                        alt={selectedComplaint.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Location & Ward */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-start gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{selectedComplaint.address}</span>
                </div>
                {selectedComplaint.ward_name && (
                  <div className="text-[11px] text-slate-500 pl-6">
                    Ward: <span className="font-semibold text-slate-700">{selectedComplaint.ward_name}</span>
                  </div>
                )}
                {selectedComplaint.department_name && (
                  <div className="text-[11px] text-slate-500 pl-6">
                    Dept: <span className="font-semibold text-slate-700">{selectedComplaint.department_name}</span>
                  </div>
                )}
              </div>

              {/* SLA Target / Status */}
              {selectedComplaint.sla_target_at && (
                <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  selectedComplaint.is_overdue
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <span className="font-medium">SLA Deadline:</span>
                  <span className="font-bold">
                    {new Date(selectedComplaint.sla_target_at).toLocaleDateString()}
                    {selectedComplaint.is_overdue && ' (OVERDUE)'}
                  </span>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-3">
                <Link to={`/officer/complaints/${selectedComplaint.id}`} className="block">
                  <Button variant="primary" size="md" className="w-full" icon={<ExternalLink className="w-4 h-4" />}>
                    Open Incident Desk
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 h-[380px] flex flex-col items-center justify-center">
              <MapPin className="w-10 h-10 text-slate-300 mb-3 animate-pulse" />
              <h4 className="text-sm font-bold text-slate-700">No Incident Selected</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                Click any marker on the map to inspect complaint details, SLA countdown, and resolution actions.
              </p>
            </div>
          )}

          {/* Quick Legend */}
          <div className="mt-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs text-xs space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Marker Legend
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ea580c]" /> Pothole
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#16a34a]" /> Garbage
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ca8a04]" /> Streetlight
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#0284c7]" /> Drainage
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#dc2626]" /> Road Damage
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#9333ea]" /> Damaged Sign
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] text-rose-700 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping inline-block" />
              Pulsing halo indicates CRITICAL severity
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
