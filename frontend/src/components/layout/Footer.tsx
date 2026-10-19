import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { ShieldCheck, Heart, Sparkles, AlertCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <Logo showTagline={true} size="md" className="brightness-125" />
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering citizens and municipal officers with AI-assisted civic issue detection, intelligent routing, and verified resolution tracking.
            </p>
            <div className="flex items-center gap-2 text-xs text-teal-400">
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <span>AI recommendations verified by humans</span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-teal-400 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-teal-400 transition-colors">How It Works</Link>
              </li>
              <li>
                <Link to="/report" className="hover:text-teal-400 transition-colors">Report an Issue</Link>
              </li>
              <li>
                <Link to="/complaints" className="hover:text-teal-400 transition-colors">Explore Civic Issues</Link>
              </li>
              <li>
                <Link to="/map" className="hover:text-teal-400 transition-colors">Live Public Map</Link>
              </li>
            </ul>
          </div>

          {/* Civic Departments */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 mb-3">
              Municipal Services
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Public Works (Roads & Potholes)</li>
              <li>Sanitation & Solid Waste</li>
              <li>Water Supply & Drainage</li>
              <li>Electricity & Street Lighting</li>
              <li>Traffic Infrastructure & Safety</li>
            </ul>
          </div>

          {/* Legal & Transparency */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 mb-3">
              Transparency & Legal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/about" className="hover:text-teal-400 transition-colors">About CivicLens AI</Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-teal-400 transition-colors">Privacy & Geo-Safety</Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-teal-400 transition-colors">Terms of Service</Link>
              </li>
            </ul>
            <div className="mt-4 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-400 leading-snug">
              <AlertCircle className="w-3.5 h-3.5 inline mr-1 text-teal-400" />
              Educational demonstration platform. Not affiliated with any live municipality without formal deployment.
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CivicLens AI Platform. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built for civic impact with open municipal standards
          </p>
        </div>
      </div>
    </footer>
  );
};
