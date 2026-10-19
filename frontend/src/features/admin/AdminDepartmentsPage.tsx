import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Department, Ward } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { 
  Building2, Plus, Edit2, Clock, Mail, Phone, 
  MapPin, CheckCircle2, AlertTriangle, RefreshCw
} from 'lucide-react';

export const AdminDepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    default_sla_hours: 48,
    contact_email: '',
    contact_phone: '',
    is_active: true
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [deptRes, wardRes] = await Promise.all([
        api.getDepartments(),
        api.getWards()
      ]);
      setDepartments(deptRes);
      setWards(wardRes);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load department data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      default_sla_hours: 48,
      contact_email: '',
      contact_phone: '',
      is_active: true
    });
    setEditingDept(null);
    setIsCreateModalOpen(true);
    setErrorMsg(null);
  };

  const openEditModal = (d: Department) => {
    setFormData({
      name: d.name,
      code: d.code,
      description: d.description || '',
      default_sla_hours: d.default_sla_hours || 48,
      contact_email: d.contact_email || '',
      contact_phone: d.contact_phone || '',
      is_active: d.is_active
    });
    setEditingDept(d);
    setIsCreateModalOpen(true);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg(null);
    try {
      if (editingDept) {
        await api.updateDepartment(editingDept.id, formData);
        setSuccessMsg(`Department "${formData.name}" successfully updated.`);
      } else {
        await api.createDepartment(formData);
        setSuccessMsg(`Department "${formData.name}" created successfully.`);
      }
      setIsCreateModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save department.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
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

      {/* Control Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">Municipal Departments & SLA Targets</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure municipal departments, default turnaround SLA hours, and contact details.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchData}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={openCreateModal}
          >
            Add Department
          </Button>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {dept.code}
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 mt-1">
                    {dept.name}
                  </h3>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  dept.is_active ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                }`}>
                  {dept.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-3 line-clamp-2">
                {dept.description || 'No description provided.'}
              </p>

              <div className="space-y-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Target SLA:
                  </span>
                  <span className="font-bold text-slate-900">{dept.default_sla_hours} hours</span>
                </div>

                {dept.contact_email && (
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      Email:
                    </span>
                    <span className="font-medium text-slate-800 truncate max-w-[160px]">{dept.contact_email}</span>
                  </div>
                )}

                {dept.contact_phone && (
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      Helpdesk:
                    </span>
                    <span className="font-medium text-slate-800">{dept.contact_phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                icon={<Edit2 className="w-3 h-3" />}
                onClick={() => openEditModal(dept)}
              >
                Edit SLA & Settings
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Wards & Zones Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
          <MapPin className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-900">Municipal Coverage Wards (Pune Metro)</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600 ml-auto">
            {wards.length} Zones
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {wards.map((w) => (
            <div key={w.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-[10px] font-mono font-bold text-slate-400 block">
                Ward #{w.ward_number}
              </span>
              <span className="font-bold text-slate-900 block mt-0.5 truncate">
                {w.name}
              </span>
              {w.office_address && (
                <span className="text-[10px] text-slate-500 block mt-1 truncate">
                  {w.office_address}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Department Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreateModalOpen(false)}
          title={editingDept ? `Edit Department: ${editingDept.name}` : 'Register New Department'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Department Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Roads & Bridges Division"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. PWD"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target SLA (Hours) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={720}
                  value={formData.default_sla_hours}
                  onChange={(e) => setFormData({ ...formData, default_sla_hours: parseInt(e.target.value) || 48 })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description / Scope of Responsibility
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Handles pothole repairs, asphalt resurfacing, arterial flyovers..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="pwd@civiclens.gov"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contact Phone / Helpline
                </label>
                <input
                  type="text"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="+91 20 2550 1000"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  Department Active & Accepting Citizen Complaints
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={actionLoading}>
                {editingDept ? 'Save Changes' : 'Create Department'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
