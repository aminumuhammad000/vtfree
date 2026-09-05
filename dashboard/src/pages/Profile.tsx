import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  FiUser,
  FiMail,
  FiLock,
  FiShield,
  FiCalendar,
  FiEdit2,
  FiSave,
  FiX,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import Layout from '../components/Layout';
import { useAuthContext } from '../hooks/AuthContext';
import { changeAdminPassword, updateAdminProfile } from '../api/adminApi';
import { useToast } from '../hooks/ToastContext';

const Profile: React.FC = () => {
  const { admin, app, login } = useAuthContext();
  const { showSuccess, showError } = useToast();

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [firstName, setFirstName] = useState(admin?.first_name || '');
  const [lastName, setLastName] = useState(admin?.last_name || '');
  const [email, setEmail] = useState(admin?.email || '');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const getInitials = () => {
    if (!admin) return 'AD';
    const first = admin.first_name?.[0] || '';
    const last = admin.last_name?.[0] || '';
    return (first + last).toUpperCase() || 'AD';
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: { first_name: string; last_name: string; email: string }) =>
      updateAdminProfile(data).then((res: any) => res.data),
    onSuccess: (response) => {
      const updatedAdmin = response.data || response.admin;
      const token = localStorage.getItem('token');
      if (token) {
        login(token, updatedAdmin, app);
      }
      showSuccess('Profile updated successfully!');
      setIsEditingProfile(false);
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to update profile');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      changeAdminPassword(data).then((res: any) => res.data),
    onSuccess: () => {
      showSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to change password');
    },
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      first_name: firstName,
      last_name: lastName,
      email: email,
    });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const handleCancelEdit = () => {
    setFirstName(admin?.first_name || '');
    setLastName(admin?.last_name || '');
    setEmail(admin?.email || '');
    setIsEditingProfile(false);
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-2 tracking-tight">Account Profile</h1>
              <p className="text-sm sm:text-lg text-slate-600 font-medium">Manage your personal information and security credentials</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Profile Card */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-slate-800 to-slate-900 relative">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                </div>
                <div className="px-6 pb-8 text-center -mt-16 relative">
                  <div className="inline-block p-2 bg-white rounded-[2.5rem] shadow-xl mb-4">
                    <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-4xl font-black text-white shadow-inner">
                      {getInitials()}
                    </div>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">{admin?.first_name} {admin?.last_name}</h2>
                  <p className="text-sm text-slate-500 font-medium mb-4">{admin?.email}</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-200">
                      {admin?.role_id?.role_name?.replace('_', ' ') || 'ADMIN'}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-200">
                      {admin?.status || 'ACTIVE'}
                    </span>
                  </div>
                </div>
                <div className="px-6 py-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
                  <div className="flex items-center gap-3 text-slate-600">
                    <FiCalendar className="w-4 h-4 text-slate-400" />
                    <div className="text-xs">
                      <p className="font-bold text-slate-400 uppercase text-[9px]">Last Login</p>
                      <p className="font-bold">{admin?.last_login ? new Date(admin.last_login).toLocaleString() : 'Never'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <FiShield className="w-4 h-4 text-slate-400" />
                    <div className="text-xs">
                      <p className="font-bold text-slate-400 uppercase text-[9px]">Security Level</p>
                      <p className="font-bold">Administrator Access</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Forms */}
            <div className="lg:col-span-2 space-y-8">
              {/* Profile Information Form */}
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-green-600">
                      <FiUser className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
                  </div>
                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleProfileUpdate} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">First Name</label>
                      <div className="relative">
                        <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          readOnly={!isEditingProfile}
                          className={`w-full pl-11 pr-4 py-3 rounded-2xl border transition-all font-bold ${isEditingProfile
                              ? 'bg-white border-slate-200 focus:ring-4 focus:ring-green-500/10 focus:border-green-500'
                              : 'bg-slate-50 border-transparent text-slate-600'
                            }`}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Last Name</label>
                      <div className="relative">
                        <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          readOnly={!isEditingProfile}
                          className={`w-full pl-11 pr-4 py-3 rounded-2xl border transition-all font-bold ${isEditingProfile
                              ? 'bg-white border-slate-200 focus:ring-4 focus:ring-green-500/10 focus:border-green-500'
                              : 'bg-slate-50 border-transparent text-slate-600'
                            }`}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Email Address</label>
                      <div className="relative">
                        <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          readOnly={!isEditingProfile}
                          className={`w-full pl-11 pr-4 py-3 rounded-2xl border transition-all font-bold ${isEditingProfile
                              ? 'bg-white border-slate-200 focus:ring-4 focus:ring-green-500/10 focus:border-green-500'
                              : 'bg-slate-50 border-transparent text-slate-600'
                            }`}
                        />
                      </div>
                    </div>
                  </div>

                  {isEditingProfile && (
                    <div className="flex gap-3 pt-4 animate-in slide-in-from-top-2 duration-300">
                      <button
                        type="submit"
                        disabled={updateProfileMutation.status === 'pending'}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-black transition-all shadow-xl shadow-green-100 active:scale-[0.98]"
                      >
                        <FiSave className="w-5 h-5" />
                        {updateProfileMutation.status === 'pending' ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-black transition-all active:scale-[0.98]"
                      >
                        <FiX className="w-5 h-5" />
                        Cancel
                      </button>
                    </div>
                  )}
                </form>
              </div>

              {/* Password Change Form */}
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-amber-600">
                    <FiLock className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Security & Password</h2>
                </div>

                <form onSubmit={handlePasswordChange} className="p-6 space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Current Password</label>
                    <div className="relative">
                      <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none font-bold transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showCurrentPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">New Password</label>
                      <div className="relative">
                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 8 characters"
                          className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none font-bold transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showNewPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Confirm New Password</label>
                      <div className="relative">
                        <FiCheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                          className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none font-bold transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {passwordError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-in fade-in duration-300">
                      <FiAlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                      <p className="text-xs text-red-700 font-bold">{passwordError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={changePasswordMutation.status === 'pending'}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black transition-all shadow-xl shadow-slate-200 disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <FiLock className="w-5 h-5" />
                    {changePasswordMutation.status === 'pending' ? 'Updating Security...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
