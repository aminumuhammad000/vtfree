import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    FiMessageSquare,
    FiSearch,
    FiFilter,
    FiRefreshCw,
    FiChevronLeft,
    FiChevronRight,
    FiEye,
    FiAlertCircle,
    FiClock,
    FiFlag
} from 'react-icons/fi';
import { getSupportMessages } from '../api/adminApi';
import Layout from '../components/Layout';
import SupportViewModal from '../components/SupportViewModal';

const Support: React.FC = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [viewTicket, setViewTicket] = useState<any | null>(null);
    const limit = 20;

    // Debounce search term
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (searchTimer.current) clearTimeout(searchTimer.current as any);
        searchTimer.current = setTimeout(() => {
            setDebouncedSearch(searchTerm.trim());
            setPage(1);
        }, 400);
        return () => {
            if (searchTimer.current) clearTimeout(searchTimer.current as any);
        };
    }, [searchTerm]);

    const { data, status, isError, isFetching } = useQuery({
        queryKey: ['support-messages', page, statusFilter, priorityFilter, debouncedSearch],
        queryFn: () => getSupportMessages({
            page,
            limit,
            status: statusFilter || undefined,
            priority: priorityFilter || undefined,
            search: debouncedSearch || undefined
        }).then((res: any) => res.data),
    });

    const messages = data?.data || [];
    const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

    const getStatusStyles = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'new':
                return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'replied':
                return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'resolved':
                return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            default:
                return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const getPriorityStyles = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return 'bg-red-50 text-red-600 border-red-100';
            case 'medium':
                return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'low':
                return 'bg-slate-50 text-slate-500 border-slate-100';
            default:
                return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    return (
        <Layout>
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black text-slate-900 tracking-tight">Support Desk</h1>
                            <p className="text-sm sm:text-lg text-slate-500 font-medium max-w-2xl">Manage user inquiries and technical assistance requests with our centralized support system.</p>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="bg-white px-6 py-4 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4 min-w-[160px]">
                                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                                    <FiMessageSquare className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-slate-900 leading-none">{pagination.total}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Tickets</p>
                                </div>
                            </div>
                            <button
                                onClick={() => queryClient.invalidateQueries({ queryKey: ['support-messages'] })}
                                className="p-5 bg-white border border-slate-200 rounded-[2rem] text-slate-600 hover:text-green-600 transition-all shadow-sm active:scale-95 group"
                                title="Refresh Data"
                            >
                                <FiRefreshCw className={`w-6 h-6 ${isFetching ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Filters & Search */}
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Tickets</label>
                                <div className="relative group">
                                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Subject, email, or ID..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white outline-none font-bold text-slate-700 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Filter</label>
                                <div className="relative group">
                                    <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                        className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white outline-none font-bold text-slate-700 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="new">New / Unread</option>
                                        <option value="replied">Replied</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                    <FiChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority Level</label>
                                <div className="relative group">
                                    <FiFlag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                                    <select
                                        value={priorityFilter}
                                        onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
                                        className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white outline-none font-bold text-slate-700 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">All Priorities</option>
                                        <option value="high">High Priority</option>
                                        <option value="medium">Medium Priority</option>
                                        <option value="low">Low Priority</option>
                                    </select>
                                    <FiChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
                                </div>
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        setStatusFilter('');
                                        setPriorityFilter('');
                                        setSearchTerm('');
                                        setPage(1);
                                    }}
                                    className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                        {status === 'pending' ? (
                            <div className="p-24 text-center space-y-6">
                                <div className="relative w-16 h-16 mx-auto">
                                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-t-green-600 rounded-full animate-spin"></div>
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Inbox...</p>
                            </div>
                        ) : isError ? (
                            <div className="p-24 text-center space-y-6">
                                <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto">
                                    <FiAlertCircle className="w-10 h-10 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-slate-900">Connection Error</p>
                                    <p className="text-sm text-slate-500 font-medium mt-1">We couldn't retrieve the support tickets. Please try again.</p>
                                </div>
                                <button
                                    onClick={() => queryClient.invalidateQueries({ queryKey: ['support-messages'] })}
                                    className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all"
                                >
                                    Retry Connection
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">User Identity</th>
                                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ticket Details</th>
                                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Priority</th>
                                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timeline</th>
                                                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {messages.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-8 py-32 text-center">
                                                        <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                                            <FiMessageSquare className="w-10 h-10 text-slate-200" />
                                                        </div>
                                                        <h3 className="text-xl font-black text-slate-900">No Tickets Found</h3>
                                                        <p className="text-sm text-slate-500 font-medium mt-2 max-w-xs mx-auto">There are no support tickets matching your current filter criteria.</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                messages.map((msg: any) => (
                                                    <tr key={msg._id} className="hover:bg-slate-50/80 transition-all group">
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-black text-sm shadow-sm border border-white">
                                                                    {msg.user_id?.first_name?.[0]}{msg.user_id?.last_name?.[0]}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black text-slate-900 leading-tight group-hover:text-green-600 transition-colors">
                                                                        {msg.user_id?.first_name} {msg.user_id?.last_name}
                                                                    </p>
                                                                    <p className="text-[11px] font-bold text-slate-400 mt-0.5">{msg.user_id?.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="max-w-xs">
                                                                <p className="text-sm font-black text-slate-900 truncate">{msg.subject}</p>
                                                                <p className="text-[11px] font-medium text-slate-400 truncate mt-1">
                                                                    {msg.description || msg.message}
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${getPriorityStyles(msg.priority)}`}>
                                                                {msg.priority}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusStyles(msg.status)}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${msg.status === 'new' ? 'bg-blue-500 animate-pulse' :
                                                                    msg.status === 'replied' ? 'bg-amber-500' :
                                                                        'bg-emerald-500'
                                                                    }`}></span>
                                                                {msg.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2 text-[11px] font-black text-slate-700">
                                                                    <FiClock className="w-3.5 h-3.5 text-slate-400" />
                                                                    {new Date(msg.created_at).toLocaleDateString(undefined, {
                                                                        month: 'short',
                                                                        day: 'numeric'
                                                                    })}
                                                                </div>
                                                                <p className="text-[10px] font-bold text-slate-400 ml-5">
                                                                    {new Date(msg.created_at).toLocaleTimeString(undefined, {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-right">
                                                            <button
                                                                onClick={() => setViewTicket(msg)}
                                                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-slate-200 hover:shadow-green-100"
                                                            >
                                                                <FiEye className="w-4 h-4" />
                                                                View Ticket
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <div className="bg-slate-50/30 border-t border-slate-100 px-8 py-8 flex flex-col sm:flex-row justify-between items-center gap-6">
                                    <div className="flex items-center gap-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                            Showing <span className="text-slate-900">{messages.length}</span> of <span className="text-slate-900">{pagination.total}</span> Results
                                        </p>
                                        <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hidden sm:block">
                                            Page <span className="text-slate-900">{pagination.page}</span> / {pagination.pages}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-green-600 hover:border-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            <FiChevronLeft className="w-4 h-4" />
                                            Previous
                                        </button>
                                        <button
                                            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-green-600 hover:border-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                                            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                                            disabled={page === pagination.pages}
                                        >
                                            Next Page
                                            <FiChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Modals */}
                {viewTicket && (
                    <SupportViewModal
                        ticket={viewTicket}
                        onClose={() => setViewTicket(null)}
                    />
                )}
            </div>
        </Layout>
    );
};

export default Support;
