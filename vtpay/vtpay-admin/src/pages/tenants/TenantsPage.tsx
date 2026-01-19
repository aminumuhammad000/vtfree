import React, { useState, useEffect } from 'react';
import { adminApi, type Tenant } from '../../api/client';
import toast from 'react-hot-toast';

const TenantsPage: React.FC = () => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [tenantToDelete, setTenantToDelete] = useState<string | null>(null);
    const [showSendMessage, setShowSendMessage] = useState(false);
    const [messageData, setMessageData] = useState({ subject: '', message: '' });
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            setLoading(true);
            const data = await adminApi.getAllTenants();
            setTenants(data);
        } catch (error) {
            console.error('Failed to fetch tenants:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (tenantId: string, newStatus: 'active' | 'suspended' | 'inactive') => {
        try {
            await adminApi.updateTenantStatus(tenantId, newStatus);
            const updatedTenants = tenants.map(t =>
                t._id === tenantId ? { ...t, status: newStatus } : t
            );
            setTenants(updatedTenants);

            if (selectedTenant && selectedTenant._id === tenantId) {
                setSelectedTenant({ ...selectedTenant, status: newStatus });
            }
            toast.success(`Tenant status updated to ${newStatus}`);
        } catch (error) {
            console.error('Failed to update tenant status:', error);
            toast.error('Failed to update tenant status');
        }
    };

    const handleDeleteTenant = (tenantId: string) => {
        setTenantToDelete(tenantId);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!tenantToDelete) return;

        try {
            await adminApi.deleteTenant(tenantToDelete);
            setTenants(tenants.filter(t => t._id !== tenantToDelete));
            if (selectedTenant?._id === tenantToDelete) {
                setShowDetails(false);
                setSelectedTenant(null);
            }
            setShowDeleteConfirm(false);
            setTenantToDelete(null);
            toast.success('Tenant deleted successfully');
        } catch (error) {
            console.error('Failed to delete tenant:', error);
            toast.error('Failed to delete tenant');
        }
    };

    const handleKycStatusChange = async (id: string, kyc_status: 'pending' | 'verified' | 'rejected') => {
        try {
            await adminApi.updateTenantKycStatus(id, kyc_status);
            toast.success(`KYC status updated to ${kyc_status}`);
            fetchTenants();
            if (selectedTenant?._id === id) {
                setSelectedTenant({ ...selectedTenant, kyc_status: kyc_status as any });
            }
        } catch (error) {
            console.error('Failed to update KYC status:', error);
            toast.error('Failed to update KYC status');
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTenant) return;

        try {
            setIsSending(true);
            await adminApi.sendSingleEmail({
                userId: selectedTenant._id,
                subject: messageData.subject,
                message: messageData.message
            });
            toast.success('Message sent successfully');
            setShowSendMessage(false);
            setMessageData({ subject: '', message: '' });
        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error('Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    const handleExport = () => {
        const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Business Name', 'KYC Status', 'Status', 'Created At'];
        const csvData = filteredTenants.map(t => [
            t.firstName,
            t.lastName,
            t.email,
            t.phone,
            t.businessName || 'N/A',
            t.kyc_status,
            t.status,
            new Date(t.createdAt).toLocaleDateString()
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `tenants_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getKycStatusBadge = (status: string) => {
        const badges = {
            pending: { text: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
            verified: { text: 'Verified', color: 'bg-green-100 text-green-800' },
            rejected: { text: 'Rejected', color: 'bg-red-100 text-red-800' },
        };
        const badge = badges[status as keyof typeof badges] || { text: status, color: 'bg-gray-100 text-gray-800' };
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>{badge.text}</span>;
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            active: 'bg-green-100 text-green-800',
            suspended: 'bg-red-100 text-red-800',
            inactive: 'bg-gray-100 text-gray-800',
        };
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'}`}>{status.toUpperCase()}</span>;
    };

    const filteredTenants = tenants.filter(tenant => {
        const matchesSearch = (tenant.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (tenant.firstName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (tenant.lastName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (tenant.businessName?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900">Tenants Management</h1>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">Control tenant access, status, and limits</p>
                </div>
                <div className="w-full sm:w-auto">
                    <button
                        onClick={handleExport}
                        className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm active:scale-95"
                    >
                        Export Data
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs md:text-sm font-medium text-slate-500">Total Tenants</p>
                    <h3 className="text-lg md:text-2xl font-bold text-slate-900 mt-1">{tenants.length}</h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs md:text-sm font-medium text-slate-500">Active</p>
                    <h3 className="text-lg md:text-2xl font-bold text-green-600 mt-1">
                        {tenants.filter(t => t.status === 'active').length}
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs md:text-sm font-medium text-slate-500">Suspended</p>
                    <h3 className="text-lg md:text-2xl font-bold text-red-600 mt-1">
                        {tenants.filter(t => t.status === 'suspended').length}
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs md:text-sm font-medium text-slate-500">KYC Verified</p>
                    <h3 className="text-lg md:text-2xl font-bold text-slate-900 mt-1">
                        {tenants.filter(t => t.kyc_status === 'verified').length}
                    </h3>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search by email, name, or business..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full sm:w-auto px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            {/* Tenants Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                        <p className="mt-2 text-slate-500">Loading tenants...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] md:min-w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Tenant
                                    </th>
                                    <th className="hidden lg:table-cell px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Business
                                    </th>
                                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        KYC Level
                                    </th>
                                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="hidden sm:table-cell px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredTenants.map((tenant) => (
                                    <tr key={tenant._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-slate-900">{tenant.firstName} {tenant.lastName}</div>
                                                <div className="text-xs text-slate-500">{tenant.email}</div>
                                            </div>
                                        </td>
                                        <td className="hidden lg:table-cell px-4 md:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-900">{tenant.businessName || 'N/A'}</div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                            {getKycStatusBadge(tenant.kyc_status)}
                                        </td>
                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(tenant.status)}
                                        </td>
                                        <td className="hidden sm:table-cell px-4 md:px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {new Date(tenant.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    onClick={() => {
                                                        setSelectedTenant(tenant);
                                                        setShowDetails(true);
                                                    }}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTenant(tenant._id)}
                                                    className="text-red-600 hover:text-red-900"
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
            {showDetails && selectedTenant && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">{selectedTenant.firstName} {selectedTenant.lastName}</h2>
                                    <p className="text-sm text-slate-500">{selectedTenant.email}</p>
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
                        <div className="p-6 space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-slate-500 mb-2">Business Information</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500">Business Name</p>
                                        <p className="text-sm font-medium text-slate-900">{selectedTenant.businessName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Phone</p>
                                        <p className="text-sm font-medium text-slate-900">{selectedTenant.phone}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-slate-500 mb-2">Account Details</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500">KYC Status</p>
                                        {getKycStatusBadge(selectedTenant.kyc_status)}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Status</p>
                                        {getStatusBadge(selectedTenant.status)}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Created</p>
                                        <p className="text-sm text-slate-900">{new Date(selectedTenant.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    {selectedTenant.webhookUrl && (
                                        <div className="sm:col-span-2">
                                            <p className="text-xs text-slate-500">Webhook URL</p>
                                            <p className="text-sm font-mono text-purple-600 break-all">{selectedTenant.webhookUrl}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedTenant.kycLevel >= 2 && (
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <h3 className="text-sm font-bold text-slate-900 mb-3">KYC Verification Documents</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="text-xs text-slate-500">NIN</p>
                                            <p className="text-sm font-mono font-medium text-slate-900">{selectedTenant.nin || 'Not provided'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">BVN</p>
                                            <p className="text-sm font-mono font-medium text-slate-900">{selectedTenant.bvn || 'Not provided'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-2">Identity Document</p>
                                        {selectedTenant.idCardPath ? (
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center p-3 bg-white rounded-lg border border-slate-200 shadow-sm gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center text-blue-600 flex-shrink-0">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-900 truncate">{selectedTenant.idCardPath}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase">Uploaded Document</p>
                                                </div>
                                                <button
                                                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors text-xs font-medium"
                                                    onClick={() => alert('Document download would happen here in production.')}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                    Download
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-500 italic">No document uploaded</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-200">
                                {selectedTenant.status !== 'active' && (
                                    <button
                                        onClick={() => handleStatusChange(selectedTenant._id, 'active')}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                    >
                                        Approve / Activate
                                    </button>
                                )}
                                {selectedTenant.status !== 'suspended' && (
                                    <button
                                        onClick={() => handleStatusChange(selectedTenant._id, 'suspended')}
                                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                                    >
                                        Suspend
                                    </button>
                                )}

                                {selectedTenant.kyc_status !== 'verified' && (
                                    <button
                                        onClick={() => handleKycStatusChange(selectedTenant._id, 'verified')}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                    >
                                        Approve KYC
                                    </button>
                                )}
                                {selectedTenant.kyc_status !== 'rejected' && (
                                    <button
                                        onClick={() => handleKycStatusChange(selectedTenant._id, 'rejected')}
                                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                                    >
                                        Reject KYC
                                    </button>
                                )}

                                <button
                                    onClick={() => setShowSendMessage(true)}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                                >
                                    Send Message
                                </button>

                                <button
                                    onClick={() => handleDeleteTenant(selectedTenant._id)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                >
                                    Delete User
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Tenant</h3>
                            <p className="text-sm text-slate-500 mb-6">
                                Are you sure you want to delete this tenant? This action cannot be undone and will delete all associated data including wallets and transactions.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setTenantToDelete(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                                >
                                    No, Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Send Message Modal */}
            {showSendMessage && selectedTenant && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                        <div className="p-6 border-b border-slate-200">
                            <div className="flex justify-between items-start">
                                <h2 className="text-xl font-bold text-slate-900">Send Message to {selectedTenant.firstName}</h2>
                                <button
                                    onClick={() => setShowSendMessage(false)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleSendMessage} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Enter subject"
                                    value={messageData.subject}
                                    onChange={(e) => setMessageData({ ...messageData, subject: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                                <textarea
                                    required
                                    rows={6}
                                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Type your message here..."
                                    value={messageData.message}
                                    onChange={(e) => setMessageData({ ...messageData, message: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowSendMessage(false)}
                                    className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                                    disabled={isSending}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                    disabled={isSending}
                                >
                                    {isSending ? 'Sending...' : 'Send Message'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TenantsPage;
