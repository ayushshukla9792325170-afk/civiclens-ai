import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { User, Phone, MapPin, Lock, Shield, CheckCircle2, AlertTriangle } from 'lucide-react';

export const CitizenProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.default_location || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await api.updateProfile({
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        default_location: location.trim() || undefined,
        current_password: currentPassword || undefined,
        new_password: newPassword || undefined,
      });
      await refreshUser();
      setSuccessMsg('Profile successfully updated.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Profile Details</h2>
          <p className="text-xs text-slate-500">
            Manage your citizen credentials and contact preferences for municipal inspection updates.
          </p>
        </div>

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-xs text-rose-800 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prof-name" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Full Name
              </label>
              <input
                id="prof-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                title="Email address is tied to identity and cannot be edited directly"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prof-phone" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Phone Number
              </label>
              <input
                id="prof-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 ..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-teal-500"
              />
            </div>

            <div>
              <label htmlFor="prof-loc" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Default Residential Ward / Area
              </label>
              <input
                id="prof-loc"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Shivaji Nagar, Ward 1"
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Change Password (Optional)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prof-curr-pwd" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Current Password
                </label>
                <input
                  id="prof-curr-pwd"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-teal-500"
                />
              </div>

              <div>
                <label htmlFor="prof-new-pwd" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  New Password
                </label>
                <input
                  id="prof-new-pwd"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" variant="primary" size="md" isLoading={loading}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Account Status Card */}
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800">Account Authorization Status</span>
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase">
            {user?.account_status}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed">
          To request account deactivation or personal data removal in compliance with civic privacy policies, please submit a written verification request to the municipal privacy officer.
        </p>
      </div>
    </div>
  );
};
