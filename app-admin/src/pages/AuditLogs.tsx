import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { deleteAuditLog, getAuditLogs } from '../api/adminApi';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const AuditLogs: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 15;
  const queryClient = useQueryClient();
  const { data, status } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: () => getAuditLogs({ page, limit }).then((res) => res.data),
  });

  const logs = data?.data || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteMutation = useMutation({
    mutationFn: () => deleteAuditLog(deleteId!).then((res) => res.data),
    onSuccess: () => {
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });

  const getActionColor = (action: string) => {
    if (action?.includes('delete')) return 'bg-red-100 text-red-800';
    if (action?.includes('create')) return 'bg-green-100 text-green-800';
    if (action?.includes('update')) return 'bg-blue-100 text-blue-800';
    if (action?.includes('credit')) return 'bg-purple-100 text-purple-800';
    return 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onMenuClick={() => setIsMobileOpen(true)} />
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-2">Audit Logs</h1>
                  <p className="text-slate-600">Track all administrative actions and changes</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-indigo-600">{pagination.total}</p>
                  <p className="text-sm text-slate-600">Total Logs</p>
                </div>
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {status === 'pending' && (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin">
                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <p className="mt-4 text-slate-600">Loading audit logs...</p>
                </div>
              )}
              {status === 'error' && (
                <div className="p-12 text-center bg-red-50">
                  <svg className="w-12 h-12 text-red-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-700 font-medium">Failed to load audit logs</p>
                </div>
              )}
              {status === 'success' && (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Action</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Admin</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Entity</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">IP Address</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Timestamp</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {logs.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                              <svg className="w-12 h-12 mx-auto mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="font-medium">No audit logs found</p>
                            </td>
                          </tr>
                        )}
                        {logs.map((log: any) => (
                          <tr key={log._id || log.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action)}`}>
                                {log.action?.replace(/_/g, ' ').toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-slate-900">
                                  {log.admin_id?.first_name} {log.admin_id?.last_name}
                                </p>
                                <p className="text-xs text-slate-500">{log.admin_id?.email}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-sm font-medium text-slate-900">{log.entity_type}</p>
                                <p className="text-xs text-slate-500 font-mono">{log.entity_id?.slice(0, 8)}...</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-700 font-mono">
                              {log.ip_address || '—'}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-700">
                              {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => setDeleteId(log._id || log.id)}
                                className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition"
                                title="Delete"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-between items-center">
                    <p className="text-sm text-slate-600">
                      Showing page <span className="font-semibold">{pagination.page}</span> of <span className="font-semibold">{pagination.pages}</span>
                      {' '}({pagination.total} total)
                    </p>
                    <div className="flex gap-2">
                      <button
                        className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        ← Previous
                      </button>
                      <button
                        className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                        onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                        disabled={page === pagination.pages}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Delete Modal */}
          {deleteId && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative">
                <button
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
                  onClick={() => setDeleteId(null)}
                  disabled={deleteMutation.status === 'pending'}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Delete Audit Log</h2>
                    <p className="text-sm text-slate-600">This action cannot be undone</p>
                  </div>
                </div>
                <p className="mb-6 text-slate-700">Are you sure you want to delete this audit log entry? This will permanently remove it from the system.</p>
                <div className="flex gap-3">
                  <button
                    className="flex-1 bg-slate-200 text-slate-700 py-2.5 rounded-lg hover:bg-slate-300 transition font-medium"
                    onClick={() => setDeleteId(null)}
                    disabled={deleteMutation.status === 'pending'}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.status === 'pending'}
                  >
                    {deleteMutation.status === 'pending' ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AuditLogs;
