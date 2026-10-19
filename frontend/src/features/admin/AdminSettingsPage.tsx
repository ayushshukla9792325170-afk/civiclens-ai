import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { 
  Sliders, ShieldCheck, Cpu, Database, Save, 
  CheckCircle2, AlertTriangle, RefreshCw, Sparkles, Bell
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editable settings fields
  const [duplicateDistance, setDuplicateDistance] = useState(50);
  const [duplicateDays, setDuplicateDays] = useState(14);
  const [defaultSlaHours, setDefaultSlaHours] = useState(48);
  const [aiConfidenceThreshold, setAiConfidenceThreshold] = useState(0.75);
  const [requirePhotoVerification, setRequirePhotoVerification] = useState(true);

  // AI Status
  const [aiStatus, setAiStatus] = useState<{ mode: string; gemini_available: boolean } | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getSettings();
      setSettings(data);
      if (data.duplicate_distance_threshold_meters !== undefined) setDuplicateDistance(data.duplicate_distance_threshold_meters);
      else if (data.duplicate_distance_meters !== undefined) setDuplicateDistance(data.duplicate_distance_meters);
      if (data.duplicate_window_days !== undefined) setDuplicateDays(data.duplicate_window_days);
      if (data.default_sla_hours !== undefined) setDefaultSlaHours(data.default_sla_hours);
      if (data.ai_confidence_threshold !== undefined) setAiConfidenceThreshold(data.ai_confidence_threshold);
      if (data.require_resolution_proof !== undefined) setRequirePhotoVerification(data.require_resolution_proof);
      
      // Check AI status
      const testRes = await api.analyzeCivicReport({ text_content: 'health check' });
      setAiStatus({
        mode: testRes.analysis_mode,
        gemini_available: testRes.analysis_mode === 'AI_GEMINI'
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load system settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const saveSingleSetting = async (key: string, value: any) => {
    setSavingKey(key);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await api.updateSetting(key, value);
      setSuccessMsg(`Setting "${key}" saved successfully.`);
      await fetchSettings();
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to update ${key}.`);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700 font-bold">×</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700 font-bold">×</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">Municipal Platform & Engine Settings</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure deduplication algorithms, AI routing thresholds, and resolution compliance parameters.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          onClick={fetchSettings}
        >
          Refresh
        </Button>
      </div>

      {/* AI Engine Status Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-sm font-bold text-slate-900">Multimodal AI Engine Status</h3>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded ml-auto uppercase bg-slate-100 text-slate-700">
            {aiStatus?.mode || 'DETECTING'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block">Current Operating Mode</span>
            <p className="text-slate-600 leading-relaxed">
              {aiStatus?.gemini_available ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Gemini Multimodal Live API (Active)
                </span>
              ) : (
                <span className="text-amber-800 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Deterministic Rule-Based Engine (Fallback)
                </span>
              )}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {aiStatus?.gemini_available
                ? 'High-precision computer vision and Gemini LLM text classification enabled.'
                : 'Server-side keyword heuristic engine active. High-fidelity categorization without external cloud quota.'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block">AI Governance & Transparency</span>
            <p className="text-slate-600 leading-relaxed">
              All AI outputs (categories, severity estimations, and duplicate scores) are non-binding recommendations.
              Municipal officers retain full human-in-the-loop override authority with audit-logged justifications.
            </p>
          </div>
        </div>
      </div>

      {/* Spatial Deduplication Settings */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Database className="w-5 h-5 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-900">Spatial & Temporal Deduplication Engine</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Cluster Distance Radius (Meters)
            </label>
            <p className="text-slate-500 mb-2 text-[11px]">
              Complaints within this radial distance with similar categories will trigger duplicate detection.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={5}
                max={500}
                value={duplicateDistance}
                onChange={(e) => setDuplicateDistance(Number(e.target.value))}
                className="w-32 bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-slate-600 font-medium">meters</span>
              <Button
                variant="outline"
                size="sm"
                loading={savingKey === 'duplicate_distance_threshold_meters'}
                onClick={() => saveSingleSetting('duplicate_distance_threshold_meters', duplicateDistance)}
                icon={<Save className="w-3.5 h-3.5" />}
              >
                Save
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Time Window For Duplicate Clustering (Days)
            </label>
            <p className="text-slate-500 mb-2 text-[11px]">
              How many days in the past the duplicate detector scans for matching unresolved issues.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={90}
                value={duplicateDays}
                onChange={(e) => setDuplicateDays(Number(e.target.value))}
                className="w-32 bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-slate-600 font-medium">days</span>
              <Button
                variant="outline"
                size="sm"
                loading={savingKey === 'duplicate_window_days'}
                onClick={() => saveSingleSetting('duplicate_window_days', duplicateDays)}
                icon={<Save className="w-3.5 h-3.5" />}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Service Level Agreement & Operational Rules */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Service Level Agreement (SLA) & Quality Control</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Global Default SLA Target (Hours)
            </label>
            <p className="text-slate-500 mb-2 text-[11px]">
              Default maximum resolution window for complaints when no departmental override exists.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={12}
                max={168}
                value={defaultSlaHours}
                onChange={(e) => setDefaultSlaHours(Number(e.target.value))}
                className="w-32 bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-slate-600 font-medium">hours</span>
              <Button
                variant="outline"
                size="sm"
                loading={savingKey === 'default_sla_hours'}
                onClick={() => saveSingleSetting('default_sla_hours', defaultSlaHours)}
                icon={<Save className="w-3.5 h-3.5" />}
              >
                Save
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Mandatory Resolution Proof Photo
            </label>
            <p className="text-slate-500 mb-2 text-[11px]">
              Enforce that municipal officers must upload an after-fix photo before marking an issue RESOLVED.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requirePhotoVerification}
                  onChange={(e) => setRequirePhotoVerification(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <span className="font-semibold text-slate-800">
                  Require Photo Evidence
                </span>
              </label>
              <Button
                variant="outline"
                size="sm"
                loading={savingKey === 'require_resolution_proof'}
                onClick={() => saveSingleSetting('require_resolution_proof', requirePhotoVerification)}
                icon={<Save className="w-3.5 h-3.5" />}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
