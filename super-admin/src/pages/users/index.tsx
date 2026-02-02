import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import paths from 'routes/paths';
import { UserService, User as BackendUser } from 'services/user.service';
import { toast } from 'react-hot-toast';

type UserType = 'vtfree-users' | 'admin-users';

interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: 'active' | 'suspended' | 'pending';
    balance?: number;
    date: string;
    type: UserType;
    virtual_account?: { bank: string; account_number: string } | null;
    role?: string;
    app_id?: string;
    lastActive?: string;
}

const Users = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<UserType>('vtfree-users');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
    const [owners, setOwners] = useState<User[]>([]);
    const [admins, setAdmins] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllData();
    }, []);

    const mapBackendToFrontend = (u: BackendUser, type: UserType): User => ({
        id: u._id,
        name: `${u.first_name} ${u.last_name}`,
        email: u.email,
        phone: u.phone_number || 'N/A',
        status: u.status,
        balance: u.wallet_balance,
        date: new Date(u.created_at).toLocaleDateString(),
        type: type,
        role: u.role,
        app_id: u.app_id,
        lastActive: u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'
    });

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [ownersData, adminsData] = await Promise.all([
                UserService.getOwners(),
                UserService.getAdmins()
            ]);

            setOwners(ownersData.map(u => mapBackendToFrontend(u, 'vtfree-users')));
            setAdmins(adminsData.map(u => mapBackendToFrontend(u, 'admin-users')));
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const currentUsers = activeTab === 'vtfree-users' ? owners : admins;

    const filteredUsers = currentUsers.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm)
    );

    const stats = {
        total: currentUsers.length,
        active: currentUsers.filter(u => u.status === 'active').length,
        suspended: currentUsers.filter(u => u.status === 'suspended').length,
        pending: currentUsers.filter(u => u.status === 'pending').length,
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'suspended': return 'bg-red-100 text-red-700 border-red-200';
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const handleBulkAction = (action: string) => {
        console.log(`Performing ${action} on users:`, selectedUsers);
        // Implement bulk action logic
        setSelectedUsers([]);
    };

    const handleUserAction = async (userId: string, action: string) => {
        setActionMenuOpen(null);
        let status: 'active' | 'suspended' | 'pending' = 'active';

        if (action === 'approve') status = 'active';
        else if (action === 'suspend') status = 'suspended';
        else if (action === 'ban') status = 'suspended'; // Or add a 'banned' status if supported

        try {
            let success = false;
            if (activeTab === 'vtfree-users') {
                success = await UserService.updateOwnerStatus(userId, status);
            } else {
                success = await UserService.updateAdminStatus(userId, status);
            }

            if (success) {
                toast.success(`User ${action}ed successfully`);
                // Refresh data
                fetchAllData();
            }
        } catch (error) {
            console.error(`Error performing ${action} on user:`, error);
            toast.error(`Failed to ${action} user`);
        }
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedUsers.length === filteredUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(filteredUsers.map(u => u.id));
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
                    <p className="text-slate-500 mt-1">Manage and monitor user accounts across the platform</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:border-emerald-500 hover:text-emerald-600 transition-all flex items-center gap-2">
                        <Icon icon="solar:import-bold" width="20" />
                        <span>Import</span>
                    </button>
                    <button className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                        <Icon icon="solar:user-plus-bold" width="20" />
                        <span>Add User</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-5 border-2 border-slate-100 hover:border-emerald-200 transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Users</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</p>
                        </div>
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <Icon icon="solar:users-group-rounded-bold" className="text-white" width="28" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-5 border-2 border-slate-100 hover:border-emerald-200 transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active</p>
                            <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.active}</p>
                        </div>
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                            <Icon icon="solar:check-circle-bold" className="text-white" width="28" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-5 border-2 border-slate-100 hover:border-red-200 transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Suspended</p>
                            <p className="text-3xl font-bold text-red-600 mt-1">{stats.suspended}</p>
                        </div>
                        <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                            <Icon icon="solar:shield-warning-bold" className="text-white" width="28" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-5 border-2 border-slate-100 hover:border-amber-200 transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pending</p>
                            <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pending}</p>
                        </div>
                        <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                            <Icon icon="solar:clock-circle-bold" className="text-white" width="28" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 bg-white rounded-t-2xl">
                <div className="flex gap-2 overflow-x-auto px-6 pt-4">
                    <button
                        onClick={() => setActiveTab('vtfree-users')}
                        className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all duration-300 border-b-2 whitespace-nowrap ${activeTab === 'vtfree-users'
                            ? 'border-emerald-600 text-emerald-600'
                            : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                            }`}
                    >
                        <Icon icon="solar:users-group-rounded-bold" width="20" />
                        <span>VTFree Users</span>
                        <span className="ml-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                            {owners.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('admin-users')}
                        className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all duration-300 border-b-2 whitespace-nowrap ${activeTab === 'admin-users'
                            ? 'border-emerald-600 text-emerald-600'
                            : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                            }`}
                    >
                        <Icon icon="solar:shield-user-bold" width="20" />
                        <span>Admin Users</span>
                        <span className="ml-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                            {admins.length}
                        </span>
                    </button>
                </div>
            </div>

            {/* Search and Actions Bar */}
            <div className="bg-white rounded-b-2xl border-t border-slate-200 p-6 space-y-4">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 w-full lg:max-w-md">
                        <Icon icon="solar:magnifer-linear" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" width="20" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 w-full lg:w-auto">
                        <button className="flex-1 lg:flex-none px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                            <Icon icon="solar:filter-bold" width="18" />
                            <span className="font-semibold">Filter</span>
                        </button>
                        <button className="flex-1 lg:flex-none px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                            <Icon icon="solar:sort-bold" width="18" />
                            <span className="font-semibold">Sort</span>
                        </button>
                        <button className="flex-1 lg:flex-none px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                            <Icon icon="solar:download-bold" width="18" />
                            <span className="font-semibold">Export</span>
                        </button>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedUsers.length > 0 && (
                    <div className="flex items-center justify-between p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Icon icon="solar:check-circle-bold" className="text-emerald-600" width="24" />
                            <span className="font-semibold text-emerald-900">
                                {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleBulkAction('approve')}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-semibold text-sm"
                            >
                                Approve
                            </button>
                            <button
                                onClick={() => handleBulkAction('suspend')}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-semibold text-sm"
                            >
                                Suspend
                            </button>
                            <button
                                onClick={() => setSelectedUsers([])}
                                className="px-4 py-2 bg-white border-2 border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-semibold text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-5 h-5 rounded border-2 border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                    />
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Contact</th>
                                {activeTab === 'vtfree-users' && (
                                    <>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Balance</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Virtual Account</th>
                                    </>
                                )}
                                {activeTab === 'admin-users' && (
                                    <>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">App ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Role</th>
                                    </>
                                )}
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Last Active</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                            <p className="text-slate-500 font-medium">Loading users...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.map((user) => (
                                <tr
                                    key={user.id}
                                    className="hover:bg-slate-50 transition-colors group"
                                >
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.id)}
                                            onChange={() => toggleUserSelection(user.id)}
                                            className="w-5 h-5 rounded border-2 border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-emerald-100">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{user.name}</p>
                                                <p className="text-xs text-slate-500">ID: {user.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm text-slate-900 font-medium">{user.email}</span>
                                            <span className="text-xs text-slate-500">{user.phone}</span>
                                        </div>
                                    </td>
                                    {activeTab === 'vtfree-users' && (
                                        <>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-slate-900">₦{user.balance?.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.virtual_account ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-slate-900">{user.virtual_account.bank}</span>
                                                        <span className="text-xs text-slate-500 font-mono">{user.virtual_account.account_number}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">Not created</span>
                                                )}
                                            </td>
                                        </>
                                    )}
                                    {activeTab === 'admin-users' && (
                                        <>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-mono text-slate-600">{user.app_id || 'N/A'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold">
                                                    {user.role}
                                                </span>
                                            </td>
                                        </>
                                    )}
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${getStatusColor(user.status)}`}>
                                                {user.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {user.lastActive}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2 relative">
                                            <button
                                                onClick={() => navigate(`${paths.users}/${user.id}`, { state: { type: user.type } })}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="View Details"
                                            >
                                                <Icon icon="solar:eye-bold" width="20" />
                                            </button>
                                            <button
                                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                title="Edit"
                                            >
                                                <Icon icon="solar:pen-bold" width="20" />
                                            </button>
                                            <div className="relative">
                                                <button
                                                    onClick={() => setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)}
                                                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                                    title="More Actions"
                                                >
                                                    <Icon icon="solar:menu-dots-bold" width="20" />
                                                </button>
                                                {actionMenuOpen === user.id && (
                                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border-2 border-slate-100 py-2 z-50">
                                                        <button
                                                            onClick={() => handleUserAction(user.id, 'approve')}
                                                            className="w-full px-4 py-2.5 text-left text-sm text-emerald-600 hover:bg-emerald-50 transition-all flex items-center gap-2"
                                                        >
                                                            <Icon icon="solar:check-circle-bold" width="18" />
                                                            <span>Approve</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleUserAction(user.id, 'suspend')}
                                                            className="w-full px-4 py-2.5 text-left text-sm text-amber-600 hover:bg-amber-50 transition-all flex items-center gap-2"
                                                        >
                                                            <Icon icon="solar:pause-circle-bold" width="18" />
                                                            <span>Suspend</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleUserAction(user.id, 'ban')}
                                                            className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-all flex items-center gap-2"
                                                        >
                                                            <Icon icon="solar:shield-warning-bold" width="18" />
                                                            <span>Ban User</span>
                                                        </button>
                                                        <div className="border-t border-slate-100 my-1"></div>
                                                        <button
                                                            onClick={() => handleUserAction(user.id, 'delete')}
                                                            className="w-full px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-50 transition-all flex items-center gap-2"
                                                        >
                                                            <Icon icon="solar:trash-bin-trash-bold" width="18" />
                                                            <span>Delete</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                                <Icon icon="solar:users-group-rounded-linear" className="text-slate-400" width="48" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-1">No users found</h3>
                                            <p className="text-slate-500">Try adjusting your search or filters</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredUsers.length > 0 && (
                    <div className="px-6 py-4 bg-slate-50 border-t-2 border-slate-200 flex items-center justify-between">
                        <p className="text-sm text-slate-600">
                            Showing <span className="font-bold text-slate-900">{filteredUsers.length}</span> of <span className="font-bold text-slate-900">{currentUsers.length}</span> users
                        </p>
                        <div className="flex gap-2">
                            <button className="px-4 py-2 border-2 border-slate-200 rounded-lg text-slate-600 hover:border-slate-300 hover:bg-white transition-all font-semibold text-sm">
                                Previous
                            </button>
                            <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-semibold text-sm">
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Users;
