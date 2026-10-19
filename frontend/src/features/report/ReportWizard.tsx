import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { 
  IssueCategory, IssueSeverity, Ward, Department, 
  AIAnalysisResult, Complaint 
} from '../../types';
import { Button } from '../../components/common/Button';
import { LocationPickerMap } from '../../components/maps/LocationPickerMap';
import { SeverityBadge, CategoryBadge } from '../../components/common/Badge';
import { 
  FileText, Camera, MapPin, Sparkles, CheckCircle2, 
  Mic, MicOff, AlertTriangle, Upload, X, ArrowLeft, ArrowRight,
  Shield, Building2, CopyCheck, ExternalLink, HelpCircle
} from 'lucide-react';

const CATEGORIES: Array<{ key: IssueCategory; label: string; icon: string }> = [
  { key: 'POTHOLE', label: 'Pothole / Road Crater', icon: '🕳️' },
  { key: 'GARBAGE', label: 'Overflowing Garbage Bin', icon: '🗑️' },
  { key: 'STREETLIGHT', label: 'Broken Streetlight', icon: '💡' },
  { key: 'DRAINAGE', label: 'Open Drain / Sewer Overflow', icon: '🌊' },
  { key: 'ROAD_DAMAGE', label: 'Damaged Road / Divider', icon: '🚧' },
  { key: 'DAMAGED_SIGN', label: 'Fallen / Broken Signboard', icon: '🚸' },
  { key: 'WATER_LEAKAGE', label: 'Water Pipeline Leakage', icon: '🚰' },
  { key: 'ILLEGAL_DUMPING', label: 'Illegal Dumping / Debris', icon: '🚚' },
  { key: 'OTHER', label: 'Other Infrastructure Issue', icon: '📍' },
];

