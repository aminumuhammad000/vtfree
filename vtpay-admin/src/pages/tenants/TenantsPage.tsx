import React, { useState, useEffect } from 'react';
import type { Tenant } from '../../api/client';

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
            // Mock data since admin endpoints don't exist yet
            const mockTenants: Tenant[] = [
                {
                    _id: '1',
                    email: 'tenant1@example.com',
                    firstName: 'John',
                    lastName: 'Doe',
                    fullName: 'John Doe',
                    phone: '+234 800 123 4567',
                    businessName: 'ABC Corp',
                    kycLevel: 3,
                    status: 'active',
                    apiKey: 'sk_live_*********************',
                    createdAt: '2024-01-15T10:30:00Z',
                    updatedAt: '2024-12-10T14:20:00Z',
                },
                {
                    _id: '2',
                    email: 'tenant2@example.com',
                    firstName: 'Jane',
                    lastName: 'Smith',
                    fullName: 'Jane Smith',
                    phone: '+234 800 234 5678',
                    businessName: 'XYZ Ltd',
                    kycLevel: 2,
                    status: 'active',
                    apiKey: 'sk_live_*********************',
                    createdAt: '2024-02-20T09:15:00Z',
                    updatedAt: '2024-12-15T11:45:00Z',
                },
                {
                    _id: '3',
                    email: 'tenant3@example.com',
                    firstName: 'Mike',
                    lastName: 'Johnson',
                    fullName: 'Mike Johnson',
                    phone: '+234 800 345 6789',
                    businessName: 'DEF Inc',
                    kycLevel: 1,
                    status: 'suspended',
                    apiKey: 'sk_test_*********************',
                    createdAt: '2024-03-10T16:00:00Z',
                    updatedAt: '2024-12-12T08:30:00Z',
                },
            ];
            setTenants(mockTenants);
        } catch (error) {
            console.error('Failed to fetch tenants:', error);
        } finally {
            setLoading(false);
        }
    };

    const getKycLevelBadge = (level: number) => {
        const badges = {
            0: { text: 'Unverified', color: 'bg-gray-100 text-gray-800' },
            1: { text: 'Email Verified', color: 'bg-blue-100 text-blue-800' },
            2: { text: 'KYC Submitted', color: 'bg-yellow-100 text-yellow-800' },
            3: { text: 'KYC Approved', color: 'bg-green-100 text-green-800' },
        };
        const badge = badges[level as keyof typeof badges] || badges[0];
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>{badge.text}</span>;
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            active: 'bg-green-100 text-green-800',
            suspended: 'bg-red-100 text-red-800',
            pending: 'bg-yellow-100 text-yellow-800',
        };
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status as keyof typeof badges]}`}>{status.toUpperCase()}</span>;
    };

    const filteredTenants = tenants.filter(tenant => {
        const matchesSearch = tenant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tenant.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tenant.businessName?.toLowerCase().includes(searchQuery.toLowerCase());
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
                    <p className="text-sm font-medium text-slate-500">KYC Approved</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">
                        {tenants.filter(t => t.kycLevel === 3).length}
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
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="pending">Pending</option>
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
                                                <div className="text-sm font-medium text-slate-900">{tenant.fullName}</div>
                                                <div className="text-sm text-slate-500">{tenant.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-900">{tenant.businessName || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getKycLevelBadge(tenant.kycLevel)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(tenant.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {new Date(tenant.createdAt).toLocaleDateString()}
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
                                            <button className="text-slate-600 hover:text-slate-900">
                                                Manage
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
                                    <h2 className="text-xl font-bold text-slate-900">{selectedTenant.fullName}</h2>
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500">KYC Level</p>
                                        {getKycLevelBadge(selectedTenant.kycLevel)}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Status</p>
                                        {getStatusBadge(selectedTenant.status)}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">API Key</p>
                                        <p className="text-sm font-mono text-slate-900">{selectedTenant.apiKey}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Created</p>
                                        <p className="text-sm text-slate-900">{new Date(selectedTenant.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-200">
                                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                    Activate
                                </button>
                                <button className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                                    Suspend
                                </button>
                                <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                                    Freeze
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TenantsPage;
