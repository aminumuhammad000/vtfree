import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/client';
import toast from 'react-hot-toast';

const CommunicationsPage: React.FC = () => {
    const [recipientType, setRecipientType] = useState<'all' | 'active' | 'specific'>('all');
    const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [tenants, setTenants] = useState<any[]>([]);
    const [userSearchQuery, setUserSearchQuery] = useState('');

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const data = await adminApi.getAllTenants();
            setTenants(data);
        } catch (error) {
            console.error('Failed to fetch tenants:', error);
        }
    };

    const toggleTenantSelection = (tenantId: string) => {
        setSelectedTenants(prev =>
            prev.includes(tenantId)
                ? prev.filter(id => id !== tenantId)
                : [...prev, tenantId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedTenants.length === filteredTenantsForSelection.length) {
            setSelectedTenants([]);
        } else {
            setSelectedTenants(filteredTenantsForSelection.map(t => t._id));
        }
    };

    const filteredTenantsForSelection = tenants.filter(tenant =>
        (tenant.email?.toLowerCase() || '').includes(userSearchQuery.toLowerCase()) ||
        (tenant.firstName?.toLowerCase() || '').includes(userSearchQuery.toLowerCase()) ||
        (tenant.lastName?.toLowerCase() || '').includes(userSearchQuery.toLowerCase()) ||
        (tenant.businessName?.toLowerCase() || '').includes(userSearchQuery.toLowerCase())
    );

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();

        if (recipientType === 'specific' && selectedTenants.length === 0) {
            toast.error('Please select at least one tenant');
            return;
        }

        setSending(true);

        try {
            await adminApi.sendBulkEmail({
                recipientType,
                selectedTenants,
                subject,
                message,
            });
            toast.success('Email sent successfully!');
            setSubject('');
            setMessage('');
            setRecipientType('all');
            setSelectedTenants([]);
        } catch (error) {
            console.error('Failed to send email:', error);
            toast.error('Failed to send email');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Communications</h1>
                <p className="text-sm text-slate-500 mt-1">Send email announcements and notifications to tenants</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Compose Email Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <form onSubmit={handleSend} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Recipients</label>
                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="recipientType"
                                            value="all"
                                            checked={recipientType === 'all'}
                                            onChange={(e) => setRecipientType(e.target.value as any)}
                                            className="w-4 h-4 text-green-600 focus:ring-green-500"
                                        />
                                        <span className="text-sm text-slate-700">All Tenants</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="recipientType"
                                            value="active"
                                            checked={recipientType === 'active'}
                                            onChange={(e) => setRecipientType(e.target.value as any)}
                                            className="w-4 h-4 text-green-600 focus:ring-green-500"
                                        />
                                        <span className="text-sm text-slate-700">Active Tenants Only</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="recipientType"
                                            value="specific"
                                            checked={recipientType === 'specific'}
                                            onChange={(e) => setRecipientType(e.target.value as any)}
                                            className="w-4 h-4 text-green-600 focus:ring-green-500"
                                        />
                                        <span className="text-sm text-slate-700">Specific Tenants</span>
                                    </label>
                                </div>
                            </div>

                            {recipientType === 'specific' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-sm font-medium text-slate-700">Select Tenants ({selectedTenants.length} selected)</label>
                                        <input
                                            type="text"
                                            placeholder="Search users..."
                                            value={userSearchQuery}
                                            onChange={(e) => setUserSearchQuery(e.target.value)}
                                            className="px-3 py-1 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
                                        />
                                    </div>

                                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                                        <div className="max-h-64 overflow-y-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-2 w-10">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedTenants.length > 0 && selectedTenants.length === filteredTenantsForSelection.length}
                                                                onChange={toggleSelectAll}
                                                                className="rounded text-green-600 focus:ring-green-500"
                                                            />
                                                        </th>
                                                        <th className="px-4 py-2 font-medium text-slate-600">Name / Business</th>
                                                        <th className="px-4 py-2 font-medium text-slate-600">Email</th>
                                                        <th className="px-4 py-2 font-medium text-slate-600">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {filteredTenantsForSelection.length > 0 ? (
                                                        filteredTenantsForSelection.map(tenant => (
                                                            <tr
                                                                key={tenant._id}
                                                                className={`hover:bg-slate-50 cursor-pointer ${selectedTenants.includes(tenant._id) ? 'bg-green-50' : ''}`}
                                                                onClick={() => toggleTenantSelection(tenant._id)}
                                                            >
                                                                <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedTenants.includes(tenant._id)}
                                                                        onChange={() => toggleTenantSelection(tenant._id)}
                                                                        className="rounded text-green-600 focus:ring-green-500"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-2">
                                                                    <div className="font-medium text-slate-900">
                                                                        {tenant.businessName || `${tenant.firstName} ${tenant.lastName}`}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2 text-slate-600">{tenant.email}</td>
                                                                <td className="px-4 py-2">
                                                                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${tenant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                                                        }`}>
                                                                        {tenant.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                                                                No users found matching your search.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Select the users you want to receive this communication.</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                                <input
                                    type="text"
                                    required
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Enter email subject"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Message Body</label>
                                <textarea
                                    required
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 h-64 resize-none"
                                    placeholder="Type your message here..."
                                />
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                                >
                                    {sending ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                            Send Email
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Sidebar / Info */}
                <div className="space-y-6">
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <h3 className="text-lg font-medium text-blue-900 mb-2">Email Guidelines</h3>
                        <ul className="space-y-2 text-sm text-blue-800">
                            <li className="flex items-start gap-2">
                                <span className="mt-1">•</span>
                                Keep subject lines clear and concise.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-1">•</span>
                                Use professional language in your messages.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-1">•</span>
                                Double-check recipient selection before sending.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-1">•</span>
                                Avoid sending sensitive information via email.
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-medium text-slate-900 mb-4">Recent Communications</h3>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-sm font-medium text-slate-900">System Maintenance Update</p>
                                        <span className="text-xs text-slate-500">2 days ago</span>
                                    </div>
                                    <p className="text-xs text-slate-600 line-clamp-2">
                                        We will be performing scheduled maintenance on the payment gateway infrastructure...
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded-full">All Tenants</span>
                                        <span className="px-2 py-0.5 text-[10px] font-medium bg-green-100 text-green-600 rounded-full">Sent</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunicationsPage;
