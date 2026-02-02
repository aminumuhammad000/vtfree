import React, { useState, useEffect } from 'react';
import { adminApi, type Zainbox } from '../../api/client';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { exportToCSV } from '../../utils/exportUtils';
import { zainboxSchema, type ZainboxFormData } from '../../schemas/zainbox';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';

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



    // Forms
    const {
        register: registerCreate,
        handleSubmit: handleSubmitCreate,
        reset: resetCreate,
        formState: { errors: errorsCreate }
    } = useForm<ZainboxFormData>({
        resolver: zodResolver(zainboxSchema)
    });

    const {
        register: registerEdit,
        handleSubmit: handleSubmitEdit,
        reset: resetEdit,
        formState: { errors: errorsEdit }
    } = useForm<ZainboxFormData>({
        resolver: zodResolver(zainboxSchema)
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
            setBalances(null); // Reset previous balances
            const response = await adminApi.getZainboxBalances(code);
            if (response.success) {
                setBalances(response.data);
                toast.success('Balance fetched successfully');
            } else {
                toast.error(response.message || 'Failed to fetch balance');
                setBalances(null);
            }
        } catch (error: any) {
            console.error('Failed to fetch balances:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch balance. Please try again.';
            toast.error(errorMessage);
            setBalances(null);
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

    const handleCreateSubmit = async (data: ZainboxFormData) => {
        try {
            setIsCreating(true);
            await adminApi.createZainbox(data);
            toast.success('Zainbox created successfully');
            setShowCreateModal(false);
            resetCreate();
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
        resetEdit({
            name: zainbox.name,
            emailNotification: zainbox.emailNotification,
            callbackUrl: zainbox.callbackUrl || '',
            tags: zainbox.tags || ''
        });
        setShowEditModal(true);
    };

    const handleUpdateSubmit = async (data: ZainboxFormData) => {
        if (!editingZainbox) return;

        try {
            setIsUpdating(true);
            await adminApi.updateZainbox(editingZainbox.zainboxCode, data);
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

    const handleExport = () => {
        const headers = ['Name', 'Code', 'Email Notification', 'Callback URL', 'Tags', 'Status', 'Created At'];

        exportToCSV(
            filteredZainboxes,
            headers,
            `zainboxes_export_${new Date().toISOString().split('T')[0]}.csv`,
            (z) => [
                z.name,
                z.zainboxCode,
                z.emailNotification,
                z.callbackUrl,
                z.tags,
                z.isActive ? 'Active' : 'Inactive',
                new Date(z.createdAt).toLocaleString()
            ]
        );
    };



    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900">Zainbox Management</h1>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">Internal Zainpay control and monitoring</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm active:scale-95"
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
                        onClick={handleExport}
                        className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm active:scale-95"
                    >
                        Export CSV
                    </button>
                    <button
                        onClick={() => {
                            resetCreate();
                            setShowCreateModal(true);
                        }}
                        className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm active:scale-95"
                    >
                        + Create Zainbox
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs md:text-sm font-medium text-slate-500">Total Zainboxes</p>
                    <h3 className="text-lg md:text-2xl font-bold text-slate-900 mt-1">{zainboxes.length}</h3>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs md:text-sm font-medium text-slate-500">Total Balance</p>
                    <h3 className="text-lg md:text-2xl font-bold text-slate-900 mt-1">
                        ₦{zainboxes.reduce((sum, z) => sum + (z.currentBalance || 0), 0)?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h3>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <input
                    type="text"
                    placeholder="Search by name, code, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
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
                        <table className="w-full min-w-[700px] md:min-w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name & Code</th>

                                    <th className="hidden lg:table-cell px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Notifications</th>
                                    <th className="hidden sm:table-cell px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
                                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredZainboxes.map((zainbox) => (
                                    <tr key={zainbox._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">{zainbox.name}</div>
                                            <div className="text-xs text-slate-500 font-mono">{zainbox.zainboxCode}</div>
                                        </td>

                                        <td className="hidden lg:table-cell px-4 md:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-900">{zainbox.emailNotification}</div>
                                            <div className="text-xs text-slate-500 truncate max-w-[200px]">{zainbox.callbackUrl}</div>
                                        </td>
                                        <td className="hidden sm:table-cell px-4 md:px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {new Date(zainbox.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    onClick={() => {
                                                        setSelectedZainbox(zainbox);
                                                        setShowDetails(true);
                                                        fetchBalances(zainbox.zainboxCode);
                                                        fetchVirtualAccounts(zainbox.zainboxCode);
                                                    }}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleEditClick(zainbox)}
                                                    className="text-blue-600 hover:text-blue-900"
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
                                                    className="text-red-600 hover:text-red-900 hidden sm:inline"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            <Modal
                isOpen={showDetails && !!selectedZainbox}
                onClose={() => setShowDetails(false)}
                title={selectedZainbox ? selectedZainbox.name : 'Zainbox Details'}
                maxWidth="2xl"
            >
                {selectedZainbox && (
                    <div className="space-y-6">
                        {/* User Information */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Owner Information
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Full Name</p>
                                    <p className="text-sm text-slate-900 font-medium">
                                        {typeof selectedZainbox.userId === 'object'
                                            ? `${selectedZainbox.userId.firstName} ${selectedZainbox.userId.lastName}`
                                            : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Email Address</p>
                                    <p className="text-sm text-slate-900 font-medium">
                                        {typeof selectedZainbox.userId === 'object' ? selectedZainbox.userId.email : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Business Name</p>
                                    <p className="text-sm text-slate-900 font-medium">
                                        {(typeof selectedZainbox.userId === 'object' && selectedZainbox.userId.businessName)
                                            ? selectedZainbox.userId.businessName
                                            : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Role</p>
                                    <Badge variant={typeof selectedZainbox.userId === 'object' && selectedZainbox.userId.role === 'admin' ? 'info' : 'neutral'}>
                                        {typeof selectedZainbox.userId === 'object' ? selectedZainbox.userId.role : 'User'}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Configuration */}
                        <div>
                            <h3 className="text-sm font-medium text-slate-900 mb-3">Zainbox Configuration</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <p className="text-xs text-slate-500">Zainbox Name</p>
                                    <p className="text-sm font-medium text-slate-900">{selectedZainbox.name}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs text-slate-500">Code Name (Zainpay ID)</p>
                                    <p className="text-sm font-mono text-slate-900 mt-1">{selectedZainbox.codeName}</p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500">Created On</p>
                                    <p className="text-sm text-slate-900 mt-1">
                                        {new Date(selectedZainbox.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Status</p>
                                    <Badge variant={selectedZainbox.isActive ? 'success' : 'error'}>
                                        {selectedZainbox.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs text-slate-500">Notification Email</p>
                                    <p className="text-sm text-slate-900 mt-1">{selectedZainbox.emailNotification}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs text-slate-500">Webhook / Callback URL</p>
                                    <p className="text-sm font-mono text-slate-900 mt-1 break-all bg-slate-50 p-2 rounded border border-slate-100">{selectedZainbox.callbackUrl}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs text-slate-500">Tags</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {selectedZainbox.tags ? selectedZainbox.tags.split(',').map((tag: string, i: number) => (
                                            <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded">
                                                {tag.trim()}
                                            </span>
                                        )) : <span className="text-slate-400 text-xs italic">No tags</span>}
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
                                                    {balances.balances
                                                        .filter((acc: any) => acc.accountName !== 'Internal Settlement Account')
                                                        .map((acc: any, i: number) => (
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
                                                {virtualAccounts
                                                    .filter((acc: any) => acc.name !== 'Internal Settlement Account')
                                                    .map((acc: any, i: number) => (
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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-200">
                            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                                View Transactions
                            </button>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                                Settlement Settings
                            </button>
                            <button className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium">
                                Sync
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Create Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create New Zainbox"
                maxWidth="lg"
            >
                <form onSubmit={handleSubmitCreate(handleCreateSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Zainbox Name</label>
                        <input
                            {...registerCreate('name')}
                            type="text"
                            className={`w-full px-4 py-2 border ${errorsCreate.name ? 'border-red-500' : 'border-slate-300'} bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500`}
                            placeholder="e.g., Company Name Primary"
                        />
                        {errorsCreate.name && <p className="text-red-500 text-xs mt-1">{errorsCreate.name.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Notification</label>
                        <input
                            {...registerCreate('emailNotification')}
                            type="email"
                            className={`w-full px-4 py-2 border ${errorsCreate.emailNotification ? 'border-red-500' : 'border-slate-300'} bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500`}
                            placeholder="notifications@company.com"
                        />
                        {errorsCreate.emailNotification && <p className="text-red-500 text-xs mt-1">{errorsCreate.emailNotification.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Callback URL</label>
                        <input
                            {...registerCreate('callbackUrl')}
                            type="url"
                            className={`w-full px-4 py-2 border ${errorsCreate.callbackUrl ? 'border-red-500' : 'border-slate-300'} bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500`}
                            placeholder="https://company.com/webhooks/vtpay"
                        />
                        {errorsCreate.callbackUrl && <p className="text-red-500 text-xs mt-1">{errorsCreate.callbackUrl.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma separated)</label>
                        <input
                            {...registerCreate('tags')}
                            type="text"
                            className={`w-full px-4 py-2 border ${errorsCreate.tags ? 'border-red-500' : 'border-slate-300'} bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500`}
                            placeholder="production, primary"
                        />
                        {errorsCreate.tags && <p className="text-red-500 text-xs mt-1">{errorsCreate.tags.message}</p>}
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
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Zainbox"
                maxWidth="lg"
            >
                <form onSubmit={handleSubmitEdit(handleUpdateSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Zainbox Name</label>
                        <input
                            {...registerEdit('name')}
                            type="text"
                            className={`w-full px-4 py-2 border ${errorsEdit.name ? 'border-red-500' : 'border-slate-300'} bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500`}
                            placeholder="e.g., Company Name Primary"
                        />
                        {errorsEdit.name && <p className="text-red-500 text-xs mt-1">{errorsEdit.name.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Notification</label>
                        <input
                            {...registerEdit('emailNotification')}
                            type="email"
                            className={`w-full px-4 py-2 border ${errorsEdit.emailNotification ? 'border-red-500' : 'border-slate-300'} bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500`}
                            placeholder="notifications@company.com"
                        />
                        {errorsEdit.emailNotification && <p className="text-red-500 text-xs mt-1">{errorsEdit.emailNotification.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Callback URL (Webhook)</label>
                        <input
                            {...registerEdit('callbackUrl')}
                            type="url"
                            className={`w-full px-4 py-2 border ${errorsEdit.callbackUrl ? 'border-red-500' : 'border-slate-300'} bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500`}
                            placeholder="https://company.com/webhooks/vtpay"
                        />
                        {errorsEdit.callbackUrl && <p className="text-red-500 text-xs mt-1">{errorsEdit.callbackUrl.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma separated)</label>
                        <input
                            {...registerEdit('tags')}
                            type="text"
                            className={`w-full px-4 py-2 border ${errorsEdit.tags ? 'border-red-500' : 'border-slate-300'} bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500`}
                            placeholder="production, primary"
                        />
                        {errorsEdit.tags && <p className="text-red-500 text-xs mt-1">{errorsEdit.tags.message}</p>}
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
            </Modal>
        </div>
    );
};

export default ZainboxPage;
