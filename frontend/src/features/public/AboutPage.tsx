import React from 'react';
import { Logo } from '../../components/common/Logo';
import { ShieldCheck, Sparkles, Building2, Terminal, Code2, Users } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center space-y-4">
        <Logo size="lg" className="mx-auto" />
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          About CivicLens AI
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          An AI-powered civic issue detection, reporting, tracking, and municipal intelligence platform designed to eliminate friction between citizens and public infrastructure authorities.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-600" />
          <span>Our Vision for Civic Intelligence</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          Municipalities handle thousands of overlapping citizen complaints every week. Traditional civic complaint portals suffer from three key bottlenecks:
        </p>
        <ul className="space-y-2 text-xs sm:text-sm text-slate-700 list-disc pl-5">
          <li><strong>Misrouted Complaints:</strong> Citizens frequently misidentify which municipal department is responsible, leading to weeks of inter-departmental bouncing.</li>
          <li><strong>Duplicate Overload:</strong> Multiple citizens report the same major pothole or pipe burst at a busy intersection, overwhelming field dispatchers.</li>
          <li><strong>Lack of Citizen Verification:</strong> Tickets are frequently closed administratively without on-site confirmation that the repair was actually completed.</li>
        </ul>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          CivicLens AI solves these challenges through computer vision, automated duplicate clustering, spatial ward mapping, and a required citizen-verification step.
        </p>
      </div>

      <div className="p-6 bg-slate-900 text-slate-300 rounded-3xl space-y-4 border border-slate-800">
        <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
          <Terminal className="w-4 h-4" />
          <span>Engineering & Architecture Disclosure</span>
        </div>
        <p className="text-xs leading-relaxed text-slate-400">
          CivicLens AI is engineered as a complete full-stack web application with React, TypeScript, Tailwind CSS, Leaflet, and a Python FastAPI backend with SQLAlchemy 2.x, PostgreSQL/SQLite database persistence, and Alembic migrations.
        </p>
        <p className="text-xs leading-relaxed text-slate-400">
          This system is built as an extensible reference architecture for civic technology and academic demonstration. No actual municipal legal authority is claimed without direct municipal deployment.
        </p>
      </div>
    </div>
  );
};
