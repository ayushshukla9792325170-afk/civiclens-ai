import React from 'react';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Platform Agreement</span>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-1">CivicLens Terms of Service</h1>
        <p className="text-xs text-slate-500 mt-1">Effective Date: October 2026</p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Acceptable Civic Reporting Use</h2>
          <p>
            Citizens agree to use CivicLens AI exclusively to report genuine civic defects, public road hazards, waste accumulation, water leaks, or related municipal concerns. Filing intentionally fraudulent reports or defaming private citizens is strictly prohibited.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Emergency Incidents Exclusion</h2>
          <p>
            CivicLens AI is designed for municipal public works maintenance and is NOT an emergency dispatch service. For life-threatening emergencies, armed threats, structure fires, or urgent medical needs, citizens must immediately call standard emergency numbers (e.g. 112 / 911).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Nature of AI Recommendations</h2>
          <p>
            AI recommendations for issue categorization, severity triage, and duplicate detection are computational estimations to assist municipal officers. Final assignment, operational response times, and resolution closure remain subject to municipal staff review and citizen verification.
          </p>
        </section>
      </div>
    </div>
  );
};
