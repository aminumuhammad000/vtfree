import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/client';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const data = await adminApi.getStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
        }).format(amount / 100);
    };

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                <p className="mt-2 text-slate-500">Loading dashboard metrics...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Payment Operations Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-1">Real-time financial monitoring and control</p>
                </div>
                <button
                    onClick={fetchStats}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                    Refresh Data
                </button>
            </div>

            {/* Critical Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Inflow */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Inflow (Today)</p>
                            <h3 className="text-2xl font-bold text-green-600 mt-2">
                                {formatCurrency(stats?.transactions?.totalInflow || 0)}
                            </h3>
                            <p className="text-xs text-green-600 mt-1">Live from server</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Total Outflow */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Outflow (Today)</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-2">
                                {formatCurrency(stats?.transactions?.totalOutflow || 0)}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Live from server</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Pending Transactions */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Pending Transactions</p>
                            <h3 className="text-2xl font-bold text-yellow-600 mt-2">
                                {stats?.transactions?.pendingCount || 0}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Needs processing</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Failed Transactions */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Failed Transactions</p>
                            <h3 className="text-2xl font-bold text-red-600 mt-2">
                                {stats?.transactions?.failedCount || 0}
                            </h3>
                            <p className="text-xs text-red-600 mt-1">Needs attention</p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* System Health Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Tenants */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Tenants Overview</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Total Tenants</span>
                            <span className="text-sm font-semibold text-slate-900">{stats?.tenants?.total || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Active</span>
                            <span className="text-sm font-semibold text-green-600">{stats?.tenants?.active || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Suspended</span>
                            <span className="text-sm font-semibold text-red-600">{stats?.tenants?.suspended || 0}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-2 mt-2">
                            <span className="text-sm text-slate-600">Admin Users</span>
                            <span className="text-sm font-semibold text-blue-600">{stats?.tenants?.admins || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Pending</span>
                            <span className="text-sm font-semibold text-yellow-600">{stats?.tenants?.pending || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Zainbox Overview */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Zainbox Overview</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Total Zainboxes</span>
                            <span className="text-sm font-semibold text-slate-900">{stats?.zainboxes?.total || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Live</span>
                            <span className="text-sm font-semibold text-green-600">{stats?.zainboxes?.live || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Sandbox</span>
                            <span className="text-sm font-semibold text-yellow-600">
                                {(stats?.zainboxes?.total || 0) - (stats?.zainboxes?.live || 0)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Webhook & Event Monitoring */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Webhook Monitoring</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Total (24h)</span>
                            <span className="text-sm font-semibold text-slate-900">{stats?.webhooks?.total || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Success</span>
                            <span className="text-sm font-semibold text-green-600">{stats?.webhooks?.success || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Failed</span>
                            <span className="text-sm font-semibold text-red-600">{stats?.webhooks?.failed || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Pending Retry</span>
                            <span className="text-sm font-semibold text-yellow-600">{stats?.webhooks?.pending || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity Table (DF Table) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-900">Recent Transactions</h3>
                    <button
                        onClick={() => window.location.href = '/transactions'}
                        className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                        View All
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Reference</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Type</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Amount</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {stats?.recentTransactions?.length > 0 ? (
                                stats.recentTransactions.map((txn: any) => (
                                    <tr key={txn._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900 font-mono">{txn.reference}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 capitalize">{txn.category}</td>
                                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">{formatCurrency(txn.amount)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${txn.status === 'success' ? 'bg-green-100 text-green-800' :
                                                txn.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {txn.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(txn.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        No recent transactions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
