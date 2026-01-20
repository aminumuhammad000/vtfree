import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiSearch, FiEdit2, FiTrash2, FiCheckCircle, FiEye, FiRefreshCw } from 'react-icons/fi';
import { deleteUser, getUsers, updateUser, updateUserStatus } from '../api/adminApi';
import Layout from '../components/Layout';
import UserDeleteModal from '../components/UserDeleteModal';
import UserEditModal from '../components/UserEditModal';
import UserStatusModal from '../components/UserStatusModal';
import UserViewModal from '../components/UserViewModal';
import { useToast } from '../hooks/ToastContext';

const Users: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const limit = 10;

  const { data, status, refetch } = useQuery({
    queryKey: ['users', page, debouncedSearch],
    queryFn: () => getUsers({ page, limit, search: debouncedSearch || undefined }).then((res: any) => res.data),
  });

  const users = data?.data || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  // Debounce search term
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchTerm]);

  const [viewUser, setViewUser] = useState<any | null>(null);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [statusUser, setStatusUser] = useState<any | null>(null);
  const [deleteUserObj, setDeleteUserObj] = useState<any | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      showSuccess('Users list updated');
    } catch (err) {
      showError('Failed to refresh users');
    } finally {
      setIsRefreshing(false);
    }
  };

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateUserStatus(statusUser._id, status).then((res: any) => res.data),
    onSuccess: () => {
      setStatusUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showSuccess('User status updated');
    },
    onError: (err: any) => showError(err.response?.data?.message || 'Failed to update status'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(deleteUserObj._id).then((res: any) => res.data),
    onSuccess: () => {
      setDeleteUserObj(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showSuccess('User deleted successfully');
    },
    onError: (err: any) => showError(err.response?.data?.message || 'Failed to delete user'),
  });

  const editMutation = useMutation({
    mutationFn: (data: any) => updateUser(editUser._id, data).then((res: any) => res.data),
    onSuccess: () => {
      setEditUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showSuccess('User updated successfully');
    },
    onError: (err: any) => showError(err.response?.data?.message || 'Failed to update user'),
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'suspended':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'inactive':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getKycColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'verified':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pending':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'rejected':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <Layout>
      <div className="p-3 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-2 tracking-tight">Users Management</h1>
              <p className="text-sm sm:text-lg text-slate-600 font-medium">Manage and monitor all platform users</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50 group"
              >
                <FiRefreshCw className={`w-4 h-4 text-green-600 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <div className="flex-1 sm:flex-none relative bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-md px-4 py-2 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 bg-white/10 rounded-full blur-xl"></div>
                <div className="relative">
                  <p className="text-xs font-bold uppercase tracking-wider text-green-100 opacity-80">Total Users</p>
                  <p className="text-xl font-black">{pagination.total?.toLocaleString() || users.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-slate-700"
              />
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">All Users</h2>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider">Real-time Data</span>
              </div>
            </div>

            {status === 'pending' && (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent mb-4"></div>
                <p className="text-slate-500 font-medium">Loading users...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4">
                  <FiTrash2 className="w-6 h-6" />
                </div>
                <p className="text-red-500 font-medium">Failed to load users.</p>
              </div>
            )}

            {status === 'success' && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">User Info</th>
                        <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Contact</th>
                        <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Status</th>
                        <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">KYC</th>
                        <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">No users found matching your search.</td>
                        </tr>
                      )}
                      {users.map((user: any) => (
                        <tr key={user._id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                                {`${user.first_name?.[0] || 'U'}${user.last_name?.[0] || 'U'}`.toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900">{user.first_name} {user.last_name}</span>
                                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">ID: {user._id?.slice(-8)}</span>
                                <div className="md:hidden mt-1 flex flex-col gap-0.5">
                                  <span className="text-[10px] font-medium text-slate-500">{user.email}</span>
                                  <span className={`inline-flex w-fit px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${getStatusColor(user.status)}`}>{user.status}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-700">{user.email}</span>
                              <span className="text-xs text-slate-500">{user.phone_number || 'No phone'}</span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(user.status)}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 hidden lg:table-cell">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getKycColor(user.kyc_status)}`}>
                              {user.kyc_status || 'NOT STARTED'}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setViewUser(user)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                title="View Details"
                              >
                                <FiEye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditUser(user)}
                                className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                                title="Edit User"
                              >
                                <FiEdit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setStatusUser(user)}
                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                title="Change Status"
                              >
                                <FiCheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteUserObj(user)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                title="Delete User"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Section */}
                <div className="p-4 sm:p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs sm:text-sm font-bold text-slate-500">
                    Showing <span className="text-slate-900">{users.length}</span> of <span className="text-slate-900">{pagination.total || users.length}</span> users
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1 px-2">
                      <span className="text-xs font-bold text-slate-900">{page}</span>
                      <span className="text-xs font-bold text-slate-400">/</span>
                      <span className="text-xs font-bold text-slate-400">{pagination.pages}</span>
                    </div>
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                      disabled={page === pagination.pages}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Modals */}
        {viewUser && (
          <UserViewModal user={viewUser} onClose={() => setViewUser(null)} />
        )}
        {editUser && (
          <UserEditModal
            user={editUser}
            onClose={() => setEditUser(null)}
            onSave={editMutation.mutate}
            isSaving={editMutation.status === 'pending'}
          />
        )}
        {statusUser && (
          <UserStatusModal
            user={statusUser}
            onClose={() => setStatusUser(null)}
            onSave={statusMutation.mutate}
            isSaving={statusMutation.status === 'pending'}
          />
        )}
        {deleteUserObj && (
          <UserDeleteModal
            user={deleteUserObj}
            onClose={() => setDeleteUserObj(null)}
            onDelete={deleteMutation.mutate}
            isDeleting={deleteMutation.status === 'pending'}
          />
        )}
      </div>
    </Layout>
  );
};

export default Users;
