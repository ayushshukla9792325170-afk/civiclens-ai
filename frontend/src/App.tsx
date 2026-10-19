import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Public pages
import { LandingPage } from './features/public/LandingPage';
import { HowItWorksPage } from './features/public/HowItWorksPage';
import { AboutPage } from './features/public/AboutPage';
import { PrivacyPage } from './features/public/PrivacyPage';
import { TermsPage } from './features/public/TermsPage';
import { ComplaintsListPage } from './features/complaints/ComplaintsListPage';
import { ComplaintDetailPage } from './features/complaints/ComplaintDetailPage';
import { PublicMapPage } from './features/complaints/PublicMapPage';
import { NotFoundPage } from './features/public/NotFoundPage';

// Auth pages
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';

// Intake wizard
import { ReportWizard } from './features/report/ReportWizard';

// Citizen Workspace
import { CitizenDashboard } from './features/citizen/CitizenDashboard';
import { MyComplaintsPage } from './features/citizen/MyComplaintsPage';
import { CitizenNotificationsPage } from './features/citizen/CitizenNotificationsPage';
import { CitizenProfilePage } from './features/citizen/CitizenProfilePage';

// Officer Workspace
import { OfficerDashboard } from './features/officer/OfficerDashboard';
import { OfficerComplaintsPage } from './features/officer/OfficerComplaintsPage';
import { OfficerComplaintDetailPage } from './features/officer/OfficerComplaintDetailPage';
import { OfficerMapPage } from './features/officer/OfficerMapPage';
import { OfficerAnalyticsPage } from './features/officer/OfficerAnalyticsPage';

// Admin Workspace
import { AdminDashboard } from './features/admin/AdminDashboard';
import { AdminUsersPage } from './features/admin/AdminUsersPage';
import { AdminDepartmentsPage } from './features/admin/AdminDepartmentsPage';
import { AdminComplaintsPage } from './features/admin/AdminComplaintsPage';
import { AdminAuditLogsPage } from './features/admin/AdminAuditLogsPage';
import { AdminSettingsPage } from './features/admin/AdminSettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-500 selection:text-white">
          <Navbar />
          
          <main className="flex-1">
            <Routes>
              {/* Public Portal */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/complaints" element={<ComplaintsListPage />} />
              <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
              <Route path="/map" element={<PublicMapPage />} />

              {/* Authentication */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Citizen Reporting Wizard (Accessible to logged-in or redirects to login) */}
              <Route path="/report" element={<ReportWizard />} />

              {/* Citizen Portal */}
              <Route path="/citizen" element={<DashboardLayout requiredRole="CITIZEN" />}>
                <Route index element={<Navigate to="/citizen/dashboard" replace />} />
                <Route path="dashboard" element={<CitizenDashboard />} />
                <Route path="my-complaints" element={<MyComplaintsPage />} />
                <Route path="notifications" element={<CitizenNotificationsPage />} />
                <Route path="profile" element={<CitizenProfilePage />} />
              </Route>

              {/* Officer Portal */}
              <Route path="/officer" element={<DashboardLayout requiredRole="OFFICER" />}>
                <Route index element={<Navigate to="/officer/dashboard" replace />} />
                <Route path="dashboard" element={<OfficerDashboard />} />
                <Route path="complaints" element={<OfficerComplaintsPage />} />
                <Route path="complaints/:id" element={<OfficerComplaintDetailPage />} />
                <Route path="map" element={<OfficerMapPage />} />
                <Route path="analytics" element={<OfficerAnalyticsPage />} />
              </Route>

              {/* Admin Portal */}
              <Route path="/admin" element={<DashboardLayout requiredRole="ADMIN" />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="departments" element={<AdminDepartmentsPage />} />
                <Route path="complaints" element={<AdminComplaintsPage />} />
                <Route path="audit-logs" element={<AdminAuditLogsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>

              {/* Catch-all 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
