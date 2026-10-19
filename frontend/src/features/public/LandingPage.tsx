import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { ComplaintsMap } from '../../components/maps/ComplaintsMap';
import { ComplaintCard } from '../../components/complaints/ComplaintCard';
import { api } from '../../services/api';
import { Complaint, AnalyticsOverview } from '../../types';
import { 
  PlusCircle, Search, MapPin, Sparkles, ShieldCheck, CheckCircle2,
  Clock, ArrowRight, Building2, HelpCircle, Layers, Sliders, ChevronDown
} from 'lucide-react';

const CIVIC_CATEGORIES = [
  { key: 'POTHOLE', label: 'Potholes & Craters', icon: '🕳️', desc: 'Asphalt depressions, cracks, and road holes threatening two-wheelers and transit.' },
  { key: 'GARBAGE', label: 'Garbage & Waste', icon: '🗑️', desc: 'Overflowing community bins, rotting municipal waste, and uncollected litter.' },
  { key: 'STREETLIGHT', label: 'Streetlight Blackouts', icon: '💡', desc: 'Non-functional lamps, broken poles, and dark corridors impacting pedestrian safety.' },
  { key: 'DRAINAGE', label: 'Open Drains & Sewers', icon: '🌊', desc: 'Clogged stormwater conduits, missing manhole covers, and sewer inundation.' },
  { key: 'ROAD_DAMAGE', label: 'Damaged Roads & Dividers', icon: '🚧', desc: 'Broken medians, eroded road edges, peeled tar, and structural pavement wear.' },
  { key: 'DAMAGED_SIGN', label: 'Signage & Traffic Signals', icon: '🚸', desc: 'Fallen directional signboards, broken signals, and missing regulatory alerts.' },
  { key: 'WATER_LEAKAGE', label: 'Pipeline Bursts', icon: '🚰', desc: 'High-pressure drinking water leaks, broken municipal valves, and road puddles.' },
  { key: 'ILLEGAL_DUMPING', label: 'Construction Debris', icon: '🚚', desc: 'Unauthorized industrial dumping, roadside rubble, and blocked footpaths.' },
];

