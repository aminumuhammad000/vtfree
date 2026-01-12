import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
    Plus,
    Copy,
    AlertCircle,
    CreditCard,
    X,
    ChevronDown,
    Check,
    RefreshCw,
    ShieldAlert,
    CheckCircle2,
    Search,
    MoreHorizontal,
    Filter,
    Eye,
    Trash2,
    Calendar,
    ArrowUpRight,
    ArrowDownLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export const VirtualAccounts: React.FC = () => {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [supportedBanks, setSupportedBanks] = useState<Array<{ code: string; name: string }>>([]);
    const [isBanksLoading, setIsBanksLoading] = useState(false);
    const [newAccountData, setNewAccountData] = useState({
        bankType: '',
        bvn: '',
        accountName: '',
    });

    // Detail View State
    const [selectedAccount, setSelectedAccount] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [accountTransactions, setAccountTransactions] = useState<any[]>([]);
    const [isTransactionsLoading, setIsTransactionsLoading] = useState(false);

    // Delete State
    const [accountToDelete, setAccountToDelete] = useState<any>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchAccounts();
        fetchSupportedBanks();
    }, []);

    const fetchAccounts = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/virtual-accounts');
            setAccounts(response.data.data || []);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSupportedBanks = async () => {
        setIsBanksLoading(true);
        try {
            const response = await api.get('/virtual-accounts/supported-banks');
            const banks = response.data.data || [];
            setSupportedBanks(banks);
            // Set default bank if available
            if (banks.length > 0 && !newAccountData.bankType) {
                setNewAccountData(prev => ({ ...prev, bankType: banks[0].code }));
            }
        } catch (error) {
            console.error('Error fetching supported banks:', error);
            // Fallback to default banks if API fails
            setSupportedBanks([
                { code: 'gtBank', name: 'GTBank' },
                { code: 'fidelity', name: 'Fidelity Bank' },
                { code: 'fcmb', name: 'FCMB' }
            ]);
        } finally {
            setIsBanksLoading(false);
        }
    };

    const fetchAccountTransactions = async (accountNumber: string) => {
        setIsTransactionsLoading(true);
        try {
            const response = await api.get(`/virtual-accounts/${accountNumber}/transactions`);
            setAccountTransactions(response.data.data || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            setAccountTransactions([]);
        } finally {
            setIsTransactionsLoading(false);
        }
    };

    const handleViewAccount = (account: any) => {
        setSelectedAccount(account);
        setShowDetailModal(true);
        fetchAccountTransactions(account.accountNumber);
    };

    const handleDeleteClick = (account: any) => {
        setAccountToDelete(account);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!accountToDelete) return;

        setIsDeleting(true);
        try {
            await api.delete(`/virtual-accounts/${accountToDelete.id}`);
            await fetchAccounts();
            setShowDeleteModal(false);
            setAccountToDelete(null);
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('Failed to delete account');
        } finally {
            setIsDeleting(false);
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
            setNewAccountData({ bankType: supportedBanks[0]?.code || '', bvn: '', accountName: '' });
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

    const filteredAccounts = accounts.filter(account =>
        account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.accountNumber.includes(searchTerm) ||
        account.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (account.alias && account.alias.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="spinner"></div>
                    <p className="text-body font-medium">Loading accounts...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-[1400px] animate-fade-in">
            {/* Header Section */}
            <div className="va-header">
                <div>
                    <h1 className="text-heading">Virtual Accounts</h1>
                    <p className="text-body mt-1">Manage your dedicated bank accounts for receiving payments</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchAccounts}
                        className="btn btn-secondary p-2"
                        title="Refresh"
                    >
                        <RefreshCw size={18} />
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        disabled={(user?.kycLevel ?? 0) < 3 || user?.status === 'suspended'}
                        className="btn btn-primary"
                    >
                        <Plus size={18} />
                        Create Account
                    </button>
                </div>
            </div>

            {/* Suspension Alert */}
            {user?.status === 'suspended' && (
                <div className="alert alert-error bg-red-50 border-red-200 text-red-800">
                    <div className="alert-icon text-red-600">
                        <AlertCircle size={20} />
                    </div>
                    <div className="alert-content">
                        <h4 className="font-bold">Account Suspended</h4>
                        <p>
                            Your account is currently suspended. You cannot create new virtual accounts or perform transactions. Please contact support for assistance.
                        </p>
                    </div>
                </div>
            )}

            {/* KYC Alert */}
            {user?.status !== 'suspended' && (user?.kycLevel ?? 0) < 3 && (
                <div className="alert alert-warning">
                    <div className="alert-icon">
                        <ShieldAlert size={20} />
                    </div>
                    <div className="alert-content">
                        <h4>Verification Required</h4>
                        <p>
                            You need to complete Tier 3 verification to create virtual accounts. This helps us comply with financial regulations and keep your account secure.
                        </p>
                        <Link to="/dashboard/verification" className="text-xs font-bold underline mt-2 inline-block hover:text-amber-800">
                            Complete Verification Now
                        </Link>
                    </div>
                </div>
            )}

            {/* Search and Filters */}
            <div className="va-filter-bar">
                <div className="va-search-wrapper">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Search accounts by name, number or bank..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button className="btn btn-outline py-2 px-3 text-sm">
                        <Filter size={16} />
                        Filter
                    </button>
                </div>
            </div>

            {/* Accounts Table */}
            <div className="va-table-container">
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Account Details</th>
                                <th>Bank Name</th>
                                <th>Account Number</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAccounts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="va-empty-state">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CreditCard size={32} className="text-gray-300" />
                                        </div>
                                        <h3 className="text-lg font-bold text-heading">No accounts found</h3>
                                        <p className="text-sm text-muted mt-1">
                                            {searchTerm ? 'Try adjusting your search term' : 'Create your first virtual account to get started'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredAccounts.map((account) => (
                                    <tr key={account.id} className="group">
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="va-bank-icon">
                                                    {account.bankName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{account.alias || account.accountName}</p>
                                                    <p className="text-[10px] text-muted font-mono mt-0.5">REF: {account.reference || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p className="text-body font-medium">{account.bankName}</p>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <span className="va-account-number">
                                                    {account.accountNumber}
                                                </span>
                                                <button
                                                    onClick={() => copyToClipboard(account.accountNumber, account.id)}
                                                    className="va-copy-btn"
                                                    title="Copy"
                                                >
                                                    {copiedId === account.id ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={`badge ${account.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                                                {account.status === 'active' && <CheckCircle2 size={12} className="mr-1.5" />}
                                                {account.status}
                                            </div>
                                        </td>
                                        <td>
                                            <p className="text-xs text-muted">
                                                {new Date(account.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </td>
                                        <td className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewAccount(account)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(account)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Delete Account"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="va-modal-overlay animate-fade-in">
                    <div className="va-modal-content animate-scale-up">
                        <div className="va-modal-header">
                            <div>
                                <h2 className="text-lg font-bold text-heading">New Virtual Account</h2>
                                <p className="text-xs text-muted mt-0.5">Generate a dedicated bank account</p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-muted hover:text-heading transition-all p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="va-modal-body">
                            {createError && (
                                <div className="alert alert-error mb-6">
                                    <div className="alert-icon">
                                        <AlertCircle size={18} />
                                    </div>
                                    <p>{createError}</p>
                                </div>
                            )}

                            <form onSubmit={handleCreateAccount} className="space-y-5">
                                <div className="form-group">
                                    <label className="form-label text-xs uppercase tracking-wider text-muted">Account Name (Alias)</label>
                                    <input
                                        type="text"
                                        value={newAccountData.accountName}
                                        onChange={(e) => setNewAccountData({ ...newAccountData, accountName: e.target.value })}
                                        placeholder="e.g. Business Collections"
                                        className="form-input"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label text-xs uppercase tracking-wider text-muted">Select Bank Provider</label>
                                    <div className="relative">
                                        <select
                                            value={newAccountData.bankType}
                                            onChange={(e) => setNewAccountData({ ...newAccountData, bankType: e.target.value })}
                                            className="form-input cursor-pointer"
                                            disabled={isBanksLoading}
                                            required
                                        >
                                            {isBanksLoading ? (
                                                <option>Loading banks...</option>
                                            ) : supportedBanks.length === 0 ? (
                                                <option>No banks available</option>
                                            ) : (
                                                <>
                                                    <option value="">Select a bank</option>
                                                    {supportedBanks.map((bank) => (
                                                        <option key={bank.code} value={bank.code}>
                                                            {bank.name}
                                                        </option>
                                                    ))}
                                                </>
                                            )}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                    </div>
                                    {supportedBanks.length > 0 && (
                                        <p className="text-[10px] text-muted mt-1.5">
                                            {supportedBanks.length} banks available for virtual account creation
                                        </p>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label text-xs uppercase tracking-wider text-muted">BVN (Optional)</label>
                                    <input
                                        type="text"
                                        value={newAccountData.bvn}
                                        onChange={(e) => setNewAccountData({ ...newAccountData, bvn: e.target.value })}
                                        placeholder="Required for some banks"
                                        className="form-input"
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        className="btn btn-outline flex-1"
                                        onClick={() => setShowCreateModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className="btn btn-primary flex-1"
                                    >
                                        {isCreating ? (
                                            <>
                                                <div className="spinner"></div>
                                                Creating...
                                            </>
                                        ) : 'Generate Account'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedAccount && (
                <div className="va-modal-overlay animate-fade-in">
                    <div className="va-modal-content animate-scale-up max-w-2xl">
                        <div className="va-modal-header">
                            <div>
                                <h2 className="text-lg font-bold text-heading">{selectedAccount.alias || selectedAccount.accountName}</h2>
                                <p className="text-xs text-muted mt-0.5">{selectedAccount.bankName} • {selectedAccount.accountNumber}</p>
                            </div>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="text-muted hover:text-heading transition-all p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="va-modal-body">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-xs text-muted uppercase tracking-wider font-medium">Account Status</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={`w-2 h-2 rounded-full ${selectedAccount.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                        <p className="font-bold text-heading capitalize">{selectedAccount.status}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-xs text-muted uppercase tracking-wider font-medium">Created On</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Calendar size={14} className="text-gray-400" />
                                        <p className="font-bold text-heading">
                                            {new Date(selectedAccount.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-sm font-bold text-heading mb-3">Recent Transactions</h3>
                                <div className="border rounded-xl overflow-hidden">
                                    {isTransactionsLoading ? (
                                        <div className="p-8 flex justify-center">
                                            <div className="spinner"></div>
                                        </div>
                                    ) : accountTransactions.length === 0 ? (
                                        <div className="p-8 text-center bg-gray-50">
                                            <p className="text-sm text-muted">No transactions found for this account.</p>
                                        </div>
                                    ) : (
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-medium">
                                                <tr>
                                                    <th className="p-3">Type</th>
                                                    <th className="p-3">Amount</th>
                                                    <th className="p-3">Date</th>
                                                    <th className="p-3">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {accountTransactions.map((txn: any) => (
                                                    <tr key={txn.reference}>
                                                        <td className="p-3">
                                                            <div className="flex items-center gap-2">
                                                                {txn.type === 'credit' ? (
                                                                    <ArrowDownLeft size={14} className="text-green-500" />
                                                                ) : (
                                                                    <ArrowUpRight size={14} className="text-red-500" />
                                                                )}
                                                                <span className="capitalize">{txn.type}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-3 font-mono font-medium">
                                                            {formatCurrency(txn.amount)}
                                                        </td>
                                                        <td className="p-3 text-gray-500">
                                                            {new Date(txn.date).toLocaleDateString()}
                                                        </td>
                                                        <td className="p-3">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${txn.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                                }`}>
                                                                {txn.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && accountToDelete && (
                <div className="va-modal-overlay animate-fade-in">
                    <div className="va-modal-content animate-scale-up max-w-sm">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                                <AlertCircle size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-heading mb-2">Delete Account?</h3>
                            <p className="text-sm text-muted mb-6">
                                Are you sure you want to delete <strong>{accountToDelete.alias || accountToDelete.accountName}</strong>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="btn btn-outline flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="btn btn-danger flex-1"
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
