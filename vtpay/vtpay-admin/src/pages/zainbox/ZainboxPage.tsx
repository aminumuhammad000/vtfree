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

    const [createFormData, setCreateFormData] = useState({
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
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">₦4.2M</h3>
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

            {/* Zainboxes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full p-8 text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                        <p className="mt-2 text-slate-500">Loading zainboxes...</p>
                    </div>
                ) : (
                    filteredZainboxes.map((zainbox) => (
                        <div
                            key={zainbox._id}
                            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => {
                                setSelectedZainbox(zainbox);
                                setShowDetails(true);
                            }}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-slate-900">{zainbox.name}</h3>
                                    <p className="text-sm text-slate-500 mt-1 font-mono">{zainbox.zainboxCode}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${zainbox.isLive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {zainbox.isLive ? 'LIVE' : 'SANDBOX'}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm text-slate-600">{zainbox.emailNotification}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    <span className="text-sm text-slate-600">{zainbox.tags}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                                <span className="text-xs text-slate-500">
                                    Created {new Date(zainbox.createdAt).toLocaleDateString()}
                                </span>
                                <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                                    View Details →
                                </button>
                            </div>
                        </div>
                    ))
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
                                <h3 className="text-sm font-medium text-slate-900 mb-3">Balances (Mock Data)</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                        <p className="text-xs text-green-600 font-medium">Available Balance</p>
                                        <p className="text-lg font-bold text-green-900 mt-1">₦1,450,000</p>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <p className="text-xs text-blue-600 font-medium">Pending</p>
                                        <p className="text-lg font-bold text-blue-900 mt-1">₦120,000</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <p className="text-xs text-slate-600 font-medium">Total</p>
                                        <p className="text-lg font-bold text-slate-900 mt-1">₦1,570,000</p>
                                    </div>
                                </div>
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
        </div>
    );
};

export default ZainboxPage;
