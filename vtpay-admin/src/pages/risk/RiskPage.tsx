import React, { useState, useEffect } from 'react';

interface RiskRule {
    _id: string;
    name: string;
    type: 'velocity' | 'amount_limit' | 'blacklist' | 'whitelist' | 'geo_block';
    condition: string;
    action: 'block' | 'flag' | 'review';
    priority: number;
    status: 'active' | 'inactive';
    hits: number;
    lastTriggered?: string;
}

const RiskPage: React.FC = () => {
    const [rules, setRules] = useState<RiskRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedRule, setSelectedRule] = useState<RiskRule | null>(null);

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            setLoading(true);
            // Mock data
            const mockRules: RiskRule[] = [
                {
                    _id: '1',
                    name: 'High Velocity Transfer',
                    type: 'velocity',
                    condition: '> 5 transactions in 1 hour',
                    action: 'flag',
                    priority: 1,
                    status: 'active',
                    hits: 24,
                    lastTriggered: '2024-12-17T14:30:00Z',
                },
                {
                    _id: '2',
                    name: 'Large Transaction Block',
                    type: 'amount_limit',
                    condition: '> ₦5,000,000',
                    action: 'review',
                    priority: 2,
                    status: 'active',
                    hits: 5,
                    lastTriggered: '2024-12-16T09:15:00Z',
                },
                {
                    _id: '3',
                    name: 'Blacklisted IP Range',
                    type: 'blacklist',
                    condition: 'IP in 192.168.x.x',
                    action: 'block',
                    priority: 3,
                    status: 'active',
                    hits: 142,
                    lastTriggered: '2024-12-17T15:10:00Z',
                },
                {
                    _id: '4',
                    name: 'Suspicious Device',
                    type: 'blacklist',
                    condition: 'Device ID in blacklist',
                    action: 'block',
                    priority: 2,
                    status: 'inactive',
                    hits: 0,
                },
            ];
            setRules(mockRules);
        } catch (error) {
            console.error('Failed to fetch risk rules:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionBadge = (action: string) => {
        const badges = {
            block: 'bg-red-100 text-red-800',
            flag: 'bg-yellow-100 text-yellow-800',
            review: 'bg-blue-100 text-blue-800',
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[action as keyof typeof badges]}`}>
                {action.toUpperCase()}
            </span>
        );
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Risk Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Configure fraud detection and risk controls</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                    + Add Risk Rule
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Active Rules</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">
                        {rules.filter(r => r.status === 'active').length}
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Flagged Today</p>
                    <h3 className="text-2xl font-bold text-yellow-600 mt-1">12</h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Blocked Today</p>
                    <h3 className="text-2xl font-bold text-red-600 mt-1">45</h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Under Review</p>
                    <h3 className="text-2xl font-bold text-blue-600 mt-1">8</h3>
                </div>
            </div>

            {/* Rules Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900">Risk Rules</h3>
                </div>
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                        <p className="mt-2 text-slate-500">Loading rules...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rule Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Hits</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {rules.map((rule) => (
                                    <tr key={rule._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">{rule.name}</div>
                                            <div className="text-xs text-slate-500">{rule.condition}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 capitalize">
                                            {rule.type.replace('_', ' ')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getActionBadge(rule.action)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {rule.priority}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {rule.hits}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${rule.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {rule.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setSelectedRule(rule);
                                                    setShowCreateModal(true);
                                                }}
                                                className="text-green-600 hover:text-green-900 mr-3"
                                            >
                                                Edit
                                            </button>
                                            <button className="text-slate-600 hover:text-slate-900">
                                                Logs
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
                                    {selectedRule ? 'Edit Risk Rule' : 'Create Risk Rule'}
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setSelectedRule(null);
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
                                    defaultValue={selectedRule?.name}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="e.g., High Velocity Check"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                                    <select
                                        defaultValue={selectedRule?.type || 'velocity'}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="velocity">Velocity</option>
                                        <option value="amount_limit">Amount Limit</option>
                                        <option value="blacklist">Blacklist</option>
                                        <option value="whitelist">Whitelist</option>
                                        <option value="geo_block">Geo Block</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Action</label>
                                    <select
                                        defaultValue={selectedRule?.action || 'flag'}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="flag">Flag</option>
                                        <option value="review">Review</option>
                                        <option value="block">Block</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
                                <input
                                    type="text"
                                    defaultValue={selectedRule?.condition}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="e.g., > 5 transactions in 1 hour"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                                    <input
                                        type="number"
                                        defaultValue={selectedRule?.priority || 1}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                    <select
                                        defaultValue={selectedRule?.status || 'active'}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setSelectedRule(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    {selectedRule ? 'Update Rule' : 'Create Rule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RiskPage;
