import React from 'react';
import { Link, useLocation, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { 
  LayoutDashboard, ListChecks, Bell, User as UserIcon, PlusCircle,
  MapPin, BarChart3, Users, Building2, ShieldAlert, Sliders, ChevronRight
} from 'lucide-react';
import { Button } from '../common/Button';

interface DashboardLayoutProps {
  requiredRole?: UserRole;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  requiredRole,
  title: customTitle,
  subtitle: customSubtitle,
  actions,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Dynamic route titles
  const getRouteInfo = (pathname: string): { title: string; subtitle: string } => {
    if (pathname.includes('/citizen/dashboard')) return { title: 'Citizen Overview', subtitle: 'Track your civic reports, resolution proofs, and neighborhood status.' };
    if (pathname.includes('/citizen/my-complaints')) return { title: 'My Submitted Complaints', subtitle: 'Detailed record of issues submitted under your citizen profile.' };
    if (pathname.includes('/citizen/notifications')) return { title: 'Notifications & Alerts', subtitle: 'Real-time updates on status changes, assignments, and verifications.' };
    if (pathname.includes('/citizen/profile')) return { title: 'Citizen Profile & Preferences', subtitle: 'Manage your contact details, preferred ward, and account credentials.' };
    if (pathname.includes('/officer/dashboard')) return { title: 'Municipal Operations Desk', subtitle: 'Live department queue, SLA monitoring, and pending incident triage.' };
    if (pathname.includes('/officer/complaints/') && pathname !== '/officer/complaints') return { title: 'Incident Resolution Desk', subtitle: 'Review complaint details, verify duplicates, advance status, or upload proof.' };
    if (pathname.includes('/officer/complaints')) return { title: 'Department Complaints Queue', subtitle: 'Filter, inspect, assign, advance lifecycle status, and verify proof.' };
    if (pathname.includes('/officer/map')) return { title: 'GIS Operations Map', subtitle: 'Spatial view of all active civic complaints and infrastructure issues.' };
    if (pathname.includes('/officer/analytics')) return { title: 'Analytics & SLA Compliance', subtitle: 'Department performance metrics, resolution velocity, and turnaround times.' };
    if (pathname.includes('/admin/dashboard')) return { title: 'Admin Command Center', subtitle: 'Central municipal governance, user permissions, and platform health.' };
    if (pathname.includes('/admin/users')) return { title: 'User & Role Directory', subtitle: 'Manage citizen accounts, promote officers, and configure jurisdictions.' };
    if (pathname.includes('/admin/departments')) return { title: 'Departments & SLAs', subtitle: 'Configure municipal divisions, default SLA targets, and emergency contacts.' };
    if (pathname.includes('/admin/complaints')) return { title: 'Master Complaints Ledger', subtitle: 'Global record of all complaints across wards, categories, and lifecycles.' };
    if (pathname.includes('/admin/audit-logs')) return { title: 'System Audit Trail', subtitle: 'Immutable security log of role adjustments, status overrides, and admin actions.' };
    if (pathname.includes('/admin/settings')) return { title: 'Platform Settings', subtitle: 'Spatial deduplication thresholds, AI confidence rules, and SLA configurations.' };
    return { title: 'Municipal Workspace', subtitle: 'Operational platform for civic management.' };
  };

  const routeInfo = getRouteInfo(location.pathname);
  const title = customTitle || routeInfo.title;
  const subtitle = customSubtitle || routeInfo.subtitle;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Verifying access credentials...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check: If requiredRole is ADMIN, only ADMIN allowed. If OFFICER, OFFICER or ADMIN allowed.
  if (requiredRole) {
    const isAuthorized = 
      user.role === requiredRole ||
      (requiredRole === 'CITIZEN') ||
      (requiredRole === 'OFFICER' && user.role === 'ADMIN');

    if (!isAuthorized) {
      return (
        <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl border border-rose-200 text-center shadow-sm">
          <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-xs text-slate-600 mt-2">
            Your current account role (<span className="font-bold text-slate-900">{user.role}</span>) does not have authorization to view this operational workspace.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/">
              <Button variant="outline" size="sm">Return Home</Button>
            </Link>
          </div>
        </div>
      );
    }
  }

  // Sidebar link items based on current portal
  const citizenLinks = [
    { label: 'Overview', path: '/citizen/dashboard', icon: LayoutDashboard },
    { label: 'My Complaints', path: '/citizen/my-complaints', icon: ListChecks },
    { label: 'Notifications', path: '/citizen/notifications', icon: Bell },
    { label: 'My Profile', path: '/citizen/profile', icon: UserIcon },
  ];

  const officerLinks = [
    { label: 'Operations Desk', path: '/officer/dashboard', icon: LayoutDashboard },
    { label: 'Complaints Queue', path: '/officer/complaints', icon: ListChecks },
    { label: 'Operational Map', path: '/officer/map', icon: MapPin },
    { label: 'Analytics & SLAs', path: '/officer/analytics', icon: BarChart3 },
  ];

  const adminLinks = [
    { label: 'Admin Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'User Directory', path: '/admin/users', icon: Users },
    { label: 'Departments & SLAs', path: '/admin/departments', icon: Building2 },
    { label: 'All Complaints', path: '/admin/complaints', icon: ListChecks },
    { label: 'Audit Trail', path: '/admin/audit-logs', icon: ShieldAlert },
    { label: 'Settings', path: '/admin/settings', icon: Sliders },
  ];

  let currentLinks = citizenLinks;
  if (user.role === 'ADMIN' && location.pathname.startsWith('/admin')) {
    currentLinks = adminLinks;
  } else if ((user.role === 'OFFICER' || user.role === 'ADMIN') && location.pathname.startsWith('/officer')) {
    currentLinks = officerLinks;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
        {/* Workspace Header & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
              <span>CivicLens</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="capitalize">{user.role.toLowerCase()} Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {actions}
            {user.role === 'CITIZEN' && (
              <Link to="/report">
                <Button variant="primary" size="sm" icon={<PlusCircle className="w-4 h-4" />}>
                  New Report
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Dashboard Grid with Subnavigation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6">
          {/* Sidebar Navigation */}
          <aside className="md:col-span-1">
            <nav className="space-y-1 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs" aria-label="Sidebar navigation">
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Workspace Menu
              </div>
              {currentLinks.map((link) => {
                const Icon = link.icon;
                const active = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                      active
                        ? 'bg-teal-50 text-teal-800 border border-teal-200/80 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-teal-600' : 'text-slate-400'}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Quick Context Card */}
            <div className="mt-4 p-4 bg-slate-900 text-white rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                Active Session
              </span>
              <p className="text-xs font-bold text-white mt-1 truncate">{user.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
              <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Role:</span>
                <span className="px-1.5 py-0.5 rounded bg-teal-900/60 text-teal-300 font-bold border border-teal-700/50">
                  {user.role}
                </span>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="md:col-span-3 space-y-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
