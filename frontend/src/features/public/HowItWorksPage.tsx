import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { 
  Camera, Sparkles, Building2, ShieldCheck, CheckCircle2, 
  ArrowRight, ShieldAlert, Cpu, Users, GitFork, RotateCcw
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
          Architecture & Process
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          How CivicLens AI Operates
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          From citizen observation to official municipal work order and verified closure. Here is an in-depth breakdown of our technical pipeline.
        </p>
      </div>

      {/* Step by step technical cards */}
      <div className="space-y-8">
        {/* Step 1 */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-4 bg-teal-50 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-teal-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow">
              <Camera className="w-8 h-8" />
            </div>
            <span className="font-mono text-xs font-bold text-teal-800">STAGE 1: CITIZEN INTAKE</span>
          </div>
          <div className="md:col-span-8 space-y-2">
            <h3 className="text-xl font-bold text-slate-900">1. Evidence Capture & Voice Description</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Citizens capture photos on their mobile phones and describe the defect using keyboard or native speech recognition in English or Hindi. Interactive Leaflet maps pinpoint coordinates with optional GPS assistance, while protecting citizen privacy.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-4 bg-purple-50 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-purple-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow">
              <Sparkles className="w-8 h-8" />
            </div>
            <span className="font-mono text-xs font-bold text-purple-800">STAGE 2: AI REASONING</span>
          </div>
          <div className="md:col-span-8 space-y-2">
            <h3 className="text-xl font-bold text-slate-900">2. Multimodal AI Risk Assessment & Duplicate Detection</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Uploaded photos and text are routed to server-side inspection engines. Vision models evaluate visible damage severity (CRITICAL, HIGH, MEDIUM, LOW), Haversine spatial algorithms check for duplicate complaints within 150 meters, and routing tables suggest the responsible department.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-4 bg-blue-50 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow">
              <Building2 className="w-8 h-8" />
            </div>
            <span className="font-mono text-xs font-bold text-blue-800">STAGE 3: MUNICIPAL DISPATCH</span>
          </div>
          <div className="md:col-span-8 space-y-2">
            <h3 className="text-xl font-bold text-slate-900">3. Officer Verification, Assignment & Execution</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Municipal ward officers review AI suggestions on their operational dashboards. Officers can override severity or department with mandatory justification. Field teams are mobilized, and upon finishing the job, officers must upload on-site photographic proof of resolution.
            </p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-4 bg-emerald-50 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <span className="font-mono text-xs font-bold text-emerald-800">STAGE 4: CITIZEN CLOSURE</span>
          </div>
          <div className="md:col-span-8 space-y-2">
            <h3 className="text-xl font-bold text-slate-900">4. Citizen Verification & Reopen Protections</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              When an issue is marked resolved, the reporting citizen receives an instant notification. The citizen visits the site to verify the work and rates municipal performance (1-5 stars). If the problem was improperly patched, the citizen can reopen the ticket with an explanation.
            </p>
          </div>
        </div>
      </div>

      {/* Lifecycle Flowchart visual */}
      <div className="bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-teal-400">Formal Lifecycle State Machine</h3>
        <p className="text-xs text-slate-400">
          The backend enforces strict database constraints preventing invalid status jumps.
        </p>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono pt-2">
          <span className="px-3 py-1 rounded bg-blue-900/60 text-blue-300 border border-blue-700">SUBMITTED</span>
          <ArrowRight className="w-4 h-4 text-slate-500" />
          <span className="px-3 py-1 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700">VERIFIED</span>
          <ArrowRight className="w-4 h-4 text-slate-500" />
          <span className="px-3 py-1 rounded bg-purple-900/60 text-purple-300 border border-purple-700">ASSIGNED</span>
          <ArrowRight className="w-4 h-4 text-slate-500" />
          <span className="px-3 py-1 rounded bg-amber-900/60 text-amber-300 border border-amber-700">IN_PROGRESS</span>
          <ArrowRight className="w-4 h-4 text-slate-500" />
          <span className="px-3 py-1 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700">RESOLVED</span>
          <ArrowRight className="w-4 h-4 text-slate-500" />
          <span className="px-3 py-1 rounded bg-teal-900/60 text-teal-300 border border-teal-700">CITIZEN_VERIFIED</span>
        </div>
      </div>

      <div className="text-center pt-4">
        <Link to="/report">
          <Button variant="primary" size="lg">
            Ready to File a Report?
          </Button>
        </Link>
      </div>
    </div>
  );
};
