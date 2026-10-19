import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  disabled = false,
  icon,
  className = '',
  ...props
}) => {
  const isSpinning = isLoading || loading;
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99] select-none';

  const variants = {
    primary: 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm focus-visible:ring-teal-500',
    secondary: 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm focus-visible:ring-slate-700',
    outline: 'border border-slate-300 hover:bg-slate-100 text-slate-700 focus-visible:ring-slate-400 bg-white',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus-visible:ring-rose-500',
    ghost: 'hover:bg-slate-100 text-slate-700 focus-visible:ring-slate-400',
  };

  const sizes = {
    sm: 'text-xs px-3 py-2 min-h-[38px] sm:min-h-[40px] gap-1.5',
    md: 'text-sm px-4 py-2.5 min-h-[46px] gap-2',
    lg: 'text-base px-6 py-3 min-h-[50px] gap-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isSpinning}
      {...props}
    >
      {isSpinning ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};
