import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import superAdminApi from '../../api/superAdminApi';
import { toast } from 'react-hot-toast';

interface VTStackAccount {
    id: string;
    accountNumber: string;
    accountName: string;
    bankName: string;
    bankType: string;
    status: 'active' | 'inactive';
    createdAt: string;
    balance?: number;
}

interface VTStackTransaction {
    reference: string;
    amount: number;
    type: 'credit' | 'debit';
    description: string;
    date: string;
    status: string;
}

const VTStackManagement = () => {
    const [activeTab, setActiveTab] = useState<'accounts' | 'settings'>('accounts');
    const [accounts, setAccounts] = useState<VTStackAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({ apiKey: '', baseURL: '' });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState<VTStackAccount | null>(null);
    const [transactions, setTransactions] = useState<VTStackTransaction[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [accountBalance, setAccountBalance] = useState<{ balance: number; currency: string } | null>(null);
    const [platformBalance, setPlatformBalance] = useState<{ balance: number; availableBalance: number; availableBalanceNaira?: number; currency: string } | null>(null);
    const [loadingBalance, setLoadingBalance] = useState(false);

    const [newAccount, setNewAccount] = useState({
        bankType: 'gtBank',
        accountName: '',
        email: '',
        reference: '',
        phone: ''
    });

    useEffect(() => {
        if (activeTab === 'accounts') {
            fetchAccounts();
            fetchPlatformBalance();
        } else {
            fetchSettings();
        }
    }, [activeTab]);

    const fetchPlatformBalance = async () => {
        setLoadingBalance(true);
        try {
            const res = await superAdminApi.getVTStackPlatformBalance();
            if (res.data.success) {
                setPlatformBalance(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching VTStack platform balance:', error);
        } finally {
            setLoadingBalance(false);
        }
    };

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await superAdminApi.getVTStackSettings();
            if (res.data.success) {
                setSettings(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching VTStack settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const res = await superAdminApi.getVTStackAccounts();
            // The response might be directly the array or { success, data }
            const data = res.data.success ? res.data.data : res.data;
            setAccounts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching VTStack accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await superAdminApi.updateVTStackSettings(settings);
            toast.success('Settings updated successfully');
        } catch (error) {
            console.error('Error updating VTStack settings:', error);
            toast.error('Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await superAdminApi.createVTStackAccount(newAccount);
            toast.success('Virtual account created successfully');
            setShowCreateModal(false);
            fetchAccounts();
        } catch (error: any) {
            console.error('Error creating VTStack account:', error);
            toast.error(error.response?.data?.message || 'Failed to create virtual account');
        } finally {
            setLoading(false);
        }
    };

    const viewAccountDetails = async (account: VTStackAccount) => {
        setShowDetailsModal(account);
        setLoadingTransactions(true);
        setAccountBalance(null);
        setTransactions([]);
        try {
            const [balanceRes, transRes] = await Promise.all([
                superAdminApi.getVTStackAccountBalance(account.accountNumber),
                superAdminApi.getVTStackAccountTransactions(account.accountNumber)
            ]);

            if (balanceRes.data.success) setAccountBalance(balanceRes.data.data);
            if (transRes.data.success) setTransactions(transRes.data.data);
        } catch (error) {
            console.error('Error fetching account details:', error);
        } finally {
            setLoadingTransactions(false);
        }
    };

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Icon icon="solar:bank-bold-duotone" className="text-emerald-600" />
                        VTStack Management
                    </h1>
                    <p className="text-slate-500">Manage virtual accounts and API integration</p>
                </div>

                {activeTab === 'accounts' && (
                    <div className="bg-white px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-4 shadow-sm">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <Icon icon="solar:wallet-bold-duotone" width="24" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Platform Balance</p>
                            <div className="text-xl font-mono font-bold text-emerald-600">
                                {loadingBalance ? (
                                    <Icon icon="line-md:loading-twotone-loop" />
                                ) : (
                                    `₦${(platformBalance?.availableBalanceNaira || platformBalance?.availableBalance || 0).toLocaleString()}`
                                )}
                            </div>
                        </div>
                        <button
                            onClick={fetchPlatformBalance}
                            className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                            title="Refresh Balance"
                        >
                            <Icon icon="solar:refresh-bold" width="16" />
                        </button>
                    </div>
                )}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setActiveTab('accounts')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'accounts' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                    >
                        Virtual Accounts
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'settings' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                    >
                        API Settings
                    </button>
                </div>
            </div>

            {activeTab === 'accounts' ? (
                <div className="space-y-4">
                    {/* Actions */}
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all shadow-md"
                        >
                            <Icon icon="solar:add-circle-bold" />
                            Create Virtual Account
                        </button>
                    </div>

                    {/* Accounts Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Account Name</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Account Number</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Bank</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Created At</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Icon icon="line-md:loading-twotone-loop" className="text-4xl text-emerald-600" />
                                                <span className="text-slate-500">Loading accounts...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : accounts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Icon icon="solar:document-add-bold-duotone" className="text-4xl text-slate-300" />
                                                <span className="text-slate-500">No virtual accounts found</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    accounts.map((account) => (
                                        <tr key={account.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-800">{account.accountName}</div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-slate-600">{account.accountNumber}</td>
                                            <td className="px-6 py-4 text-slate-600">{account.bankName}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${account.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                                                    {account.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {new Date(account.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => viewAccountDetails(account)}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Icon icon="solar:eye-bold" width="20" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Settings Tab */
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                                <Icon icon="solar:key-bold" width="24" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">API Configuration</h2>
                                <p className="text-sm text-slate-500">Configure your VTStack credentials</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateSettings} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Base URL</label>
                                <input
                                    type="text"
                                    value={settings.baseURL}
                                    onChange={(e) => setSettings({ ...settings, baseURL: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="https://api.vtstack.com/api"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">API Key (Secret Key)</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={settings.apiKey}
                                        onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10"
                                        placeholder="sk_live_..."
                                    />
                                    <Icon icon="solar:lock-password-bold" className="absolute right-3 top-2.5 text-slate-400" width="20" />
                                </div>
                                <p className="text-xs text-slate-400 italic">Never share your secret keys. They are stored securely on the server.</p>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save Configuration'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Account Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-600 text-white">
                            <h3 className="text-xl font-bold">New Virtual Account</h3>
                            <button onClick={() => setShowCreateModal(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                                <Icon icon="solar:close-circle-bold" width="24" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Bank Type</label>
                                    <select
                                        value={newAccount.bankType}
                                        onChange={(e) => setNewAccount({ ...newAccount, bankType: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="gtBank">GTBank</option>
                                        <option value="vfd">VFD Bank</option>
                                        <option value="wema">Wema Bank</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Reference</label>
                                    <input
                                        type="text"
                                        required
                                        value={newAccount.reference}
                                        onChange={(e) => setNewAccount({ ...newAccount, reference: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        placeholder="unique_ref_123"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Account Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newAccount.accountName}
                                    onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={newAccount.email}
                                    onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                                <input
                                    type="tel"
                                    required
                                    value={newAccount.phone}
                                    onChange={(e) => setNewAccount({ ...newAccount, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    placeholder="08012345678"
                                />
                            </div>
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                                >
                                    {loading ? 'Creating...' : 'Generate Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Account Details Modal */}
            {showDetailsModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-2xl font-bold">
                                    {showDetailsModal.accountName.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{showDetailsModal.accountName}</h3>
                                    <p className="text-slate-400 text-sm">{showDetailsModal.bankName} • {showDetailsModal.accountNumber}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowDetailsModal(null)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                                <Icon icon="solar:close-circle-bold" width="24" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                    <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Current Balance</p>
                                    <div className="text-2xl font-mono font-bold text-emerald-700">
                                        {loadingTransactions ? '...' : accountBalance ? `₦${accountBalance.balance.toLocaleString()}` : 'N/A'}
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Account Status</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-lg font-bold text-slate-700 capitalize">{showDetailsModal.status}</span>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Bank Provider</p>
                                    <div className="text-lg font-bold text-slate-700">{showDetailsModal.bankName}</div>
                                </div>
                            </div>

                            {/* Transactions */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Icon icon="solar:history-bold" className="text-emerald-600" />
                                    Recent Transactions
                                </h4>
                                <div className="border border-slate-100 rounded-xl overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Date</th>
                                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Description</th>
                                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Type</th>
                                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {loadingTransactions ? (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">Loading transactions...</td>
                                                </tr>
                                            ) : transactions.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">No transactions found</td>
                                                </tr>
                                            ) : (
                                                transactions.map((tx, i) => (
                                                    <tr key={i} className="hover:bg-slate-50">
                                                        <td className="px-4 py-3 text-sm text-slate-500">{new Date(tx.date).toLocaleDateString()}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-700 font-medium">{tx.description}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${tx.type === 'credit' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                                {tx.type}
                                                            </span>
                                                        </td>
                                                        <td className={`px-4 py-3 text-sm font-mono font-bold text-right ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                            {tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VTStackManagement;
