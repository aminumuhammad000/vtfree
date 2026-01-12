import React, { useState, useEffect } from 'react';
import { adminApi, type Zainbox } from '../../api/client';
import toast from 'react-hot-toast';

const ZainboxPage: React.FC = () => {
    const [zainboxes, setZainboxes] = useState<Zainbox[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedZainbox, setSelectedZainbox] = useState<Zainbox | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [balances, setBalances] = useState<{ totalBalance: number; balances: any[] } | null>(null);
    const [loadingBalances, setLoadingBalances] = useState(false);
    const [virtualAccounts, setVirtualAccounts] = useState<any[]>([]);
    const [loadingVirtualAccounts, setLoadingVirtualAccounts] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingZainbox, setEditingZainbox] = useState<Zainbox | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const [createFormData, setCreateFormData] = useState({
        name: '',
        emailNotification: '',
        callbackUrl: '',
        tags: ''
    });

    const [editFormData, setEditFormData] = useState({
        name: '',
        emailNotification: '',
        callbackUrl: '',
        tags: ''
    });

    useEffect(() => {
        fetchZainboxes();
    }, []);

    const fetchZainboxes = async () => {
        try {
            setLoading(true);
            const data = await adminApi.getAllZainboxes();
            setZainboxes(data);
        } catch (error) {
            console.error('Failed to fetch zainboxes:', error);
            toast.error('Failed to fetch zainboxes');
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        try {
            setIsSyncing(true);
            const response = await adminApi.syncZainboxes();
            if (response.success) {
                toast.success(response.message || 'Sync completed successfully');
                fetchZainboxes();
            } else {
                toast.error(response.message || 'Failed to sync zainboxes');
            }
        } catch (error: any) {
            console.error('Failed to sync zainboxes:', error);
            toast.error(error.response?.data?.message || 'Failed to sync zainboxes');
        } finally {
            setIsSyncing(false);
        }
    };

    const fetchBalances = async (code: string) => {
        try {
            setLoadingBalances(true);
            const response = await adminApi.getZainboxBalances(code);
            if (response.success) {
                setBalances(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch balances:', error);
        } finally {
            setLoadingBalances(false);
        }
    };

    const fetchVirtualAccounts = async (code: string) => {
        try {
            setLoadingVirtualAccounts(true);
            const response = await adminApi.getZainboxAccounts(code);
            setVirtualAccounts(response || []);
        } catch (error) {
            console.error('Failed to fetch virtual accounts:', error);
            setVirtualAccounts([]);
        } finally {
            setLoadingVirtualAccounts(false);
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsCreating(true);
            await adminApi.createZainbox(createFormData);
            toast.success('Zainbox created successfully');
            setShowCreateModal(false);
            setCreateFormData({
                name: '',
                emailNotification: '',
                callbackUrl: '',
                tags: ''
            });
            fetchZainboxes();
        } catch (error) {
            console.error('Failed to create zainbox:', error);
            toast.error('Failed to create zainbox');
        } finally {
            setIsCreating(false);
        }
    };

    const handleEditClick = (zainbox: Zainbox) => {
        setEditingZainbox(zainbox);
        setEditFormData({
            name: zainbox.name,
            emailNotification: zainbox.emailNotification,
            callbackUrl: zainbox.callbackUrl,
            tags: zainbox.tags
        });
        setShowEditModal(true);
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingZainbox) return;

        try {
            setIsUpdating(true);
            await adminApi.updateZainbox(editingZainbox.zainboxCode, editFormData);
            toast.success('Zainbox updated successfully');
            setShowEditModal(false);
            setEditingZainbox(null);
            fetchZainboxes();
        } catch (error) {
            console.error('Failed to update zainbox:', error);
            toast.error('Failed to update zainbox');
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredZainboxes = zainboxes.filter(zainbox =>
        zainbox.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        zainbox.zainboxCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        zainbox.emailNotification.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Zainbox Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Internal Zainpay control and monitoring</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSyncing ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-slate-500 border-r-transparent"></div>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        )}
                        Sync from Zainpay
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                        + Create Zainbox
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Total Zainboxes</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{zainboxes.length}</h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Live</p>
                    <h3 className="text-2xl font-bold text-green-600 mt-1">
                        {zainboxes.filter(z => z.isLive).length}
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Sandbox</p>
                    <h3 className="text-2xl font-bold text-yellow-600 mt-1">
                        {zainboxes.filter(z => !z.isLive).length}
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Total Balance</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">₦---</h3>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <input
                    type="text"
                    placeholder="Search by name, code, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
            </div>

            {/* Zainboxes Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                        <p className="mt-2 text-slate-500">Loading zainboxes...</p>
                    </div>
                ) : filteredZainboxes.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">No Zainboxes Found</h3>
                        <p className="text-slate-500 mt-1">Get started by creating your first Zainbox or syncing from Zainpay.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name & Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Environment</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Notifications</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredZainboxes.map((zainbox) => (
                                    <tr key={zainbox._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">{zainbox.name}</div>
                                            <div className="text-xs text-slate-500 font-mono">{zainbox.zainboxCode}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${zainbox.isLive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {zainbox.isLive ? 'LIVE' : 'SANDBOX'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-900">{zainbox.emailNotification}</div>
                                            <div className="text-xs text-slate-500 truncate max-w-[200px]">{zainbox.callbackUrl}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {new Date(zainbox.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setSelectedZainbox(zainbox);
                                                    setShowDetails(true);
                                                    fetchBalances(zainbox.zainboxCode);
                                                    fetchVirtualAccounts(zainbox.zainboxCode);
                                                }}
                                                className="text-green-600 hover:text-green-900 mr-4"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleEditClick(zainbox)}
                                                className="text-blue-600 hover:text-blue-900 mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm('Are you sure you want to delete this Zainbox? This will remove it from the system.')) {
                                                        try {
                                                            await adminApi.deleteZainbox(zainbox._id);
                                                            toast.success('Zainbox deleted successfully');
                                                            fetchZainboxes();
                                                        } catch (error) {
                                                            toast.error('Failed to delete Zainbox');
                                                        }
                                                    }
                                                }}
                                                className="text-red-600 hover:text-red-900"
                                            >
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

            {/* Details Modal */}
            {showDetails && selectedZainbox && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">{selectedZainbox.name}</h2>
                                    <p className="text-sm text-slate-500 font-mono mt-1">{selectedZainbox.zainboxCode}</p>
                                </div>
                                <button
                                    onClick={() => setShowDetails(false)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Configuration */}
                            <div>
                                <h3 className="text-sm font-medium text-slate-900 mb-3">Configuration</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <p className="text-xs text-slate-500">Code Name</p>
                                        <p className="text-sm font-mono text-slate-900 mt-1">{selectedZainbox.codeName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Environment</p>
                                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${selectedZainbox.isLive
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {selectedZainbox.isLive ? 'LIVE' : 'SANDBOX'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Created</p>
                                        <p className="text-sm text-slate-900 mt-1">
                                            {new Date(selectedZainbox.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-slate-500">Email Notification</p>
                                        <p className="text-sm text-slate-900 mt-1">{selectedZainbox.emailNotification}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-slate-500">Callback URL</p>
                                        <p className="text-sm font-mono text-slate-900 mt-1 break-all">{selectedZainbox.callbackUrl}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-slate-500">Tags</p>
                                        <div className="flex gap-2 mt-1">
                                            {selectedZainbox.tags.split(',').map((tag, i) => (
                                                <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
                                                    {tag.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Balances */}
                            <div>
                                <h3 className="text-sm font-medium text-slate-900 mb-3">Real-time Balances</h3>
                                {loadingBalances ? (
                                    <div className="flex items-center justify-center p-8 bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-green-600 border-r-transparent"></div>
                                        <span className="ml-3 text-slate-500 text-sm">Fetching balances...</span>
                                    </div>
                                ) : balances ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                                <p className="text-xs text-green-600 font-medium uppercase tracking-wider">Total Combined Balance</p>
                                                <p className="text-2xl font-bold text-green-900 mt-1">
                                                    ₦{balances.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                                <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">Active Accounts</p>
                                                <p className="text-2xl font-bold text-blue-900 mt-1">{balances.balances.length}</p>
                                            </div>
                                        </div>

                                        {balances.balances.length > 0 && (
                                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="bg-slate-50 border-b border-slate-200">
                                                        <tr>
                                                            <th className="px-4 py-2 font-medium text-slate-700">Account Name</th>
                                                            <th className="px-4 py-2 font-medium text-slate-700">Account Number</th>
                                                            <th className="px-4 py-2 font-medium text-slate-700 text-right">Balance</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200">
                                                        {balances.balances.map((acc: any, i: number) => (
                                                            <tr key={i} className="hover:bg-slate-50">
                                                                <td className="px-4 py-2 text-slate-900 font-medium">{acc.accountName}</td>
                                                                <td className="px-4 py-2 text-slate-500 font-mono">{acc.accountNumber}</td>
                                                                <td className="px-4 py-2 text-slate-900 text-right font-semibold">
                                                                    ₦{acc.balanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200">
                                        <p className="text-slate-500 text-sm">No balance data available for this Zainbox.</p>
                                    </div>
                                )}
                            </div>

                            {/* Virtual Accounts */}
                            <div>
                                <h3 className="text-sm font-medium text-slate-900 mb-3">Virtual Accounts</h3>
                                {loadingVirtualAccounts ? (
                                    <div className="flex items-center justify-center p-8 bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-green-600 border-r-transparent"></div>
                                        <span className="ml-3 text-slate-500 text-sm">Loading virtual accounts...</span>
                                    </div>
                                ) : virtualAccounts.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                                            <p className="text-xs text-indigo-600 font-medium uppercase tracking-wider">Total Virtual Accounts</p>
                                            <p className="text-2xl font-bold text-indigo-900 mt-1">{virtualAccounts.length}</p>
                                        </div>
                                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-50 border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-4 py-2 font-medium text-slate-700">Account Name</th>
                                                        <th className="px-4 py-2 font-medium text-slate-700">Account Number</th>
                                                        <th className="px-4 py-2 font-medium text-slate-700">Bank</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {virtualAccounts.map((acc: any, i: number) => (
                                                        <tr key={i} className="hover:bg-slate-50">
                                                            <td className="px-4 py-2 text-slate-900 font-medium">{acc.name}</td>
                                                            <td className="px-4 py-2 text-slate-500 font-mono">{acc.bankAccount}</td>
                                                            <td className="px-4 py-2 text-slate-600">{acc.bankName}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200">
                                        <p className="text-slate-500 text-sm">No virtual accounts found for this Zainbox.</p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-slate-200">
                                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                    View Transactions
                                </button>
                                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                    Settlement Settings
                                </button>
                                <button className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors">
                                    Sync
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                        <div className="p-6 border-b border-slate-200">
                            <div className="flex justify-between items-start">
                                <h2 className="text-xl font-bold text-slate-900">Create New Zainbox</h2>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Zainbox Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="e.g., Company Name Primary"
                                    value={createFormData.name}
                                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Notification</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="notifications@company.com"
                                    value={createFormData.emailNotification}
                                    onChange={(e) => setCreateFormData({ ...createFormData, emailNotification: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Callback URL</label>
                                <input
                                    type="url"
                                    required
                                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="https://company.com/webhooks/vtpay"
                                    value={createFormData.callbackUrl}
                                    onChange={(e) => setCreateFormData({ ...createFormData, callbackUrl: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma separated)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="production, primary"
                                    value={createFormData.tags}
                                    onChange={(e) => setCreateFormData({ ...createFormData, tags: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                                    disabled={isCreating}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                    disabled={isCreating}
                                >
                                    {isCreating ? 'Creating...' : 'Create Zainbox'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingZainbox && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                        <div className="p-6 border-b border-slate-200">
                            <div className="flex justify-between items-start">
                                <h2 className="text-xl font-bold text-slate-900">Edit Zainbox</h2>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Zainbox Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="e.g., Company Name Primary"
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Notification</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="notifications@company.com"
                                    value={editFormData.emailNotification}
                                    onChange={(e) => setEditFormData({ ...editFormData, emailNotification: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Callback URL (Webhook)</label>
                                <input
                                    type="url"
                                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="https://company.com/webhooks/vtpay"
                                    value={editFormData.callbackUrl}
                                    onChange={(e) => setEditFormData({ ...editFormData, callbackUrl: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma separated)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="production, primary"
                                    value={editFormData.tags}
                                    onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                                    disabled={isUpdating}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? 'Updating...' : 'Update Zainbox'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ZainboxPage;
