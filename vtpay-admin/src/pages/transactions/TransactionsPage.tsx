import React, { useState, useEffect } from 'react';

// Transaction types
interface Transaction {
    _id: string;
    type: 'deposit' | 'transfer' | 'dva' | 'withdrawal';
    status: 'pending' | 'success' | 'failed';
    amount: number;
    tenantId: string;
    tenantName: string;
    reference: string;
    zainpayReference?: string;
    description: string;
    zainboxCode: string;
    rawPayload?: any;
    normalizedData?: any;
    statusHistory: {
        status: string;
        timestamp: string;
        note?: string;
    }[];
    flagged: boolean;
    createdAt: string;
    updatedAt: string;
}

const TransactionsPage: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            // Mock data - replace with actual API call
            const mockTransactions: Transaction[] = [
                {
                    _id: '1',
                    type: 'deposit',
                    status: 'success',
                    amount: 50000,
                    tenantId: '1',
                    tenantName: 'ABC Corp',
                    reference: 'TXN-DEP-001',
                    zainpayReference: 'ZP-DEP-123456',
                    description: 'Customer deposit via bank transfer',
                    zainboxCode: 'ZBX_ABC123',
                    flagged: false,
                    statusHistory: [
                        { status: 'pending', timestamp: '2024-12-17T10:00:00Z', note: 'Transaction initiated' },
                        { status: 'success', timestamp: '2024-12-17T10:02:30Z', note: 'Payment confirmed' },
                    ],
                    createdAt: '2024-12-17T10:00:00Z',
                    updatedAt: '2024-12-17T10:02:30Z',
                },
                {
                    _id: '2',
                    type: 'transfer',
                    status: 'success',
                    amount: 25000,
                    tenantId: '2',
                    tenantName: 'XYZ Ltd',
                    reference: 'TXN-TRF-002',
                    zainpayReference: 'ZP-TRF-789012',
                    description: 'Payout to customer account',
                    zainboxCode: 'ZBX_XYZ456',
                    flagged: false,
                    statusHistory: [
                        { status: 'pending', timestamp: '2024-12-17T11:15:00Z', note: 'Transfer initiated' },
                        { status: 'success', timestamp: '2024-12-17T11:17:45Z', note: 'Transfer completed' },
                    ],
                    createdAt: '2024-12-17T11:15:00Z',
                    updatedAt: '2024-12-17T11:17:45Z',
                },
                {
                    _id: '3',
                    type: 'deposit',
                    status: 'failed',
                    amount: 75000,
                    tenantId: '3',
                    tenantName: 'DEF Inc',
                    reference: 'TXN-DEP-003',
                    zainpayReference: 'ZP-DEP-345678',
                    description: 'Failed deposit attempt',
                    zainboxCode: 'ZBX_DEF789',
                    flagged: true,
                    statusHistory: [
                        { status: 'pending', timestamp: '2024-12-17T09:30:00Z', note: 'Transaction initiated' },
                        { status: 'failed', timestamp: '2024-12-17T09:32:15Z', note: 'Insufficient funds' },
                    ],
                    createdAt: '2024-12-17T09:30:00Z',
                    updatedAt: '2024-12-17T09:32:15Z',
                },
                {
                    _id: '4',
                    type: 'dva',
                    status: 'success',
                    amount: 100000,
                    tenantId: '1',
                    tenantName: 'ABC Corp',
                    reference: 'TXN-DVA-004',
                    zainpayReference: 'ZP-DVA-901234',
                    description: 'Dynamic virtual account payment',
                    zainboxCode: 'ZBX_ABC123',
                    flagged: false,
                    statusHistory: [
                        { status: 'pending', timestamp: '2024-12-17T13:00:00Z', note: 'DVA payment received' },
                        { status: 'success', timestamp: '2024-12-17T13:01:20Z', note: 'Payment verified' },
                    ],
                    createdAt: '2024-12-17T13:00:00Z',
                    updatedAt: '2024-12-17T13:01:20Z',
                },
                {
                    _id: '5',
                    type: 'transfer',
                    status: 'pending',
                    amount: 30000,
                    tenantId: '2',
                    tenantName: 'XYZ Ltd',
                    reference: 'TXN-TRF-005',
                    zainpayReference: 'ZP-TRF-567890',
                    description: 'Pending transfer to vendor',
                    zainboxCode: 'ZBX_XYZ456',
                    flagged: false,
                    statusHistory: [
                        { status: 'pending', timestamp: '2024-12-17T14:45:00Z', note: 'Transfer processing' },
                    ],
                    createdAt: '2024-12-17T14:45:00Z',
                    updatedAt: '2024-12-17T14:45:00Z',
                },
            ];
            setTransactions(mockTransactions);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setLoading(false);
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

    const getTypeBadge = (type: string) => {
        const badges = {
            deposit: { text: 'DEPOSIT', color: 'bg-blue-100 text-blue-800' },
            transfer: { text: 'TRANSFER', color: 'bg-purple-100 text-purple-800' },
            dva: { text: 'DVA', color: 'bg-indigo-100 text-indigo-800' },
            withdrawal: { text: 'WITHDRAWAL', color: 'bg-orange-100 text-orange-800' },
        };
        const badge = badges[type as keyof typeof badges];
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>{badge.text}</span>;
    };

    const formatAmount = (amount: number) => {
        return `₦${(amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
    };

    const filteredTransactions = transactions.filter((txn) => {
        const matchesSearch =
            txn.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
            txn.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            txn.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'all' || txn.type === typeFilter;
        const matchesStatus = statusFilter === 'all' || txn.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
    });

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Transactions & Ledger</h1>
                    <p className="text-sm text-slate-500 mt-1">Source of truth for all money movement</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
                        Export CSV
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Total Transactions</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{transactions.length}</h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Success Rate</p>
                    <h3 className="text-2xl font-bold text-green-600 mt-1">
                        {((transactions.filter((t) => t.status === 'success').length / transactions.length) * 100).toFixed(1)}%
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Pending</p>
                    <h3 className="text-2xl font-bold text-yellow-600 mt-1">
                        {transactions.filter((t) => t.status === 'pending').length}
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Flagged</p>
                    <h3 className="text-2xl font-bold text-red-600 mt-1">
                        {transactions.filter((t) => t.flagged).length}
                    </h3>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="lg:col-span-2">
                        <input
                            type="text"
                            placeholder="Search by reference, tenant, or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Reference
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Tenant
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
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
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {txn.flagged && (
                                                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                )}
                                                <div>
                                                    <div className="text-sm font-medium text-slate-900">{txn.reference}</div>
                                                    <div className="text-xs text-slate-500 font-mono">{txn.zainpayReference}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-900">{txn.tenantName}</div>
                                            <div className="text-xs text-slate-500">{txn.zainboxCode}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">{getTypeBadge(txn.type)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-slate-900">{formatAmount(txn.amount)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(txn.status)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {new Date(txn.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setSelectedTransaction(txn);
                                                    setShowDetails(true);
                                                }}
                                                className="text-green-600 hover:text-green-900"
                                            >
                                                View Details
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
                                                <span className="text-sm text-slate-500">Type</span>
                                                {getTypeBadge(selectedTransaction.type)}
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
                                                <span className="text-sm text-slate-900">{selectedTransaction.tenantName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-slate-500">Zainbox</span>
                                                <span className="text-sm font-mono text-slate-900">{selectedTransaction.zainboxCode}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-slate-500">Flagged</span>
                                                <span className={`text-sm font-medium ${selectedTransaction.flagged ? 'text-red-600' : 'text-green-600'}`}>
                                                    {selectedTransaction.flagged ? 'Yes' : 'No'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900 mb-2">Description</h3>
                                        <p className="text-sm text-slate-600">{selectedTransaction.description}</p>
                                    </div>
                                </div>

                                {/* Right Column - Status Timeline */}
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900 mb-3">Status Timeline</h3>
                                    <div className="space-y-4">
                                        {selectedTransaction.statusHistory.map((history, index) => (
                                            <div key={index} className="flex gap-3">
                                                <div className="flex flex-col items-center">
                                                    <div
                                                        className={`w-3 h-3 rounded-full ${history.status === 'success'
                                                            ? 'bg-green-500'
                                                            : history.status === 'failed'
                                                                ? 'bg-red-500'
                                                                : 'bg-yellow-500'
                                                            }`}
                                                    ></div>
                                                    {index < selectedTransaction.statusHistory.length - 1 && (
                                                        <div className="w-0.5 h-12 bg-slate-200"></div>
                                                    )}
                                                </div>
                                                <div className="flex-1 pb-4">
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-sm font-medium text-slate-900 capitalize">{history.status}</span>
                                                        <span className="text-xs text-slate-500">
                                                            {new Date(history.timestamp).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    {history.note && <p className="text-xs text-slate-600 mt-1">{history.note}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 pt-6 border-t border-slate-200 flex gap-3">
                                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                    View Raw Payload
                                </button>
                                <button className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                                    {selectedTransaction.flagged ? 'Unflag' : 'Flag for Review'}
                                </button>
                                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
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
