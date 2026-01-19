import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/client';
import toast from 'react-hot-toast';

// Transaction types
interface Transaction {
    _id: string;
    type: 'credit' | 'debit';
    category: 'deposit' | 'transfer' | 'withdrawal' | 'refund' | 'fee';
    status: 'pending' | 'success' | 'failed';
    amount: number;
    userId: {
        _id: string;
        email: string;
        firstName: string;
        lastName: string;
        businessName?: string;
    };
    reference: string;
    externalRef?: string;
    narration: string;
    flagged: boolean;
    createdAt: string;
    updatedAt: string;
}

const TransactionsPage: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchTransactions();
    }, [typeFilter, statusFilter]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (typeFilter !== 'all') params.type = typeFilter;
            if (statusFilter !== 'all') params.status = statusFilter;

            const data = await adminApi.getTransactions(params);
            setTransactions(data.transactions || []);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFlag = async (id: string, currentFlagged: boolean) => {
        try {
            setIsActionLoading(true);
            await adminApi.flagTransaction(id, !currentFlagged);
            toast.success(`Transaction ${!currentFlagged ? 'flagged' : 'unflagged'} successfully`);
            fetchTransactions();
            setShowDetails(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update transaction flag');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleVerify = async (id: string) => {
        try {
            setIsActionLoading(true);
            await adminApi.verifyTransaction(id);
            toast.success('Transaction verified manually');
            fetchTransactions();
            setShowDetails(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to verify transaction');
        } finally {
            setIsActionLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            success: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            failed: 'bg-red-100 text-red-800',
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status as keyof typeof badges]}`}>
                {status.toUpperCase()}
            </span>
        );
    };

    const getTypeBadge = (category: string) => {
        const badges = {
            deposit: { text: 'DEPOSIT', color: 'bg-blue-100 text-blue-800' },
            transfer: { text: 'TRANSFER', color: 'bg-purple-100 text-purple-800' },
            withdrawal: { text: 'WITHDRAWAL', color: 'bg-orange-100 text-orange-800' },
            refund: { text: 'REFUND', color: 'bg-pink-100 text-pink-800' },
            fee: { text: 'FEE', color: 'bg-gray-100 text-gray-800' },
        };
        const badge = badges[category as keyof typeof badges] || { text: category.toUpperCase(), color: 'bg-slate-100 text-slate-800' };
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>{badge.text}</span>;
    };

    const formatAmount = (amount: number) => {
        return `₦${(amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
    };

    const filteredTransactions = transactions.filter((txn) => {
        const matchesSearch =
            txn.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
            txn.userId.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (txn.userId.businessName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            txn.narration.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'all' || txn.type === typeFilter;
        const matchesStatus = statusFilter === 'all' || txn.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
    });

    const handleExportCSV = () => {
        // Prepare CSV headers
        const headers = ['Reference', 'External Ref', 'Tenant', 'Email', 'Type', 'Category', 'Amount', 'Status', 'Flagged', 'Narration', 'Date'];

        // Prepare CSV rows
        const rows = filteredTransactions.map(txn => [
            txn.reference,
            txn.externalRef || 'N/A',
            txn.userId.businessName || `${txn.userId.firstName} ${txn.userId.lastName}`,
            txn.userId.email,
            txn.type.toUpperCase(),
            txn.category.toUpperCase(),
            (txn.amount / 100).toFixed(2),
            txn.status.toUpperCase(),
            txn.flagged ? 'Yes' : 'No',
            txn.narration,
            new Date(txn.createdAt).toLocaleString()
        ]);

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900">Transactions & Ledger</h1>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">Source of truth for all money movement</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                        onClick={handleExportCSV}
                        className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm active:scale-95"
                    >
                        Export CSV
                    </button>
                    <button
                        onClick={fetchTransactions}
                        className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm active:scale-95"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs md:text-sm font-medium text-slate-500">Total Transactions</p>
                    <h3 className="text-lg md:text-2xl font-bold text-slate-900 mt-1">{transactions.length}</h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs md:text-sm font-medium text-slate-500">Success Rate</p>
                    <h3 className="text-lg md:text-2xl font-bold text-green-600 mt-1">
                        {transactions.length > 0
                            ? ((transactions.filter((t) => t.status === 'success').length / transactions.length) * 100).toFixed(1)
                            : '0.0'}%
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs md:text-sm font-medium text-slate-500">Pending</p>
                    <h3 className="text-lg md:text-2xl font-bold text-yellow-600 mt-1">
                        {transactions.filter((t) => t.status === 'pending').length}
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs md:text-sm font-medium text-slate-500">Flagged</p>
                    <h3 className="text-lg md:text-2xl font-bold text-red-600 mt-1">
                        {transactions.filter((t) => t.flagged).length}
                    </h3>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="sm:col-span-2 lg:col-span-2">
                        <input
                            type="text"
                            placeholder="Search by reference, tenant, or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    >
                        <option value="all">All Types</option>
                        <option value="deposit">Deposit</option>
                        <option value="transfer">Transfer</option>
                        <option value="dva">DVA</option>
                        <option value="withdrawal">Withdrawal</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="success">Success</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                    </select>
                    <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
                        Date Range
                    </button>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                        <p className="mt-2 text-slate-500">Loading transactions...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] md:min-w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Reference
                                    </th>
                                    <th className="hidden lg:table-cell px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Tenant
                                    </th>
                                    <th className="hidden md:table-cell px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="hidden sm:table-cell px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredTransactions.map((txn) => (
                                    <tr
                                        key={txn._id}
                                        className={`hover:bg-slate-50 transition-colors ${txn.flagged ? 'bg-red-50' : ''}`}
                                    >
                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {txn.flagged && (
                                                    <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                )}
                                                <div>
                                                    <div className="text-sm font-medium text-slate-900">{txn.reference}</div>
                                                    <div className="text-xs text-slate-500 font-mono">{txn.externalRef}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden lg:table-cell px-4 md:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-900">{txn.userId.businessName || `${txn.userId.firstName} ${txn.userId.lastName}`}</div>
                                            <div className="text-xs text-slate-500">{txn.userId.email}</div>
                                        </td>
                                        <td className="hidden md:table-cell px-4 md:px-6 py-4 whitespace-nowrap">{getTypeBadge(txn.category)}</td>
                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-slate-900">{formatAmount(txn.amount)}</div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">{getStatusBadge(txn.status)}</td>
                                        <td className="hidden sm:table-cell px-4 md:px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {new Date(txn.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setSelectedTransaction(txn);
                                                    setShowDetails(true);
                                                }}
                                                className="text-green-600 hover:text-green-900"
                                            >
                                                <span className="hidden sm:inline">View Details</span>
                                                <span className="sm:hidden">View</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Transaction Details Modal */}
            {showDetails && selectedTransaction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Transaction Details</h2>
                                    <p className="text-sm text-slate-500 font-mono mt-1">{selectedTransaction.reference}</p>
                                </div>
                                <button onClick={() => setShowDetails(false)} className="text-slate-400 hover:text-slate-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-6">
                                    {/* Basic Info */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900 mb-3">Transaction Information</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-slate-500">Category</span>
                                                {getTypeBadge(selectedTransaction.category)}
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-slate-500">Status</span>
                                                {getStatusBadge(selectedTransaction.status)}
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-slate-500">Amount</span>
                                                <span className="text-sm font-semibold text-slate-900">
                                                    {formatAmount(selectedTransaction.amount)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-slate-500">Tenant</span>
                                                <span className="text-sm text-slate-900">{selectedTransaction.userId.businessName || `${selectedTransaction.userId.firstName} ${selectedTransaction.userId.lastName}`}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-slate-500">Email</span>
                                                <span className="text-sm text-slate-900">{selectedTransaction.userId.email}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-slate-500">External Ref</span>
                                                <span className="text-sm font-mono text-slate-900">{selectedTransaction.externalRef || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-slate-500">Flagged</span>
                                                <span className={`text-sm font-medium ${selectedTransaction.flagged ? 'text-red-600' : 'text-green-600'}`}>
                                                    {selectedTransaction.flagged ? 'Yes' : 'No'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Narration */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900 mb-2">Narration</h3>
                                        <p className="text-sm text-slate-600">{selectedTransaction.narration}</p>
                                    </div>
                                </div>

                                {/* Right Column - Raw Data (Placeholder) */}
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900 mb-3">Raw Data</h3>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 overflow-x-auto">
                                        <pre className="text-xs text-slate-700">
                                            {JSON.stringify(selectedTransaction, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <button
                                    onClick={() => {
                                        console.log('Raw Payload:', selectedTransaction);
                                        toast.success('Raw payload logged to console');
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                    View Raw Payload
                                </button>
                                <button
                                    onClick={() => handleFlag(selectedTransaction._id, selectedTransaction.flagged)}
                                    disabled={isActionLoading}
                                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium disabled:opacity-50"
                                >
                                    {selectedTransaction.flagged ? 'Unflag' : 'Flag for Review'}
                                </button>
                                <button
                                    onClick={() => handleVerify(selectedTransaction._id)}
                                    disabled={isActionLoading || selectedTransaction.status === 'success'}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                                >
                                    Verify Manually
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionsPage;
