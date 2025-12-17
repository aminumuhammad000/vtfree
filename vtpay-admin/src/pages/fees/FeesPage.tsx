import React, { useState, useEffect } from 'react';

interface FeeRule {
    _id: string;
    name: string;
    type: 'flat' | 'percentage' | 'tiered';
    value: number;
    currency: string;
    minAmount?: number;
    maxAmount?: number;
    cap?: number; // For percentage fees
    category: 'deposit' | 'transfer' | 'withdrawal' | 'utility';
    paymentMethod?: string;
    status: 'active' | 'inactive';
    createdAt: string;
}

const FeesPage: React.FC = () => {
    const [fees, setFees] = useState<FeeRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedFee, setSelectedFee] = useState<FeeRule | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>('all');

    useEffect(() => {
        fetchFees();
    }, []);

    const fetchFees = async () => {
        try {
            setLoading(true);
            // Mock data
            const mockFees: FeeRule[] = [
                {
                    _id: '1',
                    name: 'Standard Bank Transfer',
                    type: 'flat',
                    value: 50,
                    currency: 'NGN',
                    category: 'transfer',
                    status: 'active',
                    createdAt: '2024-01-10T09:00:00Z',
                },
                {
                    _id: '2',
                    name: 'Card Deposit Fee',
                    type: 'percentage',
                    value: 1.5,
                    currency: 'NGN',
                    cap: 2000,
                    category: 'deposit',
                    paymentMethod: 'card',
                    status: 'active',
                    createdAt: '2024-01-12T14:30:00Z',
                },
                {
                    _id: '3',
                    name: 'Utility Bill Charge',
                    type: 'flat',
                    value: 100,
                    currency: 'NGN',
                    category: 'utility',
                    status: 'active',
                    createdAt: '2024-02-05T11:15:00Z',
                },
                {
                    _id: '4',
                    name: 'High Value Withdrawal',
                    type: 'percentage',
                    value: 0.5,
                    currency: 'NGN',
                    minAmount: 1000000,
                    category: 'withdrawal',
                    status: 'inactive',
                    createdAt: '2024-03-20T16:45:00Z',
                },
            ];
            setFees(mockFees);
        } catch (error) {
            console.error('Failed to fetch fees:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryBadge = (category: string) => {
        const badges = {
            deposit: 'bg-green-100 text-green-800',
            transfer: 'bg-blue-100 text-blue-800',
            withdrawal: 'bg-orange-100 text-orange-800',
            utility: 'bg-purple-100 text-purple-800',
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[category as keyof typeof badges] || 'bg-gray-100 text-gray-800'}`}>
                {category.toUpperCase()}
            </span>
        );
    };

    const filteredFees = fees.filter(fee =>
        filterCategory === 'all' || fee.category === filterCategory
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Fee Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Configure transaction fees and charges</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                    + Add Fee Rule
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Active Rules</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">
                        {fees.filter(f => f.status === 'active').length}
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Deposit Rules</p>
                    <h3 className="text-2xl font-bold text-green-600 mt-1">
                        {fees.filter(f => f.category === 'deposit').length}
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Transfer Rules</p>
                    <h3 className="text-2xl font-bold text-blue-600 mt-1">
                        {fees.filter(f => f.category === 'transfer').length}
                    </h3>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex gap-4">
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="all">All Categories</option>
                        <option value="deposit">Deposit</option>
                        <option value="transfer">Transfer</option>
                        <option value="withdrawal">Withdrawal</option>
                        <option value="utility">Utility</option>
                    </select>
                </div>
            </div>

            {/* Fees Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                        <p className="mt-2 text-slate-500">Loading fees...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Value</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Conditions</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredFees.map((fee) => (
                                    <tr key={fee._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">{fee.name}</div>
                                            {fee.paymentMethod && (
                                                <div className="text-xs text-slate-500">Method: {fee.paymentMethod}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getCategoryBadge(fee.category)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 capitalize">
                                            {fee.type}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-bold text-slate-900">
                                                {fee.type === 'percentage' ? `${fee.value}%` : `₦${fee.value}`}
                                            </span>
                                            {fee.cap && (
                                                <div className="text-xs text-slate-500">Cap: ₦{fee.cap}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {fee.minAmount ? `Min: ₦${fee.minAmount}` : 'No min'}
                                            <br />
                                            {fee.maxAmount ? `Max: ₦${fee.maxAmount}` : 'No max'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${fee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {fee.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setSelectedFee(fee);
                                                    setShowCreateModal(true);
                                                }}
                                                className="text-green-600 hover:text-green-900 mr-3"
                                            >
                                                Edit
                                            </button>
                                            <button className="text-red-600 hover:text-red-900">
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                        <div className="p-6 border-b border-slate-200">
                            <div className="flex justify-between items-start">
                                <h2 className="text-xl font-bold text-slate-900">
                                    {selectedFee ? 'Edit Fee Rule' : 'Create Fee Rule'}
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setSelectedFee(null);
                                    }}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <form className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Rule Name</label>
                                <input
                                    type="text"
                                    defaultValue={selectedFee?.name}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="e.g., Standard Transfer Fee"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                    <select
                                        defaultValue={selectedFee?.category || 'transfer'}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="deposit">Deposit</option>
                                        <option value="transfer">Transfer</option>
                                        <option value="withdrawal">Withdrawal</option>
                                        <option value="utility">Utility</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                                    <select
                                        defaultValue={selectedFee?.type || 'flat'}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="flat">Flat Amount</option>
                                        <option value="percentage">Percentage</option>
                                        <option value="tiered">Tiered</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Value</label>
                                    <input
                                        type="number"
                                        defaultValue={selectedFee?.value}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Cap (Optional)</label>
                                    <input
                                        type="number"
                                        defaultValue={selectedFee?.cap}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="Max fee amount"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setSelectedFee(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    {selectedFee ? 'Update Rule' : 'Create Rule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeesPage;
