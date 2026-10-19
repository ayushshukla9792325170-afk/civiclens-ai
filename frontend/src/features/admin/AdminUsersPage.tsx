import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, Department, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { 
  Users, Search, Shield, Filter, CheckCircle2, 
  XCircle, AlertTriangle, Building2, Edit2, ShieldAlert, RefreshCw
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [editingRoleUser, setEditingRoleUser] = useState<User | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>('CITIZEN');
  const [targetDeptId, setTargetDeptId] = useState<string>('');
  
  const [editingStatusUser, setEditingStatusUser] = useState<User | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('ACTIVE');
  const [statusReason, setStatusReason] = useState<string>('');

  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchUsersAndDepts = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [usersRes, deptsRes] = await Promise.all([
        api.getUsers({
          role: roleFilter || undefined,
          status: statusFilter || undefined,
          search: searchQuery || undefined
        }),
        api.getDepartments()
      ]);
      setUsers(usersRes);
      setDepartments(deptsRes);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndDepts();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsersAndDepts();
  };

  const openRoleModal = (u: User) => {
    setEditingRoleUser(u);
    setTargetRole(u.role);
    setTargetDeptId(u.department_id || '');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoleUser) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await api.updateUserRole(
        editingRoleUser.id,
        targetRole,
        targetRole === 'OFFICER' ? targetDeptId || undefined : undefined
      );
      setSuccessMsg(`Role for ${editingRoleUser.name} updated to ${targetRole}.`);
      setEditingRoleUser(null);
      await fetchUsersAndDepts();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update user role.');
    } finally {
      setActionLoading(false);
    }
  };

  const openStatusModal = (u: User) => {
    setEditingStatusUser(u);
    setTargetStatus(u.account_status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
    setStatusReason('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStatusUser) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await api.updateUserStatus(
        editingStatusUser.id,
        targetStatus,
        statusReason || undefined
      );
      setSuccessMsg(`User status updated to ${targetStatus}.`);
      setEditingStatusUser(null);
      await fetchUsersAndDepts();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update user account status.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications / Alerts */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700 font-bold">×</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700 font-bold">×</button>
        </div>
      )}

      {/* Control / Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">User & Officer Directory</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {users.length} Registered Accounts
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchUsersAndDepts}
          >
            Refresh
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by full name or email address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </form>

          {/* Role Filter */}
          <div className="w-full md:w-44">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter by account role"
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Account Roles</option>
              <option value="CITIZEN">Citizen</option>
              <option value="OFFICER">Municipal Officer</option>
              <option value="ADMIN">System Administrator</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-44">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by account status"
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Account Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-5">User</th>
                <th className="py-3.5 px-5">Role</th>
                <th className="py-3.5 px-5">Assigned Department</th>
                <th className="py-3.5 px-5">Account Status</th>
                <th className="py-3.5 px-5">Joined</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500 text-xs">
                    No users match the specified criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  const dept = departments.find(d => d.id === u.department_id);

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {u.name}
                          {isCurrent && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 font-bold">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                      </td>

                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : u.role === 'OFFICER'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        {dept ? (
                          <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{dept.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          u.account_status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {u.account_status === 'ACTIVE' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-600" />
                          )}
                          {u.account_status}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-slate-500 text-[11px]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-5 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Edit2 className="w-3 h-3" />}
                          onClick={() => openRoleModal(u)}
                        >
                          Role
                        </Button>
                        <Button
                          variant={u.account_status === 'ACTIVE' ? 'outline' : 'secondary'}
                          size="sm"
                          className={u.account_status === 'ACTIVE' ? 'text-rose-600 hover:text-rose-700' : ''}
                          onClick={() => openStatusModal(u)}
                          disabled={isCurrent}
                        >
                          {u.account_status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role Modal */}
      {editingRoleUser && (
        <Modal
          isOpen={true}
          onClose={() => setEditingRoleUser(null)}
          title={`Update Role: ${editingRoleUser.name}`}
        >
          <form onSubmit={handleUpdateRole} className="space-y-4">
            <p className="text-xs text-slate-600">
              Modifying roles grants or revokes administrative and municipal privileges immediately.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Platform Role
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as UserRole)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="CITIZEN">Citizen (Standard citizen reporting & verification)</option>
                <option value="OFFICER">Municipal Officer (Department triage & resolution desk)</option>
                <option value="ADMIN">Administrator (Full municipal platform authority)</option>
              </select>
            </div>

            {targetRole === 'OFFICER' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assign Municipal Department *
                </label>
                <select
                  value={targetDeptId}
                  onChange={(e) => setTargetDeptId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {editingRoleUser.role === 'ADMIN' && targetRole !== 'ADMIN' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Warning:</strong> You are demoting an Administrator. The system will prevent this change if this is the last remaining administrator on the platform.
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" type="button" onClick={() => setEditingRoleUser(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={actionLoading}>
                Confirm Role Change
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Status Modal */}
      {editingStatusUser && (
        <Modal
          isOpen={true}
          onClose={() => setEditingStatusUser(null)}
          title={`Update Account Status: ${editingStatusUser.name}`}
        >
          <form onSubmit={handleUpdateStatus} className="space-y-4">
            <p className="text-xs text-slate-600">
              {targetStatus === 'SUSPENDED' 
                ? 'Suspending an account will immediately invalidate their sessions and block further complaints or operations.'
                : 'Activating this account will restore full access to their registered role.'}
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Status
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ACTIVE">ACTIVE (Allowed to login & submit/manage)</option>
                <option value="SUSPENDED">SUSPENDED (Locked out)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Administrative Reason / Audit Note
              </label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Provide a mandatory reason for suspending or reactivating this account..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" type="button" onClick={() => setEditingStatusUser(null)}>
                Cancel
              </Button>
              <Button
                variant={targetStatus === 'SUSPENDED' ? 'secondary' : 'primary'}
                className={targetStatus === 'SUSPENDED' ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''}
                size="sm"
                type="submit"
                loading={actionLoading}
              >
                Save Account Status
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
