import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { creditUserWallet, getUsers } from '../api/adminApi';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const WalletCredit: React.FC = () => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('Admin wallet credit');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');

  const { data: usersData } = useQuery({
    queryKey: ['users-for-credit'],
    queryFn: () => getUsers({ page: 1, limit: 1000 }).then((res: any) => res.data),
  });

  const users = usersData?.data || [];

  const creditMutation = useMutation({
    mutationFn: (data: { userId: string; amount: number; description: string }) =>
      creditUserWallet(data.userId, data.amount, data.description).then((res: any) => res.data),
    onSuccess: () => {
      setSuccessMessage('Wallet credited successfully!');
      setSelectedUserId('');
      setAmount('');
      setDescription('Admin wallet credit');
      setErrors({});
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error: any) => {
      setErrors({
        submit: error.response?.data?.message || 'Failed to credit wallet'
      });
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
    <div className="flex h-screen bg-gray-100">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onMenuClick={() => setIsMobileOpen(true)} />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Credit User Wallet</h1>
              <p className="text-gray-600 mt-1">Manually credit a user's wallet balance</p>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                ✅ {successMessage}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
              {/* User Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select User *
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    if (errors.userId) setErrors(prev => ({ ...prev, userId: '' }));
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.userId
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="">-- Choose a user --</option>
                  {users.map((user: any) => (
                    <option key={user._id} value={user._id}>
                      {user.first_name} {user.last_name} ({user.email})
                    </option>
                  ))}
                </select>
                {errors.userId && <p className="text-red-500 text-sm mt-1">{errors.userId}</p>}
              </div>

              {/* Selected User Info */}
              {selectedUser && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 uppercase">Name</p>
                      <p className="font-semibold text-gray-900">{selectedUser.first_name} {selectedUser.last_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase">Email</p>
                      <p className="font-semibold text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase">Phone</p>
                      <p className="font-semibold text-gray-900">{selectedUser.phone_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase">Status</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        selectedUser.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedUser.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Amount (₦) *
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
                  }}
                  placeholder="Enter amount"
                  step="0.01"
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.amount
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
                <p className="text-gray-500 text-sm mt-1">💡 This amount will be added to the user's wallet</p>
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
                  }}
                  placeholder="Enter reason for credit"
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.description
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-500 rounded p-4 text-red-700">
                  ❌ {errors.submit}
                </div>
              )}

              {/* Summary */}
              {selectedUser && amount && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    You are about to credit <strong>₦{parseFloat(amount).toLocaleString()}</strong> to{' '}
                    <strong>{selectedUser.first_name} {selectedUser.last_name}</strong>'s wallet.
                  </p>
                  <p className="text-xs text-gray-600 mt-2">Reason: {description}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={creditMutation.status === 'pending' || !selectedUser || !amount}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-3 rounded-lg transition font-semibold"
                >
                  {creditMutation.status === 'pending' ? '💫 Processing...' : '✓ Credit Wallet'}
                </button>
                <button
                  type="reset"
                  onClick={() => {
                    setSelectedUserId('');
                    setAmount('');
                    setDescription('Admin wallet credit');
                    setErrors({});
                  }}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-4 py-3 rounded-lg transition font-semibold"
                >
                  Clear
                </button>
              </div>
            </form>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">ℹ️ How to use:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Select a user from the dropdown</li>
                <li>Enter the amount you want to credit</li>
                <li>Add a description for the credit</li>
                <li>Review the summary and click "Credit Wallet"</li>
                <li>The transaction will be logged in Audit Logs</li>
              </ol>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default WalletCredit;
