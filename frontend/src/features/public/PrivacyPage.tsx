import React from 'react';
import { Shield, EyeOff, Lock, Database } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Privacy & Data Governance</span>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-1">CivicLens Privacy Policy</h1>
        <p className="text-xs text-slate-500 mt-1">Effective Date: October 2026</p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-teal-600" />
            1. Public Reporter Anonymization
          </h2>
          <p>
            When you submit a civic defect, your personal identifier (name, email, phone number) is never rendered on open public maps or shared in open datasets. Only verified municipal staff with assigned work credentials have access to communication details for on-site inspection inquiries.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-600" />
            2. Geolocation Privacy & Consent
          </h2>
          <p>
            CivicLens requests browser geolocation coordinates strictly when you tap "Use Current Location" in the reporting wizard. Coordinates are attached exclusively to the specific incident report and are never used to track user movements or residential residences continuously.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal-600" />
            3. Photographic Evidence & Visual Data
          </h2>
          <p>
            Images submitted with complaints are processed server-side to detect civic problems. Citizens are advised not to photograph private residential interiors, vehicle license plates, or human faces.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-teal-600" />
            4. Data Retention and Account Deactivation
          </h2>
          <p>
            Citizens can update their contact preferences or request account deactivation at any time from their Profile page.
          </p>
        </section>
      </div>
    </div>
  );
};
