import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/client';

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
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Settlements & Payouts</h1>
                    <p className="text-sm text-slate-500 mt-1">Control money leaving the system</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowManualTrigger(true)}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                    >
                        Manual Trigger
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Total Pending</p>
                    <h3 className="text-2xl font-bold text-yellow-600 mt-1">
                        {formatAmount(settlements.filter((s) => s.status === 'pending').reduce((sum, s) => sum + s.amount, 0))}
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Processing</p>
                    <h3 className="text-2xl font-bold text-blue-600 mt-1">
                        {settlements.filter((s) => s.status === 'processing').length}
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Completed (Today)</p>
                    <h3 className="text-2xl font-bold text-green-600 mt-1">
                        {settlements.filter((s) => s.status === 'success').length}
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Failed</p>
                    <h3 className="text-2xl font-bold text-red-600 mt-1">
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
                                {settlements.map((settlement) => (
                                    <tr key={settlement._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">{settlement.reference}</div>
                                            <div className="text-xs text-slate-500">{settlement.externalRef}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-900">{settlement.userId.businessName || `${settlement.userId.firstName} ${settlement.userId.lastName}`}</div>
                                            <div className="text-xs text-slate-500">{settlement.userId.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-slate-900">{formatAmount(settlement.amount)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(settlement.status)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {new Date(settlement.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setSelectedSettlement(settlement);
                                                    setShowDetails(true);
                                                }}
                                                className="text-green-600 hover:text-green-900 mr-3"
                                            >
                                                View
                                            </button>
                                            {settlement.status === 'pending' && (
                                                <button className="text-yellow-600 hover:text-yellow-900">Process Now</button>
                                            )}
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
                            <div className="grid grid-cols-2 gap-4">
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
                                <div className="col-span-2">
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

                            <div className="flex gap-3 pt-4 border-t border-slate-200">
                                {selectedSettlement.status === 'pending' && (
                                    <>
                                        <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                            Approve & Process
                                        </button>
                                        <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                                            Pause
                                        </button>
                                    </>
                                )}
                                {selectedSettlement.status === 'failed' && (
                                    <button className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                                        Retry Settlement
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

                        <form className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tenant</label>
                                <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500">
                                    <option>Select tenant...</option>
                                    <option>ABC Corp</option>
                                    <option>XYZ Ltd</option>
                                    <option>DEF Inc</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₦)</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Reason (Required)</label>
                                <textarea
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    rows={3}
                                    placeholder="Provide justification for manual settlement..."
                                ></textarea>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowManualTrigger(false)}
                                    className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                                >
                                    Trigger Settlement
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
