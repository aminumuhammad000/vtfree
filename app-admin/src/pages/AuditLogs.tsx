import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  FiActivity,
  FiUser,
  FiDatabase,
  FiClock,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiTerminal,
  FiSearch,
  FiFilter,
  FiRefreshCw
} from 'react-icons/fi';
import { deleteAuditLog, getAuditLogs } from '../api/adminApi';
import Layout from '../components/Layout';
import { useToast } from '../hooks/ToastContext';

const AuditLogs: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [page, setPage] = useState(1);
  const limit = 15;
  const queryClient = useQueryClient();

  const { data, status, isFetching } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: () => getAuditLogs({ page, limit }).then((res) => res.data),
  });

  const logs = data?.data || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteMutation = useMutation({
    mutationFn: () => deleteAuditLog(deleteId!).then((res) => res.data),
    onSuccess: () => {
      showSuccess('Audit log entry deleted successfully');
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
    onError: () => {
      showError('Failed to delete audit log entry');
    }
  });

  const getActionStyles = (action: string) => {
    const act = action?.toLowerCase() || '';
    if (act.includes('delete')) return 'bg-red-50 text-red-600 border-red-100';
    if (act.includes('create')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (act.includes('update')) return 'bg-blue-50 text-blue-600 border-blue-100';
    if (act.includes('credit') || act.includes('wallet')) return 'bg-purple-50 text-purple-600 border-purple-100';
    if (act.includes('login')) return 'bg-amber-50 text-amber-600 border-amber-100';
    return 'bg-slate-50 text-slate-600 border-slate-100';
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">Audit Registry</h1>
              <p className="text-sm sm:text-lg text-slate-600 font-medium">Immutable record of all administrative operations</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm text-center min-w-[120px]">
                <p className="text-2xl font-black text-green-600 leading-none">{pagination.total}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Logs</p>
              </div>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['audit-logs'] })}
                className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-green-600 transition-all shadow-sm active:scale-95"
              >
                <FiRefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
            {status === 'pending' ? (
              <div className="p-20 text-center space-y-4">
                <div className="relative inline-block">
                  <div className="w-16 h-16 border-4 border-slate-100 border-t-green-600 rounded-full animate-spin"></div>
                  <FiActivity className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-green-600 w-6 h-6" />
                </div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Registry...</p>
              </div>
            ) : status === 'error' ? (
              <div className="p-20 text-center space-y-4">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                  <FiAlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Registry Access Failed</h3>
                <p className="text-slate-500 max-w-xs mx-auto">Unable to establish connection with the audit database.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operation</th>
                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Administrator</th>
                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Target Entity</th>
                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Network Origin</th>
                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timestamp</th>
                        <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {logs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-8 py-20 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <FiTerminal className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No activity recorded</p>
                          </td>
                        </tr>
                      ) : (
                        logs.map((log: any) => (
                          <tr key={log._id || log.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-8 py-5">
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getActionStyles(log.action)}`}>
                                {log.action?.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs">
                                  {log.admin_id?.first_name?.[0]}{log.admin_id?.last_name?.[0]}
                                </div>
                                <div>
                                  <p className="text-sm font-black text-slate-900 leading-tight">
                                    {log.admin_id?.first_name} {log.admin_id?.last_name}
                                  </p>
                                  <p className="text-[10px] font-bold text-slate-400">{log.admin_id?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-2">
                                <FiDatabase className="w-3.5 h-3.5 text-slate-400" />
                                <div>
                                  <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{log.entity_type}</p>
                                  <p className="text-[10px] font-mono text-slate-400">ID: {log.entity_id?.slice(-8)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-500">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                {log.ip_address || '0.0.0.0'}
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                <FiClock className="w-3.5 h-3.5 text-slate-400" />
                                {log.timestamp ? new Date(log.timestamp).toLocaleString(undefined, {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                }) : '—'}
                              </div>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <button
                                onClick={() => setDeleteId(log._id || log.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                title="Purge Log Entry"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="bg-slate-50/50 border-t border-slate-100 px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Page <span className="text-slate-900">{pagination.page}</span> of <span className="text-slate-900">{pagination.pages}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:text-green-600 hover:border-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <FiChevronLeft className="w-4 h-4" />
                      Prev
                    </button>
                    <button
                      className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:text-green-600 hover:border-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                      onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                      disabled={page === pagination.pages}
                    >
                      Next
                      <FiChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-md relative animate-in zoom-in-95 duration-300">
              <button
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-all p-2 hover:bg-slate-50 rounded-xl"
                onClick={() => setDeleteId(null)}
                disabled={deleteMutation.status === 'pending'}
              >
                <FiX className="w-6 h-6" />
              </button>

              <div className="space-y-6">
                <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto">
                  <FiAlertCircle className="w-10 h-10 text-red-500" />
                </div>

                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-black text-slate-900">Purge Entry?</h2>
                  <p className="text-sm text-slate-500 font-medium">This action will permanently remove this activity record from the audit registry.</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all active:scale-95"
                    onClick={() => setDeleteId(null)}
                    disabled={deleteMutation.status === 'pending'}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 px-6 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-xl shadow-red-100 active:scale-95 disabled:opacity-50"
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.status === 'pending'}
                  >
                    {deleteMutation.status === 'pending' ? 'Purging...' : 'Confirm Purge'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AuditLogs;
