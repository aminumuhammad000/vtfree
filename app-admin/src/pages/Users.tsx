import React, { useEffect, useRef, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deleteUser, getUsers, updateUser, updateUserStatus } from '../api/adminApi';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import UserDeleteModal from '../components/UserDeleteModal';
import UserEditModal from '../components/UserEditModal';
import UserStatusModal from '../components/UserStatusModal';
import UserViewModal from '../components/UserViewModal';

const Users: React.FC = () => {
  const [page, setPage] = useState(1);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const limit = 10;
  const { data, status } = useQuery({
    queryKey: ['users', page, debouncedSearch],
    queryFn: () => getUsers({ page, limit, search: debouncedSearch || undefined }).then((res: any) => res.data),
  });


  const users = data?.data || [];
  const pagination = data?.pagination || { page: 1, pages: 1 };

  // Debounce search term and reset to first page on change
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

  const [viewUser, setViewUser] = useState<any | null>(null);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [statusUser, setStatusUser] = useState<any | null>(null);
  const [deleteUserObj, setDeleteUserObj] = useState<any | null>(null);
  const statusMutation = useMutation({
    mutationFn: (status: string) => updateUserStatus(statusUser._id, status).then((res: any) => res.data),
    onSuccess: () => {
      setStatusUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(deleteUserObj._id).then((res: any) => res.data),
    onSuccess: () => {
      setDeleteUserObj(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const queryClient = useQueryClient();
  const editMutation = useMutation({
    mutationFn: (data: any) => updateUser(editUser._id, data).then((res: any) => res.data),
    onSuccess: () => {
      setEditUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getKycColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'verified':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
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
                  <h1 className="text-4xl font-bold text-slate-900 mb-2">Users Management</h1>
                  <p className="text-slate-600">Manage and monitor all user accounts</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">{users.length}</p>
                  <p className="text-sm text-slate-600">Active Users</p>
                </div>
              </div>

              {/* Search & Filter */}
              <div className="flex gap-4 items-center">
                <div className="flex-1 relative">
                  <svg className="absolute left-3 top-3 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {status === 'pending' && (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin">
                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <p className="mt-4 text-slate-600">Loading users...</p>
                </div>
              )}
              {status === 'error' && (
                <div className="p-12 text-center bg-red-50">
                  <svg className="w-12 h-12 text-red-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-700 font-medium">Failed to load users</p>
                </div>
              )}
              {status === 'success' && (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">User Info</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Email</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Phone</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">KYC</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {users.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                              <svg className="w-12 h-12 mx-auto mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20a9 9 0 0118 0v-2a9 9 0 00-18 0v2z" />
                              </svg>
                              <p className="font-medium">No users found</p>
                            </td>
                          </tr>
                        )}
                        {users.map((user: any) => (
                          <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                  {`${user.first_name?.[0] || 'U'}${user.last_name?.[0] || 'U'}`.toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">{user.first_name} {user.last_name}</p>
                                  <p className="text-xs text-slate-500">ID: {user._id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <a href={`mailto:${user.email}`} className="text-blue-600 hover:underline text-sm">
                                {user.email}
                              </a>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-700">
                              {user.phone_number || '—'}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(user.status)}`}>
                                <span className="w-2 h-2 rounded-full bg-current"></span>
                                {user.status?.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getKycColor(user.kyc_status)}`}>
                                {user.kyc_status?.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setViewUser(user)}
                                  className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                                  title="View"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setEditUser(user)}
                                  className="p-2 hover:bg-green-100 text-green-600 rounded-lg transition"
                                  title="Edit"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setStatusUser(user)}
                                  className="p-2 hover:bg-yellow-100 text-yellow-600 rounded-lg transition"
                                  title="Change Status"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setDeleteUserObj(user)}
                                  className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition"
                                  title="Delete"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
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
        </main>
      </div>
    </div>
  );
};

export default Users;
