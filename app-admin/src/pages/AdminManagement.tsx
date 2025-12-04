import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { createAdminUser, getAllAdmins } from '../api/adminApi';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

interface AdminUser {
  _id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: 'active' | 'inactive';
  created_at: string;
  last_login_at?: string;
}

const AdminManagement: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
  });
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [createdEmail, setCreatedEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const queryClient = useQueryClient();
  const limit = 10;

  // Fetch all admins
  const { data: adminsData, isLoading } = useQuery({
    queryKey: ['admins', page],
    queryFn: () => getAllAdmins({ page, limit }).then((res: any) => res.data),
  });

  const admins = adminsData?.data || [];
  const total = adminsData?.total || 0;

  // Create admin mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => createAdminUser(data).then((res: any) => res.data),
    onSuccess: (data) => {
      setGeneratedPassword(data.password);
      setCreatedEmail(data.email);
      setFormData({ email: '', first_name: '', last_name: '', password: '' });
      setErrors({});
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create admin';
      setErrors({ submit: message });
    }
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';

    if (!formData.first_name) newErrors.first_name = 'First name is required';
    if (!formData.last_name) newErrors.last_name = 'Last name is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      createMutation.mutate(formData);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
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
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                    <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                    Admin Management
                  </h1>
                  <p className="text-slate-600">Create and manage admin users</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">{total}</p>
                  <p className="text-sm text-slate-600">Total Admins</p>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  setShowCreateModal(true);
                  setErrors({});
                  setGeneratedPassword('');
                }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Admin
              </button>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 max-h-96 overflow-y-auto">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Create New Admin</h2>

                  <form onSubmit={handleCreateAdmin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => {
                          setFormData({ ...formData, first_name: e.target.value });
                          if (errors.first_name) setErrors({ ...errors, first_name: '' });
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          errors.first_name
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-slate-300 focus:ring-blue-500'
                        }`}
                        placeholder="John"
                      />
                      {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => {
                          setFormData({ ...formData, last_name: e.target.value });
                          if (errors.last_name) setErrors({ ...errors, last_name: '' });
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          errors.last_name
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-slate-300 focus:ring-blue-500'
                        }`}
                        placeholder="Doe"
                      />
                      {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (errors.email) setErrors({ ...errors, email: '' });
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          errors.email
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-slate-300 focus:ring-blue-500'
                        }`}
                        placeholder="admin@example.com"
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Password *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.password}
                          onChange={(e) => {
                            setFormData({ ...formData, password: e.target.value });
                            if (errors.password) setErrors({ ...errors, password: '' });
                          }}
                          className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                            errors.password
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-slate-300 focus:ring-blue-500'
                          }`}
                          placeholder="Generate or enter password"
                        />
                        <button
                          type="button"
                          onClick={generatePassword}
                          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition"
                        >
                          Generate
                        </button>
                      </div>
                      {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                    </div>

                    {/* Submit Error */}
                    {errors.submit && (
                      <div className="bg-red-50 border border-red-500 rounded p-3 text-red-700 text-sm">
                        ❌ {errors.submit}
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateModal(false);
                          setFormData({ email: '', first_name: '', last_name: '', password: '' });
                          setErrors({});
                        }}
                        className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={createMutation.isPending}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
                      >
                        {createMutation.isPending ? 'Creating...' : 'Create'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Generated Password Display */}
            {generatedPassword && (
              <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900">Admin Created Successfully! ✅</h3>
                    <p className="text-green-700 mt-2">Save these credentials securely:</p>
                    <div className="mt-3 bg-white p-3 rounded border border-green-200 font-mono text-sm space-y-2">
                      <div><span className="text-slate-600">Email: </span>{createdEmail}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600">Password: </span>
                        <span>{showPassword ? generatedPassword : '••••••••'}</span>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-blue-600 hover:text-blue-700 ml-auto"
                        >
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setGeneratedPassword('');
                        setCreatedEmail('');
                        setShowPassword(false);
                      }}
                      className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Admins List */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM9 12a9 9 0 01-9-9h18a9 9 0 01-9 9z" />
                  </svg>
                  All Admins
                </h2>
              </div>

              {isLoading ? (
                <div className="p-8 text-center text-slate-500">Loading admins...</div>
              ) : admins.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No admins found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Created</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Last Login</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {admins.map((admin: AdminUser) => (
                        <tr key={admin._id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">
                              {admin.first_name} {admin.last_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{admin.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              admin.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {admin.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-sm">
                            {new Date(admin.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-sm">
                            {admin.last_login_at
                              ? new Date(admin.last_login_at).toLocaleDateString()
                              : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {admins.length > 0 && (
                <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-between items-center text-sm text-slate-600">
                  <span>Showing {admins.length} of {total} admins</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1">Page {page}</span>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={admins.length < limit}
                      className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">ℹ️ How to use:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Click "Create Admin" button to add a new administrator</li>
                <li>Fill in the admin details or generate a secure password</li>
                <li>Copy the credentials and send them securely to the new admin</li>
                <li>Admin can login and change their password after first access</li>
                <li>All admin actions are logged in the Audit Logs</li>
              </ol>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminManagement;
