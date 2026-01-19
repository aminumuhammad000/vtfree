import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/client';
import toast from 'react-hot-toast';

interface Settlement {
    _id: string;
    userId: {
        _id: string;
        email: string;
        firstName: string;
        lastName: string;
        businessName?: string;
    };
    amount: number;
    status: 'pending' | 'processing' | 'success' | 'failed';
    category: string;
    reference: string;
    externalRef?: string;
    narration: string;
    createdAt: string;
}

const SettlementsPage: React.FC = () => {
    const [settlements, setSettlements] = useState<Settlement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettlements();
    }, []);

    const fetchSettlements = async () => {
        try {
            setLoading(true);
            const data = await adminApi.getSettlements();
            setSettlements(data);
        } catch (error) {
            console.error('Failed to fetch settlements:', error);
        } finally {
            setLoading(false);
        }
    };
    const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [showManualTrigger, setShowManualTrigger] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);
    const [isTriggering, setIsTriggering] = useState(false);
    const [tenants, setTenants] = useState<any[]>([]);
    const [manualData, setManualData] = useState({
        userId: '',
        amount: '',
        reason: ''
    });

    useEffect(() => {
        if (showManualTrigger) {
            fetchTenants();
        }
    }, [showManualTrigger]);

    const fetchTenants = async () => {
        try {
            const data = await adminApi.getAllTenants();
            setTenants(data || []);
        } catch (error) {
            console.error('Failed to fetch tenants:', error);
        }
    };

    const handleProcess = async (id: string) => {
        try {
            setIsProcessing(true);
            await adminApi.processSettlement(id);
            toast.success('Settlement processing started');
            fetchSettlements();
            setShowDetails(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to process settlement');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRetry = async (id: string) => {
        try {
            setIsRetrying(true);
            await adminApi.retrySettlement(id);
            toast.success('Settlement retried successfully');
            fetchSettlements();
            setShowDetails(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to retry settlement');
        } finally {
            setIsRetrying(false);
        }
    };

    const handleManualTrigger = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualData.userId || !manualData.amount || !manualData.reason) {
            toast.error('Please fill all fields');
            return;
        }
        try {
            setIsTriggering(true);
            await adminApi.manualTriggerSettlement({
                ...manualData,
                amount: parseFloat(manualData.amount) * 100 // Convert to kobo
            });
            toast.success('Manual settlement triggered');
            setShowManualTrigger(false);
            setManualData({ userId: '', amount: '', reason: '' });
            fetchSettlements();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to trigger settlement');
        } finally {
            setIsTriggering(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            success: 'bg-green-100 text-green-800',
            failed: 'bg-red-100 text-red-800',
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status as keyof typeof badges]}`}>
                {status.toUpperCase()}
            </span>
        );
    };

    const formatAmount = (amount: number) => {
        return `₦${(amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900">Settlements & Payouts</h1>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">Control money leaving the system</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => setShowManualTrigger(true)}
                        className="w-full sm:w-auto px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium shadow-sm active:scale-95"
                    >
                        Manual Trigger
                    </button>
                    <button
                        onClick={fetchSettlements}
                        className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm active:scale-95"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs md:text-sm font-medium text-slate-500">Total Pending</p>
                    <h3 className="text-lg md:text-2xl font-bold text-yellow-600 mt-1">
                        {formatAmount(settlements.filter((s) => s.status === 'pending').reduce((sum, s) => sum + s.amount, 0))}
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs md:text-sm font-medium text-slate-500">Processing</p>
                    <h3 className="text-lg md:text-2xl font-bold text-blue-600 mt-1">
                        {settlements.filter((s) => s.status === 'processing').length}
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs md:text-sm font-medium text-slate-500">Completed (Today)</p>
                    <h3 className="text-lg md:text-2xl font-bold text-green-600 mt-1">
                        {settlements.filter((s) => s.status === 'success').length}
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs md:text-sm font-medium text-slate-500">Failed</p>
                    <h3 className="text-lg md:text-2xl font-bold text-red-600 mt-1">
                        {settlements.filter((s) => s.status === 'failed').length}
                    </h3>
                </div>
            </div>

            {/* Settlements Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                        <p className="mt-2 text-slate-500">Loading settlements...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] md:min-w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Reference
                                    </th>
                                    <th className="hidden lg:table-cell px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Tenant
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
                                {settlements.map((settlement) => (
                                    <tr key={settlement._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">{settlement.reference}</div>
                                            <div className="text-xs text-slate-500">{settlement.externalRef}</div>
                                        </td>
                                        <td className="hidden lg:table-cell px-4 md:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-900">{settlement.userId.businessName || `${settlement.userId.firstName} ${settlement.userId.lastName}`}</div>
                                            <div className="text-xs text-slate-500">{settlement.userId.email}</div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-slate-900">{formatAmount(settlement.amount)}</div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">{getStatusBadge(settlement.status)}</td>
                                        <td className="hidden sm:table-cell px-4 md:px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {new Date(settlement.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    onClick={() => {
                                                        setSelectedSettlement(settlement);
                                                        setShowDetails(true);
                                                    }}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    View
                                                </button>
                                                {settlement.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleProcess(settlement._id)}
                                                        disabled={isProcessing}
                                                        className="text-yellow-600 hover:text-yellow-900 hidden sm:inline disabled:opacity-50"
                                                    >
                                                        {isProcessing ? '...' : 'Process Now'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Settlement Details Modal */}
            {showDetails && selectedSettlement && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Settlement Details</h2>
                                    <p className="text-sm text-slate-500 mt-1">{selectedSettlement.reference}</p>
                                </div>
                                <button onClick={() => setShowDetails(false)} className="text-slate-400 hover:text-slate-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500">Tenant</p>
                                    <p className="text-sm text-slate-900 mt-1">{selectedSettlement.userId.businessName || `${selectedSettlement.userId.firstName} ${selectedSettlement.userId.lastName}`}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Email</p>
                                    <p className="text-sm text-slate-900 mt-1">{selectedSettlement.userId.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Amount</p>
                                    <p className="text-sm font-semibold text-slate-900 mt-1">
                                        {formatAmount(selectedSettlement.amount)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Status</p>
                                    <div className="mt-1">{getStatusBadge(selectedSettlement.status)}</div>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs text-slate-500">Narration</p>
                                    <p className="text-sm text-slate-900 mt-1">{selectedSettlement.narration}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Created Date</p>
                                    <p className="text-sm text-slate-900 mt-1">
                                        {new Date(selectedSettlement.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">External Reference</p>
                                    <p className="text-sm font-mono text-slate-900 mt-1">{selectedSettlement.externalRef || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-200">
                                {selectedSettlement.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleProcess(selectedSettlement._id)}
                                            disabled={isProcessing}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                                        >
                                            {isProcessing ? 'Processing...' : 'Approve & Process'}
                                        </button>
                                        <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                                            Pause
                                        </button>
                                    </>
                                )}
                                {selectedSettlement.status === 'failed' && (
                                    <button
                                        onClick={() => handleRetry(selectedSettlement._id)}
                                        disabled={isRetrying}
                                        className="sm:col-span-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium disabled:opacity-50"
                                    >
                                        {isRetrying ? 'Retrying...' : 'Retry Settlement'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Trigger Modal */}
            {showManualTrigger && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="p-6 border-b border-slate-200 bg-yellow-50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Manual Settlement Trigger</h2>
                                    <p className="text-sm text-yellow-700 mt-1">⚠️ This action requires justification</p>
                                </div>
                                <button onClick={() => setShowManualTrigger(false)} className="text-slate-400 hover:text-slate-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleManualTrigger} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tenant</label>
                                <select
                                    required
                                    value={manualData.userId}
                                    onChange={(e) => setManualData({ ...manualData, userId: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white text-slate-900"
                                >
                                    <option value="">Select tenant...</option>
                                    {tenants.map(tenant => (
                                        <option key={tenant._id} value={tenant._id}>
                                            {tenant.businessName || `${tenant.firstName} ${tenant.lastName}`} ({tenant.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₦)</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={manualData.amount}
                                    onChange={(e) => setManualData({ ...manualData, amount: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white text-slate-900"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Reason (Required)</label>
                                <textarea
                                    required
                                    value={manualData.reason}
                                    onChange={(e) => setManualData({ ...manualData, reason: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white text-slate-900"
                                    rows={3}
                                    placeholder="Provide justification for manual settlement..."
                                ></textarea>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowManualTrigger(false)}
                                    className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                                    disabled={isTriggering}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isTriggering}
                                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                                >
                                    {isTriggering ? 'Triggering...' : 'Trigger Settlement'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettlementsPage;