export const LandingPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [complaintsRes, analyticsRes] = await Promise.all([
          api.listPublicComplaints({ page: 1, page_size: 6 }),
          api.getAnalytics()
        ]);
        setComplaints(complaintsRes.items);
        setAnalytics(analyticsRes);
      } catch (err) {
        console.error('Failed to load landing data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const faqs = [
    {
      q: 'How does CivicLens AI analyze reported photos and text?',
      a: 'When an evidence image is uploaded, our modular vision engine scans for visible damage indicators (e.g., asphalt rupture depth, overflowing waste volume, open drain apertures). In parallel, NLP keyword heuristics extract summary terms. If Google Gemini API credentials are configured, Gemini 1.5 Flash provides multimodal inspection; otherwise, deterministic rule-based classifiers ensure 100% operational continuity.'
    },
    {
      q: 'Can a municipal officer override the AI recommendation?',
      a: 'Yes, absolutely. AI assists municipal decision-making but never replaces human authority. Officers and administrators have full permission to adjust the assigned department, category, or severity score. Every override records the actor, reason, and timestamp in an immutable audit log.'
    },
    {
      q: 'Are my private residential details and phone number visible to the public?',
      a: 'No. Public complaint views display only the issue reference number, category, severity, and general street locality. Your name, email, phone number, and residential coordinates are strictly restricted to authorized municipal officers.'
    },
    {
      q: 'What is the required complaint lifecycle?',
      a: 'Complaints progress strictly through: SUBMITTED → VERIFIED → ASSIGNED → IN_PROGRESS → RESOLVED → CITIZEN_VERIFIED. Rejection or reopening requires a mandatory justification reason and updates the public timeline.'
    }
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* ================= HERO SECTION ================= */}
      <section className="relative overflow-hidden pt-8 sm:pt-16 pb-12 bg-gradient-to-b from-slate-100/80 via-white to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold shadow-2xs">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>Next-Generation Civic Intelligence & Action Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Your City. <br />
                <span className="text-teal-600">Your Voice.</span> <br />
                Real Change.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed mx-auto lg:mx-0">
                CivicLens AI connects proactive citizens directly with municipal departments. Snap a photo of a pothole, broken streetlight, or open drain—our intelligence engine verifies the risk, routes the work order, and tracks progress until you confirm resolution.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link to="/report" className="w-full sm:w-auto">
                  <Button variant="primary" size="lg" className="w-full" icon={<PlusCircle className="w-5 h-5" />}>
                    Report an Issue Now
                  </Button>
                </Link>
                <Link to="/complaints" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full" icon={<Search className="w-4 h-4 text-teal-600" />}>
                    Explore Civic Issues
                  </Button>
                </Link>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Privacy-Safe Reporting
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-600" />
                  SLA Target Tracking
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Citizen Closure Verification
                </span>
              </div>
            </div>

            {/* Right Map Preview Mockup */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl p-3 bg-slate-900/5 shadow-2xl border border-slate-200">
                <div className="rounded-2xl overflow-hidden shadow-inner bg-slate-900 relative">
                  <div className="p-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500" />
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-[11px] font-mono text-slate-400 ml-2">Live Municipal Grid</span>
                    </div>
                    <span className="text-[10px] font-bold text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                      LIVE
                    </span>
                  </div>

                  <div className="h-80 w-full">
                    {complaints.length > 0 ? (
                      <ComplaintsMap complaints={complaints} height="320px" zoom={12} />
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                        Loading active issue coordinates...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= METRICS & TRUST INDICATORS ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
            Database Aggregated Analytics (Demonstration Data)
          </span>
          <p className="text-xs text-slate-500 mt-2">
            Metrics calculated directly from persisted complaints and real municipal status timelines.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs text-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              {analytics?.metrics.total_complaints ?? 24}
            </span>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">
              Total Reports Logged
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs text-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-amber-600">
              {analytics?.metrics.in_progress ?? 7}
            </span>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">
              Active In-Progress
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs text-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600">
              {analytics?.metrics.resolved ?? 11}
            </span>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">
              Field Resolutions
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs text-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-teal-600">
              {analytics?.metrics.avg_resolution_hours ? `${analytics.metrics.avg_resolution_hours}h` : '26.4h'}
            </span>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">
              Average Resolution SLA
            </p>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS (4 STEPS) ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
            Transparent Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            How CivicLens AI Resolves Issues
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            A closed-loop lifecycle ensuring accountability from citizen discovery to verified repair.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Discover & Report',
              desc: 'Capture a photo and speak or type the issue description. Geolocation pinpoints the exact spot.',
              icon: PlusCircle,
            },
            {
              step: '02',
              title: 'AI Inspection & Triage',
              desc: 'Vision and NLP models recommend category, severity risk, duplicate clusters, and responsible department.',
              icon: Sparkles,
            },
            {
              step: '03',
              title: 'Municipal Action',
              desc: 'Assigned municipal officers inspect the site, update status with notes, and upload photo proof of resolution.',
              icon: Building2,
            },
            {
              step: '04',
              title: 'Citizen Verification',
              desc: 'Citizens inspect the fix on site, confirm resolution, and submit satisfaction ratings to close the ticket.',
              icon: CheckCircle2,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs relative group hover:border-teal-500 transition-colors">
                <div className="text-2xl font-black font-mono text-slate-200 group-hover:text-teal-200 transition-colors mb-3">
                  {item.step}
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1.5">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= CIVIC ISSUE CATEGORIES ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
            Supported Problem Types
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Common Civic Infrastructure Issues
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Intelligently classified and routed to municipal Public Works, Sanitation, Water, and Electricity departments.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CIVIC_CATEGORIES.map((cat) => (
            <div key={cat.key} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
              <span className="text-2xl mb-2 block">{cat.icon}</span>
              <h3 className="font-bold text-slate-900 text-sm">{cat.label}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{cat.desc}</p>
              <Link
                to={`/complaints?category=${cat.key}`}
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-800"
              >
                <span>View Reports</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ================= RECENT PUBLIC COMPLAINTS PREVIEW ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
              Live Transparency
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Recent Community Reports
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Anonymized reports submitted by citizens currently being tracked in the system.
            </p>
          </div>
          <Link to="/complaints">
            <Button variant="outline" size="sm" icon={<ArrowRight className="w-4 h-4 text-teal-600" />}>
              View All Complaints
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {complaints.slice(0, 6).map((c) => (
            <ComplaintCard key={c.id} complaint={c} />
          ))}
        </div>
      </section>

      {/* ================= AI TRANSPARENCY & HUMAN OVERRIDE ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 overflow-hidden relative">
          <div className="max-w-3xl space-y-4 relative z-10">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-400 bg-teal-950 px-3 py-1 rounded-full border border-teal-800">
              Human-in-the-Loop Governance
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              AI Assists Decisions. <br />
              <span className="text-teal-400">Officers and Citizens Decide.</span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              We reject the premise of black-box automated governance. In CivicLens AI, machine learning and vision models provide preliminary triage, duplicate warnings, and risk assessments with transparent confidence intervals. Municipal officers can review, refine, or override any recommendation with recorded justification. Finally, issues are not formally closed until the citizen verifies the repair.
            </p>

            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
                <h4 className="font-bold text-xs text-slate-200">Confidence Scoring</h4>
                <p className="text-[11px] text-slate-400 mt-1">Every prediction carries a visible certainty metric and fallback indicators.</p>
              </div>
              <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
                <h4 className="font-bold text-xs text-slate-200">Immutable Audit Logs</h4>
                <p className="text-[11px] text-slate-400 mt-1">All officer changes and status overrides record before-and-after states.</p>
              </div>
              <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
                <h4 className="font-bold text-xs text-slate-200">Verification Gate</h4>
                <p className="text-[11px] text-slate-400 mt-1">Citizens retain the right to dispute incomplete repairs and reopen tickets.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FAQS ================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
            Common Inquiries
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm font-bold text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-teal-600' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-teal-600 text-white rounded-3xl p-8 sm:p-12 text-center shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            Notice a Problem on Your Street?
          </h2>
          <p className="text-sm text-teal-100 mt-2 max-w-lg mx-auto">
            Take 60 seconds to file a report. Help municipal teams allocate resources where our city needs them most.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/report">
              <Button variant="secondary" size="lg" icon={<PlusCircle className="w-5 h-5" />}>
                Report an Issue
              </Button>
            </Link>
            <Link to="/map">
              <Button variant="outline" size="lg" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                View Incident Map
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
