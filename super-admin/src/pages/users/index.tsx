import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getUsers, getApps } from 'api/superAdminApi';

interface User {
    _id: string;
    phone_number: string;
    email?: string;
    first_name: string;
    last_name: string;
    app_name: string;
    owner_name: string;
    total_transactions?: number;
    total_spent?: number;
    last_transaction?: string;
    status: string;
    created_at: string;
}

interface App {
    app_id: string;
    app_name: string;
}

const Users = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [apps, setApps] = useState<App[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [appFilter, setAppFilter] = useState('all');

    const fetchData = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (searchTerm) params.search = searchTerm;
            if (appFilter !== 'all') params.app_id = appFilter;

            const [usersRes, appsRes] = await Promise.all([
                getUsers(params),
                getApps()
            ]);

            if (usersRes.data.success) setUsers(usersRes.data.data.users);
            if (appsRes.data.success) setApps(appsRes.data.data.apps);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [appFilter, statusFilter]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const stats = [
        { label: 'Total Users', value: users.length, icon: 'solar:users-group-rounded-bold-duotone', color: 'blue' },
        { label: 'Active', value: users.filter(c => c.status === 'active').length, icon: 'solar:user-check-bold-duotone', color: 'green' },
        { label: 'Total Apps', value: apps.length, icon: 'solar:smartphone-bold-duotone', color: 'purple' },
        { label: 'Suspended', value: users.filter(c => c.status === 'suspended').length, icon: 'solar:user-block-bold-duotone', color: 'red' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
                <p className="text-slate-500 mt-1">Monitor and manage all platform users</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl p-5 border border-slate-100 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl bg-slate-50`}>
                                <Icon icon={stat.icon} width="24" height="24" className="text-slate-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                                <p className="text-sm text-slate-500">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                        <div className="relative">
                            <Icon icon="solar:magnifer-linear" width="20" height="20" className="absolute left-3 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <select
                            value={appFilter}
                            onChange={(e) => setAppFilter(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        >
                            <option value="all">All Apps</option>
                            {apps.map(app => (
                                <option key={app.app_id} value={app.app_id}>{app.app_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">User</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">App</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Joined</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center">
                                    <div className="flex justify-center"><div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>
                                </td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No users found</td></tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                                                    {user.first_name ? user.first_name[0] : '?'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-900 truncate">{user.first_name} {user.last_name}</p>
                                                    <p className="text-xs text-slate-500 truncate">{user.phone_number}</p>
                                                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-slate-900">{user.app_name}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-green-100 text-green-700' :
                                                user.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                                <Icon icon="solar:menu-dots-bold" width="20" height="20" className="text-slate-400" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Users;

