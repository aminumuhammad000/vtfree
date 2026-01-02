import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Plus, Copy, AlertCircle, CreditCard, X, ChevronDown, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const VirtualAccounts: React.FC = () => {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [newAccountData, setNewAccountData] = useState({
        bankType: 'gtBank',
        bvn: '',
        accountName: '',
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        setIsLoading(true);
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

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Virtual Accounts</h1>
                    <p className="text-slate-500 mt-1">Create and manage your dedicated virtual bank accounts</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchAccounts}
                        className="p-2.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"
                        title="Refresh Accounts"
                    >
                        <RefreshCw size={20} />
                    </button>
                    {(user?.kycLevel ?? 0) < 3 && (
                        <span className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full font-medium border border-yellow-100 flex items-center gap-2">
                            <AlertCircle size={14} />
                            Verification required
                        </span>
                    )}
                    <button
                        onClick={() => setShowCreateModal(true)}
                        disabled={(user?.kycLevel ?? 0) < 3}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 hover:shadow-lg hover:shadow-green-200 transition-all shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        <Plus size={18} />
                        Create New Account
                    </button>
                </div>
            </div>

            {/* Account List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.length === 0 ? (
                    <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CreditCard size={40} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No Accounts Yet</h3>
                        <p className="text-slate-500 max-w-md mx-auto mb-8">Create a virtual account to start receiving payments instantly. You can have multiple accounts for different purposes.</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            disabled={(user?.kycLevel ?? 0) < 3}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium disabled:opacity-50 shadow-md hover:shadow-lg hover:shadow-green-200"
                        >
                            Create First Account
                        </button>
                    </div>
                ) : (
                    accounts.map((account) => (
                        <div key={account.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group relative">
                            {/* Card Header / Background Pattern */}
                            <div className="h-24 bg-gradient-to-r from-slate-900 to-slate-800 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-8 -mt-8"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-500/10 rounded-full blur-xl -ml-4 -mb-4"></div>
                                <div className="absolute top-4 right-4">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${account.status === 'active'
                                            ? 'bg-green-500/20 text-green-100 border-green-500/30'
                                            : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                                        }`}>
                                        {account.status}
                                    </span>
                                </div>
                            </div>

                            {/* Card Content */}
                            <div className="px-6 pb-6 -mt-10 relative z-10">
                                <div className="w-20 h-20 bg-white rounded-xl shadow-lg p-1 mb-4 flex items-center justify-center">
                                    <div className="w-full h-full bg-slate-50 rounded-lg flex items-center justify-center text-slate-700 font-bold text-2xl border border-slate-100">
                                        {account.bankName.charAt(0)}
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 mb-1 truncate" title={account.alias || account.accountName}>
                                    {account.alias || account.accountName}
                                </h3>
                                <p className="text-sm text-slate-500 mb-6 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                                    {account.bankName}
                                </p>

                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 group-hover:border-green-200 group-hover:bg-green-50/30 transition-colors">
                                    <p className="text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-semibold">Account Number</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-mono font-bold text-slate-900 tracking-wide">
                                            {account.accountNumber}
                                        </span>
                                        <button
                                            onClick={() => copyToClipboard(account.accountNumber, account.id)}
                                            className="p-2 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-green-600 shadow-sm"
                                            title="Copy Account Number"
                                        >
                                            {copiedId === account.id ? <Check size={18} /> : <Copy size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Create Virtual Account</h2>
                                <p className="text-xs text-slate-500">Enter details to generate a new account number.</p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {createError && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                                    <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
                                    <p className="text-sm text-red-600 font-medium">{createError}</p>
                                </div>
                            )}

                            <form onSubmit={handleCreateAccount} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Account Name (Alias)</label>
                                    <input
                                        type="text"
                                        value={newAccountData.accountName}
                                        onChange={(e) => setNewAccountData({ ...newAccountData, accountName: e.target.value })}
                                        placeholder="e.g. My Savings, Business Account"
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Bank Type</label>
                                    <div className="relative">
                                        <select
                                            value={newAccountData.bankType}
                                            onChange={(e) => setNewAccountData({ ...newAccountData, bankType: e.target.value })}
                                            className="w-full appearance-none px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-slate-700"
                                        >
                                            <option value="gtBank">GTBank</option>
                                            <option value="fidelity">Fidelity Bank</option>
                                            <option value="fcmb">FCMB</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">BVN (Optional)</label>
                                    <input
                                        type="text"
                                        value={newAccountData.bvn}
                                        onChange={(e) => setNewAccountData({ ...newAccountData, bvn: e.target.value })}
                                        placeholder="Enter BVN if required"
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                                        onClick={() => setShowCreateModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:shadow-green-200"
                                    >
                                        {isCreating ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Creating...
                                            </>
                                        ) : 'Create Account'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
