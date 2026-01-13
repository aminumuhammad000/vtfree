import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/client';

interface Webhook {
    _id: string;
    source: 'zainpay' | 'vtpay';
    eventType: string;
    userId?: {
        _id: string;
        email: string;
        businessName?: string;
    };
    zainboxCode?: string;
    payload: any;
    signature: string;
    signatureValid: boolean;
    dispatchStatus?: 'pending' | 'success' | 'failed';
    dispatchAttempts?: number;
    createdAt: string;
}

const WebhooksPage: React.FC = () => {
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [filterSource, setFilterSource] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [activeTab, setActiveTab] = useState<'logs' | 'configs'>('logs');
    const [tenants, setTenants] = useState<any[]>([]);

    useEffect(() => {
        if (activeTab === 'logs') {
            fetchWebhooks();
        } else {
            fetchTenants();
        }
    }, [filterSource, filterStatus, activeTab]);

    const fetchWebhooks = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (filterSource !== 'all') params.source = filterSource;
            if (filterStatus !== 'all') params.status = filterStatus;

            const data = await adminApi.getWebhooks(params);
            setWebhooks(data.webhooks || []);
        } catch (error) {
            console.error('Failed to fetch webhooks:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTenants = async () => {
        try {
            setLoading(true);
            const data = await adminApi.getAllTenants();
            setTenants(data || []);
        } catch (error) {
            console.error('Failed to fetch tenants:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSourceBadge = (source: string) => {
        return source === 'zainpay' ? (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">ZAINPAY → VTPay</span>
        ) : (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">VTPay → Tenant</span>
        );
    };

    const getStatusBadge = (status?: string) => {
        if (!status) return null;
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

    const filteredWebhooks = webhooks.filter((webhook) => {
        const matchesSource = filterSource === 'all' || webhook.source === filterSource;
        const matchesStatus = filterStatus === 'all' || webhook.dispatchStatus === filterStatus;
        return matchesSource && matchesStatus;
    });

    const tenantsWithWebhooks = tenants.filter(t => t.webhookUrl);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Webhooks & Events</h1>
                    <p className="text-sm text-slate-500 mt-1">Monitor delivery logs and manage tenant configurations</p>
                </div>
                <button
                    onClick={() => activeTab === 'logs' ? fetchWebhooks() : fetchTenants()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                    Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'logs'
                        ? 'border-green-600 text-green-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Webhook Logs
                </button>
                <button
                    onClick={() => setActiveTab('configs')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'configs'
                        ? 'border-green-600 text-green-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Tenant Configurations
                </button>
            </div>

            {activeTab === 'logs' ? (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <p className="text-sm font-medium text-slate-500">Total Webhooks (24h)</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{webhooks.length}</h3>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <p className="text-sm font-medium text-slate-500">Success Rate</p>
                            <h3 className="text-2xl font-bold text-green-600 mt-1">
                                {webhooks.length > 0
                                    ? ((webhooks.filter((w) => w.dispatchStatus === 'success').length / webhooks.length) * 100).toFixed(1)
                                    : 0}
                                %
                            </h3>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <p className="text-sm font-medium text-slate-500">Failed</p>
                            <h3 className="text-2xl font-bold text-red-600 mt-1">
                                {webhooks.filter((w) => w.dispatchStatus === 'failed').length}
                            </h3>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <p className="text-sm font-medium text-slate-500">Pending Retry</p>
                            <h3 className="text-2xl font-bold text-yellow-600 mt-1">
                                {webhooks.filter((w) => w.dispatchStatus === 'pending').length}
                            </h3>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex gap-4">
                            <select
                                value={filterSource}
                                onChange={(e) => setFilterSource(e.target.value)}
                                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="all">All Sources</option>
                                <option value="zainpay">Zainpay → VTPay</option>
                                <option value="vtpay">VTPay → Tenant</option>
                            </select>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="all">All Status</option>
                                <option value="success">Success</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                    </div>
                </>
            ) : (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-slate-900">Configured Webhooks</h3>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">
                            {tenantsWithWebhooks.length} Active Endpoints
                        </span>
                    </div>
                </div>
            )}

            {/* Webhooks Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                        <p className="mt-2 text-slate-500">Loading...</p>
                    </div>
                ) : activeTab === 'logs' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Source
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Event Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Tenant
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Signature
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Dispatch Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Attempts
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Time
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredWebhooks.length > 0 ? (
                                    filteredWebhooks.map((webhook) => (
                                        <tr key={webhook._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">{getSourceBadge(webhook.source)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-mono text-slate-900">{webhook.eventType}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-900">{webhook.userId?.businessName || 'N/A'}</div>
                                                <div className="text-xs text-slate-500 font-mono">{webhook.zainboxCode}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {webhook.signatureValid ? (
                                                    <span className="flex items-center gap-1 text-green-600 text-xs">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                        Valid
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-red-600 text-xs">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                        Invalid
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(webhook.dispatchStatus)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                {webhook.dispatchAttempts ?? '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {new Date(webhook.createdAt).toLocaleTimeString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => {
                                                        setSelectedWebhook(webhook);
                                                        setShowDetails(true);
                                                    }}
                                                    className="text-green-600 hover:text-green-900 mr-3"
                                                >
                                                    View
                                                </button>
                                                {webhook.dispatchStatus === 'failed' && (
                                                    <button className="text-yellow-600 hover:text-yellow-900">Retry</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                            No webhook logs found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Tenant
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Business Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Webhook URL
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {tenantsWithWebhooks.length > 0 ? (
                                    tenantsWithWebhooks.map((tenant) => (
                                        <tr key={tenant._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-slate-900">{tenant.firstName} {tenant.lastName}</div>
                                                <div className="text-xs text-slate-500">{tenant.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-900">{tenant.businessName || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-mono text-purple-600 break-all max-w-md">
                                                    {tenant.webhookUrl}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${tenant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {tenant.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => window.location.href = `/tenants?id=${tenant._id}`}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    Manage Tenant
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            No tenants have configured webhooks yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Webhook Details Modal */}
            {showDetails && selectedWebhook && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Webhook Details</h2>
                                    <p className="text-sm text-slate-500 mt-1">{selectedWebhook.eventType}</p>
                                </div>
                                <button onClick={() => setShowDetails(false)} className="text-slate-400 hover:text-slate-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500">Source</p>
                                    <div className="mt-1">{getSourceBadge(selectedWebhook.source)}</div>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Dispatch Status</p>
                                    <div className="mt-1">{getStatusBadge(selectedWebhook.dispatchStatus)}</div>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Tenant</p>
                                    <p className="text-sm text-slate-900 mt-1">{selectedWebhook.userId?.businessName || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Attempts</p>
                                    <p className="text-sm text-slate-900 mt-1">{selectedWebhook.dispatchAttempts ?? 0}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-slate-500">Signature</p>
                                    <p className="text-sm font-mono text-slate-900 mt-1 break-all">{selectedWebhook.signature}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-slate-500">Timestamp</p>
                                    <p className="text-sm text-slate-900 mt-1">{new Date(selectedWebhook.createdAt).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Payload */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 mb-2">Payload</h3>
                                <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                                    <pre>{JSON.stringify(selectedWebhook.payload, null, 2)}</pre>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-slate-200">
                                {selectedWebhook.dispatchStatus === 'failed' && (
                                    <button className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                                        Retry Dispatch
                                    </button>
                                )}
                                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                    Copy Payload
                                </button>
                                <button className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors">
                                    Download JSON
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WebhooksPage;
