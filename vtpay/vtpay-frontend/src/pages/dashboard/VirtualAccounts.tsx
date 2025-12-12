import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Plus, Copy, AlertCircle } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

export const VirtualAccounts: React.FC = () => {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newAccountData, setNewAccountData] = useState({
        bankType: 'gtBank', // Default
        bvn: '',
        accountName: '',
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const response = await api.get('/virtual-accounts');
            setAccounts(response.data.data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        setCreateError('');

        try {
            await api.post('/virtual-accounts', newAccountData);
            await fetchAccounts();
            setShowCreateModal(false);
            setNewAccountData({ bankType: 'gtBank', bvn: '', accountName: '' });
        } catch (err: any) {
            console.error('Create account error:', err);
            setCreateError(err.response?.data?.message || 'Failed to create account');
        } finally {
            setIsCreating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header-main">
                <h1 className="page-title">Virtual Accounts</h1>
                <div className="flex flex-col items-end">
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        leftIcon={<Plus size={18} />}
                        disabled={(user?.kycLevel ?? 0) < 3}
                    >
                        Create New Account
                    </Button>
                    {(user?.kycLevel ?? 0) < 3 && (
                        <span className="text-xs text-orange-600 mt-1">Verification required</span>
                    )}
                </div>
            </div>

            {/* Account List */}
            <div className="grid-layout md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Accounts Yet</h3>
                        <p className="text-gray-500 max-w-md mb-8">Create a virtual account to start receiving payments instantly. You can have multiple accounts for different purposes.</p>
                        <div className="flex flex-col items-center gap-3">
                            <Button
                                onClick={() => setShowCreateModal(true)}
                                disabled={(user?.kycLevel ?? 0) < 3}
                                className="shadow-lg shadow-emerald-500/20"
                            >
                                Create First Account
                            </Button>
                            {(user?.kycLevel ?? 0) < 3 && (
                                <span className="text-xs font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                                    Verification required
                                </span>
                            )}
                        </div>
                    </div>
                ) : (
                    accounts.map((account) => (
                        <div key={account.id} className="group bg-white rounded-3xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-500/20 transition-all duration-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                    ${account.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-gray-50 text-gray-600 border border-gray-100'}`}>
                                    {account.status}
                                </span>
                            </div>

                            <div className="mb-6">
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <span className="font-bold text-emerald-600 text-lg">
                                        {account.bankName.charAt(0)}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">
                                    {account.alias || account.accountName}
                                </h3>
                                <p className="text-sm text-gray-500">{account.bankName}</p>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 group-hover:border-emerald-100 transition-colors">
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Account Number</p>
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-xl font-bold text-gray-900 tracking-tight">
                                        {account.accountNumber}
                                    </span>
                                    <button
                                        onClick={() => copyToClipboard(account.accountNumber)}
                                        className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-emerald-600 transition-all shadow-sm hover:shadow"
                                        title="Copy Account Number"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900">Create Virtual Account</h2>
                            <p className="text-sm text-gray-500 mt-1">Enter details to generate a new account number.</p>
                        </div>

                        <div className="p-6">
                            {createError && (
                                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {createError}
                                </div>
                            )}

                            <form onSubmit={handleCreateAccount} className="space-y-4">
                                <Input
                                    label="Account Name (Alias)"
                                    value={newAccountData.accountName}
                                    onChange={(e) => setNewAccountData({ ...newAccountData, accountName: e.target.value })}
                                    placeholder="e.g. My Savings, Business Account"
                                    required
                                />

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Bank Type</label>
                                    <div className="relative">
                                        <select
                                            value={newAccountData.bankType}
                                            onChange={(e) => setNewAccountData({ ...newAccountData, bankType: e.target.value })}
                                            className="w-full appearance-none bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-3 pr-8"
                                        >
                                            <option value="gtBank">GTBank</option>
                                            <option value="fidelity">Fidelity Bank</option>
                                            <option value="fcmb">FCMB</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>

                                <Input
                                    label="BVN (Optional)"
                                    value={newAccountData.bvn}
                                    onChange={(e) => setNewAccountData({ ...newAccountData, bvn: e.target.value })}
                                    placeholder="Enter BVN if required"
                                />

                                <div className="flex gap-3 mt-8">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        fullWidth
                                        onClick={() => setShowCreateModal(false)}
                                        className="bg-gray-50 hover:bg-gray-100 text-gray-600"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        fullWidth
                                        isLoading={isCreating}
                                        className="shadow-lg shadow-emerald-500/20"
                                    >
                                        Create Account
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
