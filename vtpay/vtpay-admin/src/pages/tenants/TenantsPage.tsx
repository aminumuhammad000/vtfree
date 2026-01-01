import React, { useState, useEffect } from 'react';
import { adminApi, type Tenant } from '../../api/client';

const TenantsPage: React.FC = () => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [showDetails, setShowDetails] = useState(false);

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

    const handleStatusChange = async (tenantId: string, newStatus: 'active' | 'suspended' | 'frozen') => {
        try {
            await adminApi.updateTenantStatus(tenantId, newStatus);
            const updatedTenants = tenants.map(t =>
                t._id === tenantId ? { ...t, status: newStatus } : t
            );
            setTenants(updatedTenants);

            if (selectedTenant && selectedTenant._id === tenantId) {
                setSelectedTenant({ ...selectedTenant, status: newStatus });
            }
        } catch (error) {
            console.error('Failed to update tenant status:', error);
        }
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
        const matchesSearch = tenant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tenant.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tenant.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tenant.business_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Tenants Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Control tenant access, status, and limits</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
                        Export Data
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Total Tenants</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{tenants.length}</h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Active</p>
                    <h3 className="text-2xl font-bold text-green-600 mt-1">
                        {tenants.filter(t => t.status === 'active').length}
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Suspended</p>
                    <h3 className="text-2xl font-bold text-red-600 mt-1">
                        {tenants.filter(t => t.status === 'suspended').length}
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">KYC Verified</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">
                        {tenants.filter(t => t.kyc_status === 'verified').length}
                    </h3>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search by email, name, or business..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Tenant
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Business
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        KYC Level
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredTenants.map((tenant) => (
                                    <tr key={tenant._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-slate-900">{tenant.first_name} {tenant.last_name}</div>
                                                <div className="text-sm text-slate-500">{tenant.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-900">{tenant.business_name || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getKycStatusBadge(tenant.kyc_status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(tenant.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {new Date(tenant.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setSelectedTenant(tenant);
                                                    setShowDetails(true);
                                                }}
                                                className="text-green-600 hover:text-green-900 mr-4"
                                            >
                                                View
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
            {showDetails && selectedTenant && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">{selectedTenant.first_name} {selectedTenant.last_name}</h2>
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500">Business Name</p>
                                        <p className="text-sm font-medium text-slate-900">{selectedTenant.business_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Phone</p>
                                        <p className="text-sm font-medium text-slate-900">{selectedTenant.phone_number}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-slate-500 mb-2">Account Details</h3>
                                <div className="grid grid-cols-2 gap-4">
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
                                        <p className="text-sm text-slate-900">{new Date(selectedTenant.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-200">
                                {selectedTenant.status !== 'active' && (
                                    <button
                                        onClick={() => handleStatusChange(selectedTenant._id, 'active')}
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        Approve / Activate
                                    </button>
                                )}
                                {selectedTenant.status !== 'suspended' && (
                                    <button
                                        onClick={() => handleStatusChange(selectedTenant._id, 'suspended')}
                                        className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                                    >
                                        Suspend
                                    </button>
                                )}
                                {selectedTenant.status !== 'inactive' && (
                                    <button
                                        onClick={() => handleStatusChange(selectedTenant._id, 'inactive')}
                                        className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        Deactivate
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TenantsPage;
