import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

// Mock data for demonstration (will be replaced with real API data)
const mockMessages = [
    {
        _id: '1',
        user: { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        subject: 'Payment Issue',
        message: 'I made a payment but it has not reflected in my account',
        status: 'new',
        priority: 'high',
        created_at: new Date().toISOString(),
    },
    {
        _id: '2',
        user: { first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' },
        subject: 'Data Bundle Not Received',
        message: 'I purchased a data bundle 2 hours ago but haven\'t received it yet',
        status: 'replied',
        priority: 'medium',
        created_at: new Date(Date.now() - 3600000).toISOString(),
    },
];

const Support: React.FC = () => {
    const [page, setPage] = useState(1);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const limit = 20;

    // For now, we'll use mock data. When backend is ready, uncomment this:
    /*
    const { data, status } = useQuery({
      queryKey: ['support-messages', page, statusFilter, priorityFilter],
      queryFn: () => getSupportMessages({ page, limit, status: statusFilter || undefined, priority: priorityFilter || undefined }),
    });
    const messages = data?.data?.data || [];
    const pagination = data?.data?.pagination || { page: 1, pages: 1, total: 0 };
    */

    // Mock data usage
    const messages = mockMessages;
    const pagination = { page: 1, pages: 1, total: mockMessages.length };
    const status = 'success';

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'new':
                return 'bg-green-100 text-green-800';
            case 'replied':
                return 'bg-blue-100 text-blue-800';
            case 'resolved':
                return 'bg-emerald-100 text-emerald-800';
            default:
                return 'bg-slate-100 text-slate-800';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return 'bg-red-100 text-red-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'low':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar onMenuClick={() => setIsMobileOpen(true)} />
                <main className="flex-1 overflow-auto p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Support Messages</h1>
                                    <p className="text-slate-600 text-lg">View and respond to user support requests</p>
                                </div>

                                {/* Modern stats card */}
                                <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white overflow-hidden group hover-lift">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                                    <div className="relative">
                                        <p className="text-4xl font-extrabold mb-1">{pagination.total}</p>
                                        <p className="text-green-100 text-sm font-semibold uppercase tracking-wide">Total Messages</p>
                                    </div>
                                    <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/5 rounded-full"></div>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="bg-gradient-to-br from-white to-slate-50/50 rounded-2xl border border-slate-200 p-6 shadow-md hover:shadow-lg transition-shadow">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Search</label>
                                        <input
                                            type="text"
                                            placeholder="Search messages..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-slate-900 font-medium"
                                        >
                                            <option value="">All Status</option>
                                            <option value="new">New</option>
                                            <option value="replied">Replied</option>
                                            <option value="resolved">Resolved</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
                                        <select
                                            value={priorityFilter}
                                            onChange={(e) => setPriorityFilter(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-slate-900 font-medium"
                                        >
                                            <option value="">All Priority</option>
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            onClick={() => {
                                                setStatusFilter('');
                                                setPriorityFilter('');
                                                setSearchTerm('');
                                            }}
                                            className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2.5 rounded-lg transition font-medium"
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages Table */}
                        <div className="bg-gradient-to-br from-white to-slate-50/30 rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                            {/* Gradient accent line */}
                            <div className="h-1 bg-gradient-to-r from-green-400 via-green-500 to-green-600"></div>

                            {status === 'pending' && (
                                <div className="p-12 text-center">
                                    <div className="inline-block animate-spin">
                                        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    </div>
                                    <p className="mt-4 text-slate-600">Loading messages...</p>
                                </div>
                            )}

                            {status === 'error' && (
                                <div className="p-12 text-center bg-red-50">
                                    <svg className="w-12 h-12 text-red-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-red-700 font-medium">Failed to load messages</p>
                                </div>
                            )}

                            {status === 'success' && (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200">
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">User</th>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Subject</th>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Message Preview</th>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Priority</th>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Date</th>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {messages.length === 0 && (
                                                    <tr>
                                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                                            <svg className="w-12 h-12 mx-auto mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                            </svg>
                                                            <p className="font-medium">No messages found</p>
                                                        </td>
                                                    </tr>
                                                )}
                                                {messages.map((msg: any, index: number) => (
                                                    <tr key={msg._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-green-50/30 transition-colors duration-150`}>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                                                    {`${msg.user?.first_name?.[0] || 'U'}${msg.user?.last_name?.[0] || 'U'}`.toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-slate-900">{msg.user?.first_name} {msg.user?.last_name}</p>
                                                                    <p className="text-xs text-slate-500">{msg.user?.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="font-semibold text-slate-900">{msg.subject}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-sm text-slate-700 truncate max-w-xs">
                                                                {msg.message}
                                                            </p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(msg.priority)}`}>
                                                                {msg.priority?.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(msg.status)}`}>
                                                                <span className="w-2 h-2 rounded-full bg-current"></span>
                                                                {msg.status?.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-slate-700">
                                                            {new Date(msg.created_at).toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <button
                                                                className="p-2 hover:bg-green-100 text-green-600 rounded-lg transition"
                                                                title="View Message"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-between items-center">
                                        <p className="text-sm text-slate-600">
                                            Showing page <span className="font-semibold">{pagination.page}</span> of <span className="font-semibold">{pagination.pages}</span>
                                            {' '}({pagination.total} total)
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                            >
                                                ← Previous
                                            </button>
                                            <button
                                                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                                                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                                                disabled={page === pagination.pages}
                                            >
                                                Next →
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Support;
