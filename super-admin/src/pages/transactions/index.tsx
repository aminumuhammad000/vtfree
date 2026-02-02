import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getTransactions } from 'api/superAdminApi';

interface Transaction {
  _id: string;
  transaction_id: string;
  type: string;
  amount: number;
  status: string;
  customer_phone: string;
  customer_name?: string;
  app_name: string;
  user_name: string;
  created_at: string;
  commission: number;
}

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [source, setSource] = useState<'local' | 'vtpay'>('local');

  useEffect(() => {
    fetchTransactions();
  }, [source]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await getTransactions({ source });
      if (response.data.success) {
        setTransactions(response.data.data.transactions);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = txn.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.customer_phone.includes(searchTerm) ||
      txn.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.app_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || txn.status === statusFilter;
    const matchesType = typeFilter === 'all' || txn.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'data': return { icon: 'solar:smartphone-2-bold-duotone', color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'airtime': return { icon: 'solar:phone-calling-bold-duotone', color: 'text-purple-600', bg: 'bg-purple-100' };
      case 'bill': return { icon: 'solar:bill-list-bold-duotone', color: 'text-orange-600', bg: 'bg-orange-100' };
      default: return { icon: 'solar:wallet-money-bold-duotone', color: 'text-green-600', bg: 'bg-green-100' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const stats = [
    { label: 'Total Transactions', value: transactions.length, icon: 'solar:bill-list-bold-duotone', color: 'blue' },
    { label: 'Successful', value: transactions.filter(t => t.status === 'success').length, icon: 'solar:check-circle-bold-duotone', color: 'green' },
    { label: 'Total Volume', value: `₦${transactions.filter(t => t.status === 'success').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}`, icon: 'solar:wallet-money-bold-duotone', color: 'purple' },
    { label: 'Commission', value: `₦${transactions.reduce((sum, t) => sum + t.commission, 0).toLocaleString()}`, icon: 'solar:dollar-bold-duotone', color: 'orange' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-500 mt-1">Monitor all platform transactions</p>
        </div>
        <div className="bg-white p-1 rounded-xl border border-slate-200 flex items-center shadow-sm">
          <button
            onClick={() => setSource('local')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${source === 'local' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Local Transactions
          </button>
          <button
            onClick={() => setSource('vtpay')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${source === 'vtpay' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            VTPay Transactions
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className={`bg-white rounded-xl p-5 border border-${stat.color}-100 hover:shadow-lg transition-all`}>
            <div className="flex items-center gap-3">
              <div className={`p-3 bg-${stat.color}-50 rounded-xl`}>
                <Icon icon={stat.icon} width="24" height="24" className={`text-${stat.color}-600`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Icon icon="solar:magnifer-linear" width="20" height="20" className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by ID, phone, customer, or app..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              />
            </div>
          </div>
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            >
              <option value="all">All Types</option>
              <option value="data">Data</option>
              <option value="airtime">Airtime</option>
              <option value="bill">Bill Payment</option>
            </select>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Transaction</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase hidden lg:table-cell">App</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase hidden xl:table-cell">Commission</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase hidden lg:table-cell">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase hidden xl:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center">Loading...</td></tr>
              ) : filteredTransactions.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">No transactions found</td></tr>
              ) : (
                filteredTransactions.map((txn) => {
                  const typeConfig = getTypeIcon(txn.type);
                  return (
                    <tr key={txn._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`${typeConfig.bg} p-2.5 rounded-xl flex-shrink-0`}>
                            <Icon icon={typeConfig.icon} width="20" height="20" className={typeConfig.color} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{txn.transaction_id}</p>
                            <p className="text-xs text-slate-500 uppercase">{txn.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <p className="text-sm font-medium text-slate-900">{txn.customer_name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{txn.customer_phone}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 hidden lg:table-cell">{txn.app_name}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-mono font-bold text-slate-900">₦{txn.amount.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-green-600 font-medium hidden xl:table-cell">
                        ₦{txn.commission.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(txn.status)}`}>
                          {txn.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 hidden xl:table-cell">
                        {new Date(txn.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
