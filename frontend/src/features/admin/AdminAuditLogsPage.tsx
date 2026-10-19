import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AuditLog } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { 
  ShieldAlert, Filter, RefreshCw, Eye, Search, 
  Calendar, User, Tag, Clock, ChevronRight
} from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [limit, setLimit] = useState(50);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs({
        action: actionFilter || undefined,
        entity_type: entityFilter || undefined,
        limit
      });
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter, entityFilter, limit]);

  return (
    <div className="space-y-6">
      {/* Control / Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">Immutable System Audit Trail</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {logs.length} Events Logged
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchAuditLogs}
          >
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Filter by Action
            </label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              aria-label="Filter audit logs by action"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Platform Actions</option>
              <option value="USER_ROLE_CHANGED">User Role Changed</option>
              <option value="USER_STATUS_CHANGED">User Status Changed</option>
              <option value="COMPLAINT_CREATED">Complaint Created</option>
              <option value="COMPLAINT_STATUS_UPDATED">Status Transitioned</option>
              <option value="COMPLAINT_OVERRIDDEN">Human Override Applied</option>
              <option value="DUPLICATE_REVIEWED">Duplicate Reviewed</option>
              <option value="SETTING_UPDATED">Setting Updated</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Entity Type
            </label>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              aria-label="Filter audit logs by entity type"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Entity Types</option>
              <option value="complaint">Complaint</option>
              <option value="user">User</option>
              <option value="department">Department</option>
              <option value="duplicate_candidate">Duplicate Candidate</option>
              <option value="system_setting">System Setting</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Log Limit
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              aria-label="Filter audit logs limit"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value={25}>Recent 25 events</option>
              <option value={50}>Recent 50 events</option>
              <option value={100}>Recent 100 events</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-5">Timestamp</th>
                <th className="py-3.5 px-5">Action</th>
                <th className="py-3.5 px-5">Target Entity</th>
                <th className="py-3.5 px-5">Actor / Operator</th>
                <th className="py-3.5 px-5">Reason / Note</th>
                <th className="py-3.5 px-5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 text-xs">
                    No audit records match the current filter parameters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>

                    <td className="py-4 px-5">
                      <span className="font-mono text-[11px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      <div className="text-slate-800 font-semibold">{log.entity_type}</div>
                      {log.entity_id && (
                        <div className="font-mono text-[10px] text-slate-400">
                          #{log.entity_id.slice(0, 10)}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900">
                        {log.actor_name || 'System Service'}
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span className="text-[11px] text-slate-600 truncate max-w-[180px] block">
                        {log.reason || '-'}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Eye className="w-3 h-3" />}
                        onClick={() => setSelectedLog(log)}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Detail Modal */}
      {selectedLog && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedLog(null)}
          title={`Audit Event: ${selectedLog.action}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Timestamp</span>
                <span className="font-semibold text-slate-900">{new Date(selectedLog.created_at).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Operator</span>
                <span className="font-semibold text-slate-900">{selectedLog.actor_name || 'System Service'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Target Entity</span>
                <span className="font-semibold text-slate-900">{selectedLog.entity_type}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Entity ID</span>
                <span className="font-mono text-slate-900 truncate block">{selectedLog.entity_id || 'N/A'}</span>
              </div>
            </div>

            {selectedLog.reason && (
              <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-800">
                <span className="font-bold block mb-0.5">Recorded Reason:</span>
                <span>{selectedLog.reason}</span>
              </div>
            )}

            {selectedLog.ip_address && (
              <div className="text-slate-500 text-[11px]">
                IP Origin: <span className="font-mono text-slate-700">{selectedLog.ip_address}</span>
              </div>
            )}

            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1">
                Event Payload & State Diffs
              </span>
              <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60 border border-slate-800">
                {JSON.stringify({
                  before_state: selectedLog.before_state,
                  after_state: selectedLog.after_state,
                  reason: selectedLog.reason,
                }, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
