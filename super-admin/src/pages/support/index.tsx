import { useState } from 'react';
import { Icon } from '@iconify/react';
import StatsCard from '../../components/dashboard/StatsCard';

interface Ticket {
    id: string;
    subject: string;
    user: string;
    email: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in-progress' | 'resolved' | 'closed';
    category: string;
    createdAt: string;
    lastUpdated: string;
}

const Support = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'in-progress' | 'resolved' | 'closed'>('all');

    // Mock data
    const stats = {
        openTickets: 24,
        inProgress: 12,
        resolved: 156,
        avgResponseTime: 2.5, // hours
    };

    const tickets: Ticket[] = [
        {
            id: 'TKT-001',
            subject: 'Unable to process payment',
            user: 'Adebayo Johnson',
            email: 'adebayo.j@example.com',
            priority: 'urgent',
            status: 'open',
            category: 'Payment Issues',
            createdAt: '2025-12-16 10:30 AM',
            lastUpdated: '2025-12-16 10:45 AM',
        },
        {
            id: 'TKT-002',
            subject: 'Account verification pending',
            user: 'Chioma Okafor',
            email: 'chioma.ok@example.com',
            priority: 'high',
            status: 'in-progress',
            category: 'Account',
            createdAt: '2025-12-16 09:15 AM',
            lastUpdated: '2025-12-16 11:20 AM',
        },
        {
            id: 'TKT-003',
            subject: 'Transaction not reflected in wallet',
            user: 'Ibrahim Suleiman',
            email: 'ibrahim.s@example.com',
            priority: 'high',
            status: 'open',
            category: 'Wallet',
            createdAt: '2025-12-15 04:20 PM',
            lastUpdated: '2025-12-15 04:20 PM',
        },
        {
            id: 'TKT-004',
            subject: 'How to integrate API?',
            user: 'Blessing Nwosu',
            email: 'blessing.n@example.com',
            priority: 'medium',
            status: 'resolved',
            category: 'Technical',
            createdAt: '2025-12-15 02:45 PM',
            lastUpdated: '2025-12-15 05:30 PM',
        },
        {
            id: 'TKT-005',
            subject: 'Request for feature enhancement',
            user: 'Tunde Ajayi',
            email: 'tunde.a@example.com',
            priority: 'low',
            status: 'in-progress',
            category: 'Feature Request',
            createdAt: '2025-12-15 11:30 AM',
            lastUpdated: '2025-12-16 09:00 AM',
        },
    ];

    const filteredTickets = tickets.filter((ticket) => {
        const matchesSearch =
            ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
        const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
        return matchesSearch && matchesPriority && matchesStatus;
    });

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-50 text-red-600 border-red-200';
            case 'high':
                return 'bg-orange-50 text-orange-600 border-orange-200';
            case 'medium':
                return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'low':
                return 'bg-blue-50 text-blue-600 border-blue-200';
            default:
                return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open':
                return 'bg-emerald-50 text-emerald-600';
            case 'in-progress':
                return 'bg-blue-50 text-blue-600';
            case 'resolved':
                return 'bg-green-50 text-green-600';
            case 'closed':
                return 'bg-slate-50 text-slate-600';
            default:
                return 'bg-slate-50 text-slate-600';
        }
    };

    return (
        <div className="px-6 py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Support & Ticketing</h1>
                    <p className="text-slate-600">
                        Manage support tickets and customer inquiries
                    </p>
                </div>

                <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300">
                    <Icon icon="solar:add-circle-bold" width="20" />
                    <span>Create Ticket</span>
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatsCard
                    label="Open Tickets"
                    value={stats.openTickets}
                    icon="solar:bell-bold"
                    bgGradient="from-emerald-500 to-teal-600"
                    lightBg="bg-emerald-50"
                    textColor="text-emerald-600"
                    trend={{ value: 5.2, isPositive: false }}
                />
                <StatsCard
                    label="In Progress"
                    value={stats.inProgress}
                    icon="solar:refresh-bold"
                    bgGradient="from-blue-500 to-cyan-600"
                    lightBg="bg-blue-50"
                    textColor="text-blue-600"
                />
                <StatsCard
                    label="Resolved (30d)"
                    value={stats.resolved}
                    icon="solar:check-circle-bold"
                    bgGradient="from-green-500 to-emerald-600"
                    lightBg="bg-green-50"
                    textColor="text-green-600"
                    trend={{ value: 12.3, isPositive: true }}
                />
                <StatsCard
                    label="Avg Response Time"
                    value={`${stats.avgResponseTime}h`}
                    icon="solar:clock-circle-bold"
                    bgGradient="from-purple-500 to-pink-600"
                    lightBg="bg-purple-50"
                    textColor="text-purple-600"
                />
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Icon
                            icon="solar:magnifer-linear"
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            width="20"
                        />
                        <input
                            type="text"
                            placeholder="Search by ticket ID, subject, or user..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>

                    {/* Priority Filter */}
                    <div className="flex gap-2 flex-wrap">
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value as any)}
                            className="px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white font-semibold text-sm"
                        >
                            <option value="all">All Priorities</option>
                            <option value="urgent">Urgent</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>

                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white font-semibold text-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Tickets Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                    <h2 className="text-2xl font-bold text-slate-900">Support Tickets</h2>
                    <p className="text-slate-600 text-sm mt-1">
                        Showing {filteredTickets.length} tickets
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Ticket ID
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Subject & User
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Priority
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTickets.map((ticket) => (
                                <tr
                                    key={ticket.id}
                                    className="hover:bg-slate-50 transition-colors duration-200"
                                >
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-sm font-bold text-slate-900">
                                            {ticket.id}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-semibold text-slate-900 mb-1">
                                                {ticket.subject}
                                            </p>
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Icon icon="solar:user-linear" width="16" />
                                                <span>{ticket.user}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                                            {ticket.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <span
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getPriorityColor(
                                                    ticket.priority
                                                )}`}
                                            >
                                                {ticket.priority.charAt(0).toUpperCase() +
                                                    ticket.priority.slice(1)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <span
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${getStatusColor(
                                                    ticket.status
                                                )}`}
                                            >
                                                <span
                                                    className={`w-1.5 h-1.5 rounded-full ${ticket.status === 'open'
                                                            ? 'bg-emerald-600'
                                                            : ticket.status === 'in-progress'
                                                                ? 'bg-blue-600'
                                                                : ticket.status === 'resolved'
                                                                    ? 'bg-green-600'
                                                                    : 'bg-slate-600'
                                                        }`}
                                                />
                                                {ticket.status
                                                    .split('-')
                                                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                                    .join(' ')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Icon icon="solar:clock-circle-linear" width="16" />
                                            <span className="text-sm">{ticket.createdAt}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                                                <Icon icon="solar:eye-bold" width="18" />
                                            </button>
                                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                <Icon icon="solar:chat-round-bold" width="18" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Empty State */}
                {filteredTickets.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                            <Icon icon="solar:ticket-bold" width="40" className="text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No tickets found</h3>
                        <p className="text-slate-600">
                            Try adjusting your search or filter settings
                        </p>
                    </div>
                )}

                {/* Footer */}
                {filteredTickets.length > 0 && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-sm text-slate-600">
                            Showing <span className="font-semibold">{filteredTickets.length}</span>{' '}
                            of <span className="font-semibold">{tickets.length}</span> tickets
                        </p>
                        <button className="text-emerald-600 font-semibold text-sm hover:text-emerald-700 transition-colors">
                            View All Tickets →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Support;
