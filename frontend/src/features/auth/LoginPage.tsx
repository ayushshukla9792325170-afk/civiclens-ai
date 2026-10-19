import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';
import { Lock, Mail, ArrowRight, Sparkles, Shield, User, Building2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, quickLogin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirection destination
  const from = (location.state as any)?.from?.pathname;

  const redirectUser = (role: string) => {
    if (from) {
      navigate(from, { replace: true });
      return;
    }
    if (role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
    else if (role === 'OFFICER') navigate('/officer/dashboard', { replace: true });
    else navigate('/citizen/dashboard', { replace: true });
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const loggedUser = await login(email, password);
      redirectUser(loggedUser.role);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'admin' | 'officer_pwd' | 'officer_swm' | 'citizen') => {
    setLoading(true);
    setError(null);
    try {
      const loggedUser = await quickLogin(role);
      redirectUser(loggedUser.role);
    } catch (err: any) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
        <div className="text-center">
          <Logo size="lg" className="mx-auto" />
          <h1 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">
            Sign In to CivicLens
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Access your civic reporting dashboard or municipal workspace.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleManualLogin} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="login-password" className="text-xs font-bold text-slate-700 uppercase">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs text-teal-600 hover:text-teal-800 font-semibold">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full" isLoading={loading}>
            Sign In
          </Button>
        </form>

        {/* Demo Fast Login Buttons */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              One-Click Demo Profiles
            </span>
            <span className="text-[10px] text-teal-600 font-mono">Instant testing</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              disabled={loading}
              className="p-2.5 bg-slate-900 text-white rounded-xl text-left hover:bg-slate-800 transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-700"
            >
              <Shield className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="truncate">
                <div className="font-bold">Admin</div>
                <div className="text-[10px] text-slate-400 truncate">Commissioner</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('officer_pwd')}
              disabled={loading}
              className="p-2.5 bg-teal-50 text-teal-900 border border-teal-200 rounded-xl text-left hover:bg-teal-100 transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <Building2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <div className="truncate">
                <div className="font-bold">Officer</div>
                <div className="text-[10px] text-teal-700 truncate">Public Works</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('officer_swm')}
              disabled={loading}
              className="p-2.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-left hover:bg-emerald-100 transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <Building2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div className="truncate">
                <div className="font-bold">Officer</div>
                <div className="text-[10px] text-emerald-700 truncate">Sanitation</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('citizen')}
              disabled={loading}
              className="p-2.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-left hover:bg-slate-200 transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <User className="w-4 h-4 text-slate-600 flex-shrink-0" />
              <div className="truncate">
                <div className="font-bold">Citizen</div>
                <div className="text-[10px] text-slate-500 truncate">Aarav Mehta</div>
              </div>
            </button>
          </div>
        </div>

        <div className="text-center pt-2 text-xs text-slate-600">
          Don't have a citizen account?{' '}
          <Link to="/register" className="font-bold text-teal-600 hover:text-teal-800">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
