import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Complaint, IssueCategory, IssueSeverity, ComplaintStatus } from '../../types';
import { ComplaintsMap } from '../../components/maps/ComplaintsMap';
import { ComplaintCard } from '../../components/complaints/ComplaintCard';
import { Button } from '../../components/common/Button';
import { MapPin, Filter, RotateCcw, X, Layers } from 'lucide-react';

export const PublicMapPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Filters
  const [category, setCategory] = useState<string>('');
  const [severity, setSeverity] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  const fetchMapComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.listPublicComplaints({
        page: 1,
        page_size: 100,
        category: category || undefined,
        status: status || undefined,
      });
      let items = res.items;
      if (severity) {
        items = items.filter(c => c.severity === severity);
      }
      setComplaints(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapComplaints();
  }, [category, severity, status]);

  const handleReset = () => {
    setCategory('');
    setSeverity('');
    setStatus('');
    setSelectedComplaint(null);
  };

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] flex flex-col">
      {/* Top Filter Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-600" />
            <h1 className="text-base font-bold text-slate-900">Live Public Incident Map</h1>
            <span className="text-xs text-slate-500 font-mono">({complaints.length} plotted)</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Category Select */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="p-2 rounded-lg border border-slate-300 bg-white focus:ring-teal-500"
            >
              <option value="">All Categories</option>
              <option value="POTHOLE">Potholes</option>
              <option value="GARBAGE">Garbage</option>
              <option value="STREETLIGHT">Streetlights</option>
              <option value="DRAINAGE">Drainage</option>
              <option value="ROAD_DAMAGE">Road Damage</option>
              <option value="DAMAGED_SIGN">Damaged Signs</option>
              <option value="WATER_LEAKAGE">Water Leaks</option>
              <option value="ILLEGAL_DUMPING">Illegal Dumping</option>
            </select>

            {/* Severity Select */}
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="p-2 rounded-lg border border-slate-300 bg-white focus:ring-teal-500"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical Hazards</option>
              <option value="HIGH">High Severity</option>
              <option value="MEDIUM">Medium Severity</option>
              <option value="LOW">Low Severity</option>
            </select>

            {/* Status Select */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="p-2 rounded-lg border border-slate-300 bg-white focus:ring-teal-500"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CITIZEN_VERIFIED">Citizen Verified</option>
            </select>

            {(category || severity || status) && (
              <Button variant="ghost" size="sm" onClick={handleReset} icon={<RotateCcw className="w-3.5 h-3.5" />}>
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Map Area */}
      <div className="flex-1 relative z-0">
        <ComplaintsMap
          complaints={complaints}
          height="calc(100vh - 8rem)"
          zoom={13}
          onSelectComplaint={(c) => setSelectedComplaint(c)}
          selectedId={selectedComplaint?.id}
        />

        {/* Floating Selected Complaint Drawer on Mobile/Desktop */}
        {selectedComplaint && (
          <div className="absolute bottom-6 left-6 right-6 sm:right-auto sm:w-96 z-20 shadow-2xl">
            <div className="relative">
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="absolute -top-3 -right-3 p-1.5 bg-slate-900 text-white rounded-full hover:bg-slate-700 z-30 shadow"
                aria-label="Close complaint popup"
              >
                <X className="w-4 h-4" />
              </button>
              <ComplaintCard complaint={selectedComplaint} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
