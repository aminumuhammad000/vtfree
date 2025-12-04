import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import TransactionViewModal from '../components/TransactionViewModal';
import { getTransactions } from '../api/adminApi';

const Transactions: React.FC = () => {
  const [page, setPage] = useState(1);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [viewTransaction, setViewTransaction] = useState<any | null>(null);
  const limit = 20;

  const params: any = { page, limit };
  if (statusFilter) params.status = statusFilter;
  if (typeFilter) params.type = typeFilter;

  const { data, status } = useQuery({
    queryKey: ['transactions', page, statusFilter, typeFilter],
    queryFn: () => getTransactions(params).then((res: any) => res.data),
  });

  const transactions = data?.data || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'airtime':
        return 'bg-blue-100 text-blue-800';
      case 'data':
        return 'bg-purple-100 text-purple-800';
      case 'electricity':
        return 'bg-yellow-100 text-yellow-800';
      case 'cable':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
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
                  <h1 className="text-4xl font-bold text-slate-900 mb-2">Transactions</h1>
                  <p className="text-slate-600">Monitor all platform transactions</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-600">{pagination.total}</p>
                  <p className="text-sm text-slate-600">Total Transactions</p>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 font-medium"
                    >
                      <option value="">All Status</option>
                      <option value="success">Success</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => {
                        setTypeFilter(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 font-medium"
                    >
                      <option value="">All Types</option>
                      <option value="airtime">Airtime</option>
                      <option value="data">Data</option>
                      <option value="electricity">Electricity</option>
                      <option value="cable">Cable TV</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setStatusFilter('');
                        setTypeFilter('');
                        setPage(1);
                      }}
                      className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2.5 rounded-lg transition font-medium"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {status === 'pending' && (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin">
                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <p className="mt-4 text-slate-600">Loading transactions...</p>
                </div>
              )}
              {status === 'error' && (
                <div className="p-12 text-center bg-red-50">
                  <svg className="w-12 h-12 text-red-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-700 font-medium">Failed to load transactions</p>
                </div>
              )}
              {status === 'success' && (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Transaction ID</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">User</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Type</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Amount</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Date</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {transactions.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                              <svg className="w-12 h-12 mx-auto mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              <p className="font-medium">No transactions found</p>
                            </td>
                          </tr>
                        )}
                        {transactions.map((txn: any) => (
                          <tr key={txn._id || txn.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-mono text-sm text-slate-900">{txn.reference || txn._id}</p>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-slate-900">{txn.user?.first_name} {txn.user?.last_name}</p>
                                <p className="text-xs text-slate-500">{txn.user?.email}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(txn.type)}`}>
                                {txn.type?.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-900">₦{txn.amount?.toLocaleString()}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(txn.status)}`}>
                                <span className="w-2 h-2 rounded-full bg-current"></span>
                                {txn.status?.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-700">
                              {txn.created_at ? new Date(txn.created_at).toLocaleString() : '—'}
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => setViewTransaction(txn)}
                                className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                                title="View Details"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

          {/* Transaction View Modal */}
          {viewTransaction && (
            <TransactionViewModal
              transaction={viewTransaction}
              onClose={() => setViewTransaction(null)}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default Transactions;