export const ReportWizard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Wizard Step (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('POTHOLE');
  const [severity, setSeverity] = useState<IssueSeverity>('MEDIUM');
  const [severityExplanation, setSeverityExplanation] = useState('');
  const [helpIdentify, setHelpIdentify] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  // Voice recording state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Evidence State
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [evidencePreviews, setEvidencePreviews] = useState<string[]>([]);
  const [uploadedStorageKeys, setUploadedStorageKeys] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Location State
  const [latitude, setLatitude] = useState<number>(18.5204);
  const [longitude, setLongitude] = useState<number>(73.8567);
  const [address, setAddress] = useState('Shivaji Nagar, Pune');
  const [wardId, setWardId] = useState<string>('');
  const [wardName, setWardName] = useState<string>('');
  const [wards, setWards] = useState<Ward[]>([]);

  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Check speech recognition support
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setSpeechSupported(true);
    }
    // Fetch wards for dropdown
    api.getWards().then((list) => {
      setWards(list);
      if (list.length > 0) {
        setWardId(list[0].id);
        setWardName(list[0].name);
      }
    }).catch(() => {});
  }, []);

  // Voice Speech Recognition
  const toggleSpeechRecognition = () => {
    if (!speechSupported) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Evidence file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size cannot exceed 10MB.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const uploadRes = await api.uploadEvidence(file);
      setEvidenceFiles([file]);
      setEvidencePreviews([URL.createObjectURL(file)]);
      setUploadedStorageKeys([uploadRes.storage_key]);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload evidence file.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeEvidence = (index: number) => {
    setEvidenceFiles([]);
    setEvidencePreviews([]);
    setUploadedStorageKeys([]);
  };

  // Run AI Analysis when entering Step 4
  const triggerAiAnalysis = async () => {
    setIsAnalyzing(true);
    setAiError(null);
    try {
      const res = await api.analyzeCivicReport({
        text_content: description,
        image_storage_key: uploadedStorageKeys[0],
        latitude,
        longitude,
      });
      setAiResult(res);
      // Auto-suggest category if citizen asked for help
      if (helpIdentify && res.suggested_category) {
        setCategory(res.suggested_category);
      }
      if (!title && res.suggested_title) {
        setTitle(res.suggested_title);
      }
      setSeverity(res.suggested_severity);
      setSeverityExplanation(res.severity_explanation);
    } catch (err: any) {
      setAiError('AI assistance currently unavailable. You may proceed manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!title.trim() || !description.trim()) {
        alert('Please provide both an issue title and description.');
        return;
      }
    }

    if (currentStep === 3) {
      // Trigger AI Analysis before proceeding to Step 4
      await triggerAiAnalysis();
    }

    setCurrentStep((prev) => Math.min(5, prev + 1));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  // Final Submission
  const handleSubmitReport = async () => {
    if (!user) {
      // If not logged in, prompt to login or redirect
      navigate('/login?redirect=/report');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const created = await api.createComplaint({
        title,
        description,
        category,
        severity,
        severity_explanation: severityExplanation,
        latitude,
        longitude,
        address,
        ward_id: wardId || undefined,
        ward_name: wardName || undefined,
        is_public: true,
        evidence_storage_keys: uploadedStorageKeys,
      });
      setSubmittedComplaint(created);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit complaint. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 5: Success Screen
  if (submittedComplaint) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            Complaint Successfully Filed
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-4">
            Thank You, {user?.name || 'Citizen'}!
          </h2>

          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
            Your complaint has been queued and routed to the municipal team. An officer will inspect the site shortly.
          </p>

          <div className="my-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Tracking Reference:</span>
              <span className="font-mono text-base font-extrabold text-teal-700 bg-teal-100 px-2.5 py-0.5 rounded">
                {submittedComplaint.reference_number}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Category:</span>
              <CategoryBadge category={submittedComplaint.category} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Assessed Priority:</span>
              <SeverityBadge severity={submittedComplaint.severity} size="sm" />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Location:</span>
              <span className="font-medium text-slate-700 truncate max-w-[200px]">{submittedComplaint.address}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to={`/complaints/${submittedComplaint.id}`} className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full" icon={<ExternalLink className="w-4 h-4" />}>
                View Complaint Timeline
              </Button>
            </Link>
            <Link to="/map" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full" icon={<MapPin className="w-4 h-4 text-teal-600" />}>
                See on Live Map
              </Button>
            </Link>
            <Link to="/citizen/dashboard" className="w-full sm:w-auto">
              <Button variant="ghost" size="md" className="w-full">
                My Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {/* Wizard Header & Stepper */}
      <div className="mb-8 text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
          Civic Problem Reporting Portal
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Report an Infrastructure Issue
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Follow 5 simple steps to submit evidence, verify location, and dispatch municipal repair teams.
        </p>

        {/* Stepper Indicator */}
        <div className="mt-6 flex items-center justify-between relative max-w-xl mx-auto">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 -z-0" />
          {[
            { step: 1, title: 'Details' },
            { step: 2, title: 'Evidence' },
            { step: 3, title: 'Location' },
            { step: 4, title: 'AI Review' },
            { step: 5, title: 'Submit' },
          ].map((item) => {
            const isDone = currentStep > item.step;
            const isCurrent = currentStep === item.step;
            return (
              <div key={item.step} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-teal-600 text-white ring-4 ring-teal-100 shadow-sm'
                      : isDone
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border-2 border-slate-300 text-slate-400'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-5 h-5" /> : item.step}
                </div>
                <span className={`text-[11px] font-semibold mt-1.5 ${isCurrent ? 'text-teal-900' : 'text-slate-400'}`}>
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Wizard Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8">
        {/* ================= STEP 1: ISSUE DETAILS ================= */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Step 1 — Issue Information</h2>
                <p className="text-xs text-slate-500">Describe the problem observed in your area.</p>
              </div>
              {/* Language toggle */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${language === 'en' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('hi')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${language === 'hi' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                >
                  हिंदी
                </button>
              </div>
            </div>

            {/* Category selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Select Problem Category
                </label>
                <button
                  type="button"
                  onClick={() => setHelpIdentify(!helpIdentify)}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{helpIdentify ? 'I will select myself' : 'Help me identify it via AI'}</span>
                </button>
              </div>

              {helpIdentify ? (
                <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-center gap-3 text-xs text-teal-900">
                  <Sparkles className="w-6 h-6 text-teal-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold">AI Auto-Identification enabled.</span> Provide your description and photo, and the platform will classify the issue and suggest the responsible department in Step 4.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setCategory(cat.key)}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                        category === cat.key
                          ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-2xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-lg">{cat.icon}</span>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label htmlFor="issue-title" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Short Title / Headline *
              </label>
              <input
                id="issue-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deep pothole crater near Shivaji Nagar Bus Depot"
                className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                maxLength={120}
              />
            </div>

            {/* Description & Speech Recognition */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="issue-desc" className="text-xs font-bold text-slate-700 uppercase">
                  Detailed Description *
                </label>
                {speechSupported && (
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                      isListening
                        ? 'bg-rose-100 text-rose-700 animate-pulse border border-rose-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isListening ? <Mic className="w-3.5 h-3.5 text-rose-600" /> : <Mic className="w-3.5 h-3.5" />}
                    <span>{isListening ? 'Listening...' : 'Voice Input'}</span>
                  </button>
                )}
              </div>
              <textarea
                id="issue-desc"
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe visible hazard, road conditions, depth, size, or duration of the problem..."
                className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                maxLength={3000}
              />
            </div>

            {/* Privacy notice */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5 text-xs text-slate-600">
              <Shield className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span>
                <strong>Privacy Guaranteed:</strong> Your personal identity is never publicly exposed on open issue maps.
              </span>
            </div>
          </div>
        )}

        {/* ================= STEP 2: EVIDENCE ================= */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Step 2 — Visual Evidence</h2>
              <p className="text-xs text-slate-500">
                Upload clear photographs of the damage to assist municipal dispatch and AI analysis.
              </p>
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl">
                {uploadError}
              </div>
            )}

            {evidencePreviews.length > 0 ? (
              <div className="space-y-4">
                <div className="relative h-64 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
                  <img
                    src={evidencePreviews[0]}
                    alt="Uploaded preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeEvidence(0)}
                    className="absolute top-3 right-3 p-2 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full transition-colors"
                    title="Remove photo"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-3 bg-slate-900/80 text-white text-xs px-2.5 py-1 rounded-md backdrop-blur-xs font-mono">
                    ✓ Photo ready for AI analysis
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  icon={<Upload className="w-4 h-4" />}
                >
                  Replace Photograph
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center hover:border-teal-500 transition-colors bg-slate-50/50">
                <Camera className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-900">Upload or Capture Civic Photo</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Supports JPEG, PNG, and WebP up to 10MB. Clear daylight photos significantly increase AI classification accuracy.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    isLoading={isUploading}
                    icon={<Upload className="w-4 h-4" />}
                  >
                    Upload from Gallery
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => cameraInputRef.current?.click()}
                    isLoading={isUploading}
                    icon={<Camera className="w-4 h-4" />}
                  >
                    Take Camera Photo
                  </Button>
                </div>
              </div>
            )}

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {/* ================= STEP 3: LOCATION ================= */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Step 3 — Incident Location</h2>
              <p className="text-xs text-slate-500">
                Pinpoint the exact geographical position of the civic defect.
              </p>
            </div>

            {/* Leaflet Picker Map */}
            <LocationPickerMap
              latitude={latitude}
              longitude={longitude}
              height="340px"
              onChangeLocation={(lat, lng, suggestion) => {
                setLatitude(lat);
                setLongitude(lng);
                if (suggestion && address.includes('Shivaji Nagar')) {
                  setAddress(`${suggestion} (Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)})`);
                }
              }}
            />

            {/* Address & Ward Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="address-input" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Street Address / Landmark *
                </label>
                <input
                  id="address-input"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near Lane 4, Opposite Ganpati Temple, Shivaji Nagar"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label htmlFor="ward-select" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Municipal Ward / Zone
                </label>
                <select
                  id="ward-select"
                  value={wardId}
                  onChange={(e) => {
                    setWardId(e.target.value);
                    const selected = wards.find(w => w.id === e.target.value);
                    if (selected) setWardName(selected.name);
                  }}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 4: AI ANALYSIS ================= */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-600" />
                  <span>Step 4 — AI Intelligence Review</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Review the recommendations generated by CivicLens AI models before submitting.
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                aiResult?.analysis_mode === 'AI_GEMINI' 
                  ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
                {aiResult?.analysis_mode === 'AI_GEMINI' ? '✨ Gemini 1.5 Flash' : '⚙️ Rule-Based Fallback'}
              </span>
            </div>

            {isAnalyzing ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4" />
                <h3 className="font-bold text-slate-900 text-sm">Inspecting Evidence & Text...</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Evaluating severity triggers, matching municipal category, and scanning for duplicate nearby reports.
                </p>
              </div>
            ) : aiResult ? (
              <div className="space-y-4">
                {/* AI Summary Banner */}
                <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                      AI Diagnostic Assessment
                    </span>
                    <span className="text-xs font-mono font-bold text-teal-700">
                      Confidence: {(aiResult.confidence_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {aiResult.short_summary}
                  </p>
                </div>

                {/* Categorization & Department Routing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Suggested Category
                    </span>
                    <div className="flex items-center justify-between">
                      <CategoryBadge category={category} className="text-xs font-bold py-1" />
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as IssueCategory)}
                        className="text-xs border border-slate-300 rounded-md p-1 focus:ring-teal-500"
                        title="Override category"
                      >
                        {CATEGORIES.map(c => (
                          <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Recommended Department
                    </span>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {aiResult.suggested_department_name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Severity & Rationale */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Estimated Hazard Severity
                    </span>
                    <SeverityBadge severity={severity} size="sm" />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{aiResult.severity_explanation}"
                  </p>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 font-medium">Citizen override:</span>
                    {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as IssueSeverity[]).map(sev => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setSeverity(sev)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                          severity === sev ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duplicate alert if found */}
                {aiResult.potential_duplicates && aiResult.potential_duplicates.length > 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-2">
                      <CopyCheck className="w-4 h-4 text-amber-700" />
                      <span>Potential Duplicate Found Nearby ({aiResult.potential_duplicates.length})</span>
                    </div>
                    <p className="text-xs text-amber-800 mb-3">
                      Another citizen filed a complaint within {aiResult.potential_duplicates[0].distance_meters.toFixed(0)}m of this location. Your complaint will still be recorded and linked to the existing cluster.
                    </p>
                    <div className="space-y-1.5">
                      {aiResult.potential_duplicates.slice(0, 2).map(dup => (
                        <div key={dup.complaint_id} className="p-2.5 bg-white/90 rounded-lg text-xs flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-700">{dup.reference_number}</span>
                          <span className="text-slate-600 truncate max-w-[200px]">{dup.title}</span>
                          <span className="text-amber-700 font-bold">{dup.distance_meters.toFixed(0)}m away</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 text-center">
                AI analysis skipped or unavailable. You can review your details and submit directly.
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 5: REVIEW & SUBMIT ================= */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Step 5 — Final Confirmation</h2>
              <p className="text-xs text-slate-500">
                Please verify that the details below are accurate before publishing to the municipal intake queue.
              </p>
            </div>

            {submitError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {submitError}
              </div>
            )}

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-900 text-base">{title}</span>
                <div className="flex items-center gap-1.5">
                  <CategoryBadge category={category} />
                  <SeverityBadge severity={severity} size="sm" />
                </div>
              </div>

              <div className="text-xs text-slate-700 space-y-2">
                <p className="leading-relaxed">{description}</p>
              </div>

              <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Location & Ward:</span>
                  <span className="font-bold text-slate-800">{address}</span>
                  {wardName && <span className="text-slate-500 block text-[11px] mt-0.5">{wardName}</span>}
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Evidence Attached:</span>
                  <span className="font-bold text-slate-800">
                    {uploadedStorageKeys.length > 0 ? '1 Photograph Uploaded' : 'No photo attached'}
                  </span>
                </div>
              </div>

              {uploadedStorageKeys.length > 0 && evidencePreviews.length > 0 && (
                <div className="pt-2">
                  <img
                    src={evidencePreviews[0]}
                    alt="Submission evidence"
                    className="h-32 w-auto rounded-xl object-cover border border-slate-200"
                  />
                </div>
              )}
            </div>

            <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-start gap-3 text-xs text-teal-900">
              <Shield className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">Citizen Responsibility Declaration:</span>
                <p className="text-[11px] text-teal-800">
                  By clicking submit, I confirm that the information provided represents a genuine civic defect observed in good faith for municipal public works review.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handlePrevStep}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Previous
            </Button>
          ) : (
            <Link to="/">
              <Button type="button" variant="ghost" size="md">
                Cancel
              </Button>
            </Link>
          )}

          {currentStep < 5 ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleNextStep}
              isLoading={isAnalyzing}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Next Step
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSubmitReport}
              isLoading={isSubmitting}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Confirm & Submit Complaint
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
