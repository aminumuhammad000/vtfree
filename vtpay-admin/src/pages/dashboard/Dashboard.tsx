import React from 'react';

const Dashboard: React.FC = () => {
    return (
        <div className="p-6 space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Payment Operations Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-1">Real-time financial monitoring and control</p>
                </div>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                    Export Report
                </button>
            </div>

            {/* Critical Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Inflow */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Inflow (Today)</p>
                            <h3 className="text-2xl font-bold text-green-600 mt-2">₦2,450,000</h3>
                            <p className="text-xs text-green-600 mt-1">+12.5% from yesterday</p>
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
                            <h3 className="text-2xl font-bold text-slate-900 mt-2">₦1,890,000</h3>
                            <p className="text-xs text-slate-500 mt-1">+8.2% from yesterday</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Pending Settlements */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Pending Settlements</p>
                            <h3 className="text-2xl font-bold text-yellow-600 mt-2">₦340,000</h3>
                            <p className="text-xs text-slate-500 mt-1">12 pending</p>
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
                            <h3 className="text-2xl font-bold text-red-600 mt-2">8</h3>
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
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Active Tenants</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Total Active</span>
                            <span className="text-sm font-semibold text-slate-900">45</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Frozen</span>
                            <span className="text-sm font-semibold text-yellow-600">3</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Suspended</span>
                            <span className="text-sm font-semibold text-red-600">2</span>
                        </div>
                    </div>
                </div>

                {/* API Usage */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">API Usage (24h)</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Total Requests</span>
                            <span className="text-sm font-semibold text-slate-900">12,450</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Success Rate</span>
                            <span className="text-sm font-semibold text-green-600">99.2%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Errors</span>
                            <span className="text-sm font-semibold text-red-600">102</span>
                        </div>
                    </div>
                </div>

                {/* Webhooks */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Webhook Status</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Success</span>
                            <span className="text-sm font-semibold text-green-600">95.8%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Failed</span>
                            <span className="text-sm font-semibold text-red-600">4.2%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Pending Retry</span>
                            <span className="text-sm font-semibold text-yellow-600">24</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Critical Events</h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-4 p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">Failed transfer detected</p>
                            <p className="text-xs text-slate-500">Tenant: ABC Corp • Amount: ₦50,000 • 5 mins ago</p>
                        </div>
                        <button className="text-xs text-red-600 font-medium hover:underline">Investigate</button>
                    </div>

                    <div className="flex items-center gap-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">Abnormal transaction pattern</p>
                            <p className="text-xs text-slate-500">Tenant: XYZ Ltd • 15 rapid transactions • 12 mins ago</p>
                        </div>
                        <button className="text-xs text-yellow-600 font-medium hover:underline">Review</button>
                    </div>

                    <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">Settlement completed</p>
                            <p className="text-xs text-slate-500">Tenant: DEF Inc • Amount: ₦250,000 • 18 mins ago</p>
                        </div>
                        <button className="text-xs text-green-600 font-medium hover:underline">View</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
