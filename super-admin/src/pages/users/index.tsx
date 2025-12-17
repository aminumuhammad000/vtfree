import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { getUsers } from 'api/superAdminApi';

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  status: string;
  kyc_status: string;
  created_at: string;
  apps_count: number;
  wallet_balance: number;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kycFilter, setKycFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsers();
      if (response.data.success) {
        // Map backend data to frontend User interface
        const mappedUsers: User[] = response.data.data.users.map((u: any) => ({
          _id: u._id,
          first_name: u.first_name || 'N/A',
          last_name: u.last_name || 'N/A',
          email: u.email,
          phone_number: u.phone_number || 'N/A',
          status: u.status || 'active',
          kyc_status: u.kyc_status || 'pending', // Default
          created_at: u.created_at,
          apps_count: u.apps_count || 0, // Default
          wallet_balance: u.wallet_balance || 0 // Default
        }));
        setUsers(mappedUsers);
      }
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesKyc = kycFilter === 'all' || user.kyc_status === kycFilter;
    return matchesSearch && matchesStatus && matchesKyc;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'suspended': return 'bg-red-100 text-red-700';
      case 'inactive': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getKycColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const stats = [
    { label: 'Total Users', value: users.length, icon: 'solar:users-group-rounded-bold-duotone', color: 'blue' },
    { label: 'Active', value: users.filter(u => u.status === 'active').length, icon: 'solar:user-check-bold-duotone', color: 'green' },
    { label: 'Pending KYC', value: users.filter(u => u.kyc_status === 'pending').length, icon: 'solar:file-check-bold-duotone', color: 'yellow' },
    { label: 'Suspended', value: users.filter(u => u.status === 'suspended').length, icon: 'solar:user-block-bold-duotone', color: 'red' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">Monitor and manage all platform users</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all">
          <Icon icon="solar:user-plus-bold" width="20" height="20" />
          <span>Add User</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className={`bg-white rounded-xl p-5 border border-${stat.color}-100 hover:shadow-lg transition-shadow`}>
            <div className="flex items-center gap-3">
              <div className={`p-3 bg-${stat.color}-50 rounded-xl`}>
                <Icon icon={stat.icon} width="24" height="24" className={`text-${stat.color}-600`} />
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Icon icon="solar:magnifer-linear" width="20" height="20" className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* KYC Filter */}
          <div>
            <select
              value={kycFilter}
              onChange={(e) => setKycFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
            >
              <option value="all">All KYC</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden lg:table-cell">KYC</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden xl:table-cell">Apps</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden lg:table-cell">Wallet</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden xl:table-cell">Joined</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">No users found</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    onClick={() => navigate(`/pages/users/${user._id}`)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {user.first_name[0]}{user.last_name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{user.first_name} {user.last_name}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                          {user.phone_number && (
                            <a
                              href={`https://wa.me/${user.phone_number.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-green-600 hover:text-green-700 hover:underline flex items-center gap-1 mt-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Icon icon="logos:whatsapp-icon" width="12" height="12" />
                              {user.phone_number}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(user.status)}`}>
                        {user.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getKycColor(user.kyc_status)}`}>
                        {user.kyc_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium hidden xl:table-cell">{user.apps_count}</td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-700 hidden lg:table-cell">₦{user.wallet_balance.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 hidden xl:table-cell">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Icon icon="solar:menu-dots-bold" width="20" height="20" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing <span className="font-semibold">{filteredUsers.length}</span> of <span className="font-semibold">{users.length}</span> users
            </p>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium text-sm transition-colors">
                Previous
              </button>
              <button className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium text-sm transition-colors">
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
