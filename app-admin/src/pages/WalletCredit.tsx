import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useState, useMemo } from 'react';
import {
  FiUser,
  FiDollarSign,
  FiFileText,
  FiSearch,
  FiCheckCircle,
  FiInfo,
  FiX,
  FiZap,
  FiArrowRight,
  FiAlertCircle
} from 'react-icons/fi';
import { creditUserWallet, getUsers } from '../api/adminApi';
import Layout from '../components/Layout';
import { useToast } from '../hooks/ToastContext';

const WalletCredit: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('Admin wallet credit');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { data: usersData } = useQuery({
    queryKey: ['users-for-credit'],
    queryFn: () => getUsers({ page: 1, limit: 1000 }).then((res: any) => res.data),
  });

  const users = usersData?.data || [];

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users.slice(0, 10);
    return users.filter((user: any) =>
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);
  }, [users, searchTerm]);

  const creditMutation = useMutation({
    mutationFn: (data: { userId: string; amount: number; description: string }) =>
      creditUserWallet(data.userId, data.amount, data.description).then((res: any) => res.data),
    onSuccess: () => {
      showSuccess('Wallet credited successfully!');
      setSelectedUserId('');
      setAmount('');
      setDescription('Admin wallet credit');
      setErrors({});
      setSearchTerm('');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to credit wallet';
      showError(msg);
      setErrors({ submit: msg });
    }
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedUserId) newErrors.userId = 'Please select a user';
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = 'Amount must be greater than 0';
    if (!description.trim()) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      creditMutation.mutate({
        userId: selectedUserId,
        amount: parseFloat(amount),
        description
      });
    }
  };

  const selectedUser = users.find((u: any) => u._id === selectedUserId);

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-2 tracking-tight">Wallet Credit</h1>
              <p className="text-sm sm:text-lg text-slate-600 font-medium">Manually adjust user balances with secure logging</p>
            </div>
            <div className="hidden sm:block">
              <div className="relative bg-gradient-to-br from-green-600 to-green-700 rounded-2xl shadow-lg px-6 py-4 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <FiZap className="w-5 h-5 text-green-100" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-green-100 opacity-80">System Action</p>
                    <p className="text-lg font-black">Manual Credit</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FiDollarSign className="text-green-600" />
                    Transaction Details
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* User Selection */}
                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Search User</label>
                    <div className="relative">
                      <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Name, email or phone..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setIsDropdownOpen(true);
                          if (selectedUserId) setSelectedUserId('');
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 transition-all font-medium ${errors.userId ? 'border-red-200 focus:ring-red-500/10' : 'border-slate-200 focus:ring-green-500/10 focus:border-green-500'
                          }`}
                      />
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => { setSearchTerm(''); setSelectedUserId(''); setIsDropdownOpen(false); }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {isDropdownOpen && (
                      <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((user: any) => (
                            <button
                              key={user._id}
                              type="button"
                              onClick={() => {
                                setSelectedUserId(user._id);
                                setSearchTerm(`${user.first_name} ${user.last_name}`);
                                setIsDropdownOpen(false);
                                setErrors(prev => ({ ...prev, userId: '' }));
                              }}
                              className="w-full p-4 hover:bg-slate-50 flex items-center gap-4 text-left transition-colors border-b border-slate-50 last:border-0"
                            >
                              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-700 font-bold">
                                {user.first_name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{user.first_name} {user.last_name}</p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                              </div>
                              <FiArrowRight className="ml-auto text-slate-300" />
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-slate-500 text-sm font-medium">
                            No users found matching "{searchTerm}"
                          </div>
                        )}
                      </div>
                    )}
                    {errors.userId && <p className="text-red-500 text-[10px] font-bold uppercase ml-1 mt-1">{errors.userId}</p>}
                  </div>

                  {/* Selected User Preview */}
                  {selectedUser && (
                    <div className="p-4 bg-green-50/50 border border-green-100 rounded-2xl flex items-center gap-4 animate-in zoom-in-95 duration-300">
                      <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-200">
                        <FiUser className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-black text-slate-900">{selectedUser.first_name} {selectedUser.last_name}</p>
                          <span className="px-2 py-0.5 bg-green-200 text-green-800 text-[9px] font-black uppercase rounded-full">Selected</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{selectedUser.email} • {selectedUser.phone_number || 'No Phone'}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Amount */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Amount (₦)</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₦</div>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => {
                            setAmount(e.target.value);
                            if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
                          }}
                          placeholder="0.00"
                          step="0.01"
                          className={`w-full pl-10 pr-4 py-3.5 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 transition-all font-black text-lg ${errors.amount ? 'border-red-200 focus:ring-red-500/10' : 'border-slate-200 focus:ring-green-500/10 focus:border-green-500'
                            }`}
                        />
                      </div>
                      {errors.amount && <p className="text-red-500 text-[10px] font-bold uppercase ml-1 mt-1">{errors.amount}</p>}
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Description</label>
                      <div className="relative">
                        <FiFileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={description}
                          onChange={(e) => {
                            setDescription(e.target.value);
                            if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
                          }}
                          placeholder="Reason for credit"
                          className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 transition-all font-medium ${errors.description ? 'border-red-200 focus:ring-red-500/10' : 'border-slate-200 focus:ring-green-500/10 focus:border-green-500'
                            }`}
                        />
                      </div>
                      {errors.description && <p className="text-red-500 text-[10px] font-bold uppercase ml-1 mt-1">{errors.description}</p>}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={creditMutation.status === 'pending' || !selectedUserId || !amount}
                      className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white rounded-2xl font-black transition-all shadow-xl shadow-slate-200 active:scale-[0.98] flex items-center justify-center gap-3 group"
                    >
                      {creditMutation.status === 'pending' ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <FiCheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <span>Confirm & Credit Wallet</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                  <FiInfo className="text-blue-400" />
                  Transaction Summary
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-white/10">
                    <span className="text-xs text-slate-400 font-bold uppercase">Target User</span>
                    <span className="text-sm font-black truncate max-w-[120px]">
                      {selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}` : 'Not Selected'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-white/10">
                    <span className="text-xs text-slate-400 font-bold uppercase">Credit Amount</span>
                    <span className="text-xl font-black text-green-400">
                      ₦{amount ? parseFloat(amount).toLocaleString() : '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-bold uppercase">Status</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                      Ready
                    </span>
                  </div>
                </div>

                {!selectedUserId && (
                  <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3">
                    <FiAlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                      Please select a user and enter an amount to proceed with the wallet credit.
                    </p>
                  </div>
                )}
              </div>

              {/* Guidelines */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <FiZap className="text-amber-500" />
                  Guidelines
                </h3>
                <ul className="space-y-3">
                  {[
                    'Search and select the correct user.',
                    'Double check the amount before confirming.',
                    'Provide a clear reason for the credit.',
                    'All credits are logged for auditing.'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-slate-600 font-medium">
                      <div className="w-5 h-5 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">
                        {i + 1}
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WalletCredit;
