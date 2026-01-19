import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { FiRefreshCw, FiEye, FiFilter, FiX } from 'react-icons/fi';
import { getTransactions } from '../api/adminApi';
import Layout from '../components/Layout';
import TransactionViewModal from '../components/TransactionViewModal';
import { useToast } from '../hooks/ToastContext';

const Transactions: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [viewTransaction, setViewTransaction] = useState<any | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const limit = 20;

  const params: any = { page, limit };
  if (statusFilter) params.status = statusFilter;
  if (typeFilter) params.type = typeFilter;

  const { data, status, refetch } = useQuery({
    queryKey: ['transactions', page, statusFilter, typeFilter],
    queryFn: () => getTransactions(params).then((res: any) => res.data),
  });

  const transactions = data?.data || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      showSuccess('Transactions updated');
    } catch (err) {
      showError('Failed to refresh transactions');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'completed':
      case 'successful':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'airtime_topup':
        return 'bg-emerald-100 text-emerald-700';
      case 'data_purchase':
        return 'bg-indigo-100 text-indigo-700';
      case 'bill_payment':
        return 'bg-amber-100 text-amber-700';
      case 'wallet_topup':
        return 'bg-blue-100 text-blue-700';
      case 'e-pin_purchase':
        return 'bg-rose-100 text-rose-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <Layout>
      <div className="p-3 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-2 tracking-tight">Transactions</h1>
              <p className="text-sm sm:text-lg text-slate-600 font-medium">Monitor and manage all platform activities</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50 group"
              >
                <FiRefreshCw className={`w-4 h-4 text-green-600 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <div className="flex-1 sm:flex-none relative bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-md px-4 py-2 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 bg-white/10 rounded-full blur-xl"></div>
                <div className="relative">
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-100 opacity-80">Total</p>
                  <p className="text-xl font-black">{pagination.total.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FiFilter className="text-slate-400" />
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Filter Transactions</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-bold text-slate-700"
                >
                  <option value="">All Statuses</option>
                  <option value="successful">Success</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Transaction Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-bold text-slate-700"
                >
                  <option value="">All Types</option>
                  <option value="airtime_topup">Airtime</option>
                  <option value="data_purchase">Data</option>
                  <option value="bill_payment">Bill Payment</option>
                  <option value="wallet_topup">Wallet Topup</option>
                  <option value="e-pin_purchase">E-Pin</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setStatusFilter('');
                    setTypeFilter('');
                    setPage(1);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-3 rounded-xl transition-all font-bold"
                >
                  <FiX />
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">Recent Transactions</h2>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider">Live Feed</span>
              </div>
            </div>

            {status === 'pending' && (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent mb-4"></div>
                <p className="text-slate-500 font-medium">Loading transactions...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4">
                  <FiX className="w-6 h-6" />
                </div>
                <p className="text-red-500 font-medium">Failed to load transactions.</p>
              </div>
            )}

            {status === 'success' && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Transaction</th>
                        <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">User</th>
                        <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Type</th>
                        <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
                        <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic">No transactions found matching your filters.</td>
                        </tr>
                      )}
                      {transactions.map((txn: any) => (
                        <tr key={txn._id || txn.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-tighter mb-0.5">#{txn.reference?.slice(-8) || txn._id?.slice(-8)}</span>
                              <span className="text-sm font-bold text-slate-900 truncate max-w-[120px] sm:max-w-none">{txn.reference || txn._id}</span>
                              <div className="md:hidden mt-1">
                                <span className="text-[10px] font-medium text-slate-500">{txn.user?.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900">{txn.user?.first_name} {txn.user?.last_name}</span>
                              <span className="text-xs font-medium text-slate-500">{txn.user?.email}</span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getTypeColor(txn.type)}`}>
                              {txn.type?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <span className="text-sm sm:text-base font-black text-slate-900">₦{txn.amount?.toLocaleString()}</span>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(txn.status)}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                              {txn.status}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 hidden lg:table-cell">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-700">{txn.created_at ? new Date(txn.created_at).toLocaleDateString() : '—'}</span>
                              <span className="text-[10px] font-medium text-slate-400">{txn.created_at ? new Date(txn.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-right">
                            <button
                              onClick={() => setViewTransaction(txn)}
                              className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                              title="View Details"
                            >
                              <FiEye className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Section */}
                <div className="p-4 sm:p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs sm:text-sm font-bold text-slate-500">
                    Showing <span className="text-slate-900">{transactions.length}</span> of <span className="text-slate-900">{pagination.total}</span> transactions
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1 px-2">
                      <span className="text-xs font-bold text-slate-900">{page}</span>
                      <span className="text-xs font-bold text-slate-400">/</span>
                      <span className="text-xs font-bold text-slate-400">{pagination.pages}</span>
                    </div>
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                      disabled={page === pagination.pages}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Modals */}
        {viewTransaction && (
          <TransactionViewModal
            transaction={viewTransaction}
            onClose={() => setViewTransaction(null)}
          />
        )}
      </div>
    </Layout>
  );
};

export default Transactions;
