import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = '', showTagline = false, size = 'md' }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  }[size];

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }[size];

  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg p-1 ${className}`}>
      <div className={`relative flex-shrink-0 ${iconSizes}`}>
        <svg viewBox="0 0 48 48" fill="none" className="w-full h-full drop-shadow-sm transition-transform duration-200 group-hover:scale-105">
          <defs>
            <linearGradient id="lensGradLogo" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
            <linearGradient id="accentGradLogo" x1="12" y1="8" x2="36" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0D9488" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
          <rect x="3" y="3" width="42" height="42" rx="12" fill="url(#lensGradLogo)" stroke="#334155" strokeWidth="1.5" />
          <path d="M8 36L24 28L40 36" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M24 28V42" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 14H16" stroke="#38BDF8" strokeWidth="1.75" strokeLinecap="round" opacity="0.9" />
          <path d="M12 14V18" stroke="#38BDF8" strokeWidth="1.75" strokeLinecap="round" opacity="0.9" />
          <path d="M36 14H32" stroke="#38BDF8" strokeWidth="1.75" strokeLinecap="round" opacity="0.9" />
          <path d="M36 14V18" stroke="#38BDF8" strokeWidth="1.75" strokeLinecap="round" opacity="0.9" />
          <path d="M24 9C18.4772 9 14 13.4772 14 19C14 26 24 35 24 35C24 35 34 26 34 19C34 13.4772 29.5228 9 24 9Z" fill="url(#accentGradLogo)" />
          <circle cx="24" cy="18.5" r="5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx="24" cy="18.5" r="2.2" fill="#38BDF8" />
        </svg>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-bold tracking-tight text-slate-900 ${textSizes}`}>
            Civic<span className="text-teal-600">Lens</span>
          </span>
          <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-teal-100 text-teal-800 rounded">
            AI
          </span>
        </div>
        {showTagline && (
          <span className="text-xs text-slate-500 font-medium mt-0.5">
            See the issue. Track the action.
          </span>
        )}
      </div>
    </Link>
  );
};
