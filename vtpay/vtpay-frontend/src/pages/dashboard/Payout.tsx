import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
    CheckCircle2,
    AlertCircle,
    ChevronDown,
    ArrowRight,
    Send,
    ShieldCheck,
    Loader2,
    Wallet,
    Search,
    UserCheck,
    Edit2,
    Clock,
    XCircle,
    History,
    ExternalLink,
    Info,
    AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Payout: React.FC = () => {
    const [transferData, setTransferData] = useState({
        accountNumber: '',
        bankCode: '',
        amount: '',
        narration: '',
    });
    const [banks, setBanks] = useState<any[]>([]);
    const [isBanksLoading, setIsBanksLoading] = useState(false);
    const [banksError, setBanksError] = useState('');
    const [isTransferLoading, setIsTransferLoading] = useState(false);
    const [transferSuccess, setTransferSuccess] = useState('');
    const [transferError, setTransferError] = useState('');

    // Verification State
    const [recipientName, setRecipientName] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationError, setVerificationError] = useState('');

    // Saved Account State
    const [savedAccount, setSavedAccount] = useState<any>(null);
    const [savedAccounts, setSavedAccounts] = useState<any[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [showSavedAccount, setShowSavedAccount] = useState(true);
    const [isSavingAccount, setIsSavingAccount] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState<string | null>(null);

    // Search State
    const [bankSearch, setBankSearch] = useState('');
    const [showBankList, setShowBankList] = useState(false);

    // Wallet State
    const [wallet, setWallet] = useState<any>(null);
    const [isWalletLoading, setIsWalletLoading] = useState(true);

    // Payout History
    const [payoutHistory, setPayoutHistory] = useState<any[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [fees, setFees] = useState<any>(null);
    const [isCalculatingFees, setIsCalculatingFees] = useState(false);

    useEffect(() => {
        fetchBanks();
        fetchSavedAccount();
        fetchWallet();
        fetchPayoutHistory();
    }, []);

    useEffect(() => {
        const amountNum = parseFloat(transferData.amount);
        if (amountNum >= 100 && savedAccount) {
            const timer = setTimeout(() => {
                calculateFees();
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setFees(null);
        }
    }, [transferData.amount, savedAccount]);

    const calculateFees = async () => {
        setIsCalculatingFees(true);
        try {
            const amountInKobo = Math.round(parseFloat(transferData.amount) * 100);
            if (isNaN(amountInKobo) || amountInKobo <= 0) {
                setFees(null);
                return;
            }
            const response = await api.post('/payout/calculate-fees', {
                amount: amountInKobo,
                accountNumber: savedAccount.accountNumber
            });
            setFees(response.data.data);
        } catch (error) {
            console.error('Error calculating fees:', error);
            setFees(null);
        } finally {
            setIsCalculatingFees(false);
        }
    };

    const fetchWallet = async () => {
        try {
            const response = await api.get('/wallet');
            setWallet(response.data.data);
        } catch (error) {
            console.error('Error fetching wallet:', error);
        } finally {
            setIsWalletLoading(false);
        }
    };

    const fetchPayoutHistory = async () => {
        try {
            const response = await api.get('/payout/history');
            setPayoutHistory(response.data.data);
        } catch (error) {
            console.error('Error fetching payout history:', error);
        } finally {
            setIsHistoryLoading(false);
        }
    };

    const fetchSavedAccount = async () => {
        try {
            const [legacyRes, multiRes] = await Promise.all([
                api.get('/payout/saved-account'),
                api.get('/payout/saved-accounts')
            ]);

            if (multiRes.data.success && multiRes.data.data.length > 0) {
                const accounts = multiRes.data.data;
                setSavedAccounts(accounts);

                // Set the first one as selected by default if none selected
                if (!selectedAccountId) {
                    const primary = accounts.find((a: any) => a.isPrimary) || accounts[0];
                    setSelectedAccountId(primary._id);
                    setSavedAccount(primary);
                    setTransferData(prev => ({
                        ...prev,
                        bankCode: primary.bankCode || '',
                        accountNumber: primary.accountNumber || ''
                    }));
                    setRecipientName(primary.accountName);
                }
                setShowSavedAccount(true);
            } else if (legacyRes.data.success && legacyRes.data.data) {
                // Fallback to legacy if no multi-accounts yet
                setSavedAccount(legacyRes.data.data);
                setShowSavedAccount(true);
                setTransferData(prev => ({
                    ...prev,
                    bankCode: legacyRes.data.data.bankCode || '',
                    accountNumber: legacyRes.data.data.accountNumber || ''
                }));
                setRecipientName(legacyRes.data.data.accountName);
            } else {
                setShowSavedAccount(false);
            }
        } catch (error) {
            console.error('Error fetching saved accounts:', error);
            setShowSavedAccount(false);
        }
    };

    const deleteSavedAccount = async (accountId: string) => {
        if (!window.confirm('Are you sure you want to remove this payout account?')) return;

        setIsDeletingAccount(accountId);
        try {
            await api.delete(`/payout/saved-accounts/${accountId}`);
            setTransferSuccess('Account removed successfully');
            if (selectedAccountId === accountId) {
                setSelectedAccountId('');
                setSavedAccount(null);
            }
            await fetchSavedAccount();
            setTimeout(() => setTransferSuccess(''), 3000);
        } catch (error: any) {
            setTransferError(error.response?.data?.message || 'Failed to remove account');
        } finally {
            setIsDeletingAccount(null);
        }
    };

    const handleSelectAccount = (account: any) => {
        setSelectedAccountId(account._id);
        setSavedAccount(account);
        setTransferData(prev => ({
            ...prev,
            bankCode: account.bankCode || '',
            accountNumber: account.accountNumber || ''
        }));
        setRecipientName(account.accountName);
        setShowSavedAccount(true);
    };

    const saveBankDetails = async () => {
        if (!recipientName) return;

        setIsSavingAccount(true);
        setTransferError('');
        try {
            const bankName = banks.find(b => b.code === transferData.bankCode)?.name || '';
            await api.post('/payout/saved-accounts', {
                bankCode: transferData.bankCode,
                bankName,
                accountNumber: transferData.accountNumber,
                accountName: recipientName
            });
            await fetchSavedAccount();
            setTransferSuccess('Account details saved successfully!');
            setShowSavedAccount(true);
            setTimeout(() => setTransferSuccess(''), 3000);
        } catch (error: any) {
            console.error('Error saving bank details:', error);
            setTransferError(error.response?.data?.message || 'Failed to save account details');
        } finally {
            setIsSavingAccount(false);
        }
    };

    useEffect(() => {
        const { accountNumber, bankCode } = transferData;
        if (accountNumber && accountNumber.length === 10 && bankCode) {
            verifyAccount(accountNumber, bankCode);
        } else {
            setRecipientName('');
            setVerificationError('');
        }
    }, [transferData.accountNumber, transferData.bankCode]);

    const fetchBanks = async () => {
        setIsBanksLoading(true);
        setBanksError('');
        try {
            const response = await api.get('/banks');
            const bankData = response.data.data || response.data;

            if (Array.isArray(bankData)) {
                const sortedBanks = [...bankData].sort((a: any, b: any) =>
                    (a.name || '').localeCompare(b.name || '')
                );
                setBanks(sortedBanks);
            } else {
                setBanksError('Invalid bank data received');
            }
        } catch (error: any) {
            console.error('Error fetching banks:', error);
            setBanksError(error.response?.data?.message || 'Failed to load bank list');
        } finally {
            setIsBanksLoading(false);
        }
    };

    const verifyAccount = async (accountNumber: string, bankCode: string) => {
        setIsVerifying(true);
        setVerificationError('');
        setRecipientName('');

        try {
            const response = await api.get(`/banks/verify?accountNumber=${accountNumber}&bankCode=${bankCode}`);
            if (response.data.success) {
                setRecipientName(response.data.data.accountName);
            }
        } catch (error: any) {
            console.error('Verification error:', error);
            setVerificationError(error.response?.data?.message || 'Could not verify account');
            setRecipientName('');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleTransferChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setTransferData({ ...transferData, [e.target.name]: e.target.value });
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!savedAccount) {
            setTransferError('Please save your payout account first');
            return;
        }

        setIsTransferLoading(true);
        setTransferError('');
        setTransferSuccess('');

        try {
            const amountInKobo = Math.round(parseFloat(transferData.amount) * 100);

            await api.post('/payout', {
                accountNumber: savedAccount.accountNumber,
                bankCode: savedAccount.bankCode,
                accountName: savedAccount.accountName,
                amount: amountInKobo,
                narration: transferData.narration,
            });

            setTransferSuccess('Withdrawal initiated successfully! It will be processed shortly.');
            setTransferData(prev => ({ ...prev, amount: '', narration: '' }));
            fetchWallet();
            fetchPayoutHistory();
        } catch (err: any) {
            console.error('Transfer error:', err);
            setTransferError(err.response?.data?.message || 'Withdrawal failed');
        } finally {
            setIsTransferLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        if (isNaN(amount) || amount === null || amount === undefined) {
            return '₦0';
        }
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'text-green-600 bg-green-50 border-green-100';
            case 'PROCESSING': return 'text-blue-600 bg-blue-50 border-blue-100';
            case 'INITIATED': return 'text-yellow-600 bg-yellow-50 border-yellow-100';
            case 'FAILED': return 'text-red-600 bg-red-50 border-red-100';
            case 'MANUAL_REVIEW': return 'text-purple-600 bg-purple-50 border-purple-100';
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle2 size={14} />;
            case 'PROCESSING': return <Loader2 size={14} className="animate-spin" />;
            case 'INITIATED': return <Clock size={14} />;
            case 'FAILED': return <XCircle size={14} />;
            case 'MANUAL_REVIEW': return <AlertTriangle size={14} />;
            default: return null;
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Payout</h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Securely withdraw your cleared funds to your bank account</p>
                </div>
                <Link to="/dashboard/wallet" className="w-full md:w-auto px-6 py-3 rounded-xl md:rounded-2xl border border-gray-200 hover:border-green-200 hover:bg-green-50 transition-all duration-300 flex items-center justify-center gap-2 text-sm font-bold text-gray-700 shadow-sm">
                    <Wallet size={18} className="text-green-600" />
                    Back to Wallet
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Left Column: Form and Balance */}
                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                    {/* Balance Card */}
                    <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-white/10 rounded-full -mr-24 md:-mr-32 -mt-24 md:-mt-32 blur-3xl"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-green-100 mb-2">
                                <ShieldCheck size={18} />
                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Available for Withdrawal</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">
                                {isWalletLoading ? '...' : formatCurrency(wallet?.clearedBalanceNaira || 0)}
                            </h2>
                            <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4 md:gap-8 pt-6 border-t border-white/10">
                                <div className="flex-1">
                                    <p className="text-green-200 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                                        Total Balance
                                        <span title="Your total balance including pending settlements" className="cursor-help">
                                            <Info size={10} />
                                        </span>
                                    </p>
                                    <p className="text-lg md:text-xl font-bold text-white">{isWalletLoading ? '...' : formatCurrency(wallet?.balanceNaira || 0)}</p>
                                </div>
                                <div className="hidden sm:block w-px h-8 bg-white/10"></div>
                                <div className="flex-1">
                                    <p className="text-green-200 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                                        Locked Funds
                                        <span title="Funds currently being processed for payout" className="cursor-help">
                                            <Info size={10} />
                                        </span>
                                    </p>
                                    <p className="text-lg md:text-xl font-bold text-white">{isWalletLoading ? '...' : formatCurrency(wallet?.lockedBalanceNaira || 0)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transfer Section */}
                    <div className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-xl md:rounded-2xl flex items-center justify-center">
                                    <Send className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-base md:text-lg font-bold text-gray-900">Withdraw Funds</h3>
                                    <p className="text-[10px] md:text-xs text-gray-500 font-medium">Transfer to your verified bank account</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 md:p-8">
                            {transferSuccess && (
                                <div className="mb-6 md:mb-8 p-4 bg-green-50 border border-green-200 rounded-xl md:rounded-2xl flex items-start gap-3 animate-fade-in">
                                    <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-green-800 font-bold">{transferSuccess}</p>
                                </div>
                            )}

                            {transferError && (
                                <div className="mb-6 md:mb-8 p-4 bg-red-50 border border-red-200 rounded-xl md:rounded-2xl flex items-start gap-3 animate-fade-in">
                                    <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-800 font-bold">{transferError}</p>
                                </div>
                            )}

                            {savedAccount && showSavedAccount ? (
                                <div className="animate-fade-in space-y-6 md:space-y-8">
                                    {/* Saved Accounts Selection */}
                                    {savedAccounts.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {savedAccounts.map((acc) => (
                                                <div
                                                    key={acc._id}
                                                    onClick={() => handleSelectAccount(acc)}
                                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative group ${selectedAccountId === acc._id ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-white hover:border-green-200'}`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedAccountId === acc._id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                            <UserCheck size={16} />
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteSavedAccount(acc._id);
                                                            }}
                                                            disabled={isDeletingAccount === acc._id}
                                                            className={`p-1.5 rounded-lg transition-all ${isDeletingAccount === acc._id ? 'text-red-400 cursor-not-allowed' : 'text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100'}`}
                                                        >
                                                            {isDeletingAccount === acc._id ? (
                                                                <Loader2 size={14} className="animate-spin" />
                                                            ) : (
                                                                <XCircle size={14} />
                                                            )}
                                                        </button>
                                                    </div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{acc.bankName}</p>
                                                    <p className="text-sm font-black text-gray-900 truncate">{acc.accountName}</p>
                                                    <p className="text-xs font-bold text-gray-500 mt-1 tracking-wider">{acc.accountNumber}</p>

                                                    {selectedAccountId === acc._id && (
                                                        <div className="absolute top-2 right-2">
                                                            <CheckCircle2 size={16} className="text-green-600" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {savedAccounts.length < 5 && (
                                                <button
                                                    onClick={() => setShowSavedAccount(false)}
                                                    className="p-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all flex flex-col items-center justify-center gap-2 group"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                                                        <Edit2 size={16} className="text-gray-400 group-hover:text-green-600" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-green-600">Add New Account</span>
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {!savedAccounts.length && savedAccount && (
                                        <div className="bg-gray-50 rounded-xl md:rounded-2xl p-5 md:p-6 border border-gray-100 relative group">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-2 text-green-600">
                                                    <UserCheck size={20} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Verified Destination</span>
                                                </div>
                                                <button
                                                    onClick={() => setShowSavedAccount(false)}
                                                    className="text-[10px] text-gray-500 hover:text-green-600 flex items-center gap-1.5 font-bold transition-colors bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm"
                                                >
                                                    <Edit2 size={14} />
                                                    Update
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-1.5">Bank Name</p>
                                                    <p className="text-sm md:text-base font-bold text-gray-900">{savedAccount.bankName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-1.5">Account Number</p>
                                                    <p className="text-sm md:text-base font-bold text-gray-900 tracking-wider">{savedAccount.accountNumber}</p>
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-1.5">Account Name</p>
                                                    <p className="text-base md:text-lg font-black text-green-600 flex items-center gap-2">
                                                        {savedAccount.accountName}
                                                        <CheckCircle2 size={18} />
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <form onSubmit={handleTransfer} className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] md:text-xs uppercase tracking-widest text-gray-500 font-black mb-3">Withdrawal Amount</label>
                                            <div className="relative group">
                                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xl md:text-2xl group-focus-within:text-green-600 transition-colors">₦</span>
                                                <input
                                                    type="number"
                                                    name="amount"
                                                    value={transferData.amount}
                                                    onChange={handleTransferChange}
                                                    min="100"
                                                    required
                                                    placeholder="0.00"
                                                    className="w-full pl-12 pr-6 py-4 md:py-5 rounded-xl md:rounded-2xl border-2 border-gray-100 focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition-all font-black text-xl md:text-3xl tracking-tight"
                                                />
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 gap-1">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Min: ₦100.00</p>
                                                {wallet && parseFloat(transferData.amount) > wallet.clearedBalanceNaira && (
                                                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                                        <AlertTriangle size={10} />
                                                        Insufficient cleared balance
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] md:text-xs uppercase tracking-widest text-gray-500 font-black mb-3">Narration (Optional)</label>
                                            <input
                                                type="text"
                                                name="narration"
                                                value={transferData.narration}
                                                onChange={handleTransferChange}
                                                placeholder="What's this for?"
                                                className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl border-2 border-gray-100 focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition-all font-bold text-sm md:text-base"
                                            />
                                        </div>

                                        {isCalculatingFees && (
                                            <div className="flex items-center gap-2 text-xs text-blue-600 font-bold animate-pulse px-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Calculating fees...
                                            </div>
                                        )}

                                        {fees && !isCalculatingFees && (
                                            <div className="bg-gray-50 rounded-xl md:rounded-2xl p-5 md:p-6 space-y-4 border border-gray-100 animate-fade-in">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Payout Amount</span>
                                                    <span className="text-sm md:text-base font-bold text-gray-900">{formatCurrency((fees.totalDeducted || 0) / 100)}</span>
                                                </div>

                                                <div className="space-y-2 pt-2 border-t border-gray-200/50">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">VTpay Service Fee</span>
                                                        <span className="text-[10px] md:text-xs font-bold text-gray-600">-{formatCurrency(((fees.vtpayFee || 0) + (fees.zainpayPercentFee || 0)) / 100)}</span>
                                                    </div>

                                                    {!fees.isInternal && (
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bank Settlement Fee</span>
                                                            <span className="text-[10px] md:text-xs font-bold text-gray-600">-{formatCurrency((fees.zainpayFixedFee || 0) / 100)}</span>
                                                        </div>
                                                    )}

                                                    {fees.isInternal && (
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[9px] md:text-[10px] font-bold text-green-600 uppercase tracking-widest flex items-center gap-1">
                                                                <ShieldCheck size={10} />
                                                                Internal Transfer
                                                            </span>
                                                            <span className="text-[9px] md:text-[10px] font-black text-green-600 uppercase tracking-widest">Free</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between pt-4 border-t-2 border-dashed border-gray-200">
                                                    <span className="text-xs md:text-sm font-black text-gray-900 uppercase tracking-widest">You Receive</span>
                                                    <span className="text-xl md:text-2xl font-black text-green-600">{formatCurrency((fees.netAmount || 0) / 100)}</span>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isTransferLoading || !transferData.amount || parseFloat(transferData.amount) <= 0 || (wallet && parseFloat(transferData.amount) > wallet.clearedBalanceNaira)}
                                            className="w-full py-4 md:py-5 bg-green-600 hover:bg-green-700 text-white rounded-xl md:rounded-2xl font-black text-base md:text-lg shadow-xl shadow-green-200 mt-4 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1 active:translate-y-0"
                                        >
                                            {isTransferLoading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    Confirm Withdrawal
                                                    <ArrowRight size={22} />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="mb-6">
                                        <h3 className="text-base md:text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <ShieldCheck size={22} className="text-green-600" />
                                            {savedAccount ? 'Update Payout Account' : 'Setup Payout Account'}
                                        </h3>
                                        <p className="text-[10px] md:text-sm text-gray-500 mt-1 font-medium">Link your bank account to start receiving payouts.</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] md:text-xs uppercase tracking-widest text-gray-500 font-black mb-3">Select Bank</label>
                                            <div className="relative">
                                                <div
                                                    className={`w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl border-2 border-gray-100 cursor-pointer flex items-center justify-between hover:border-green-500 transition-all ${banksError ? 'border-red-500' : ''}`}
                                                    onClick={() => !isBanksLoading && setShowBankList(!showBankList)}
                                                >
                                                    <span className={transferData.bankCode ? 'text-gray-900 font-bold text-sm md:text-base' : 'text-gray-400 font-medium text-sm md:text-base'}>
                                                        {transferData.bankCode
                                                            ? banks.find(b => b.code === transferData.bankCode)?.name
                                                            : isBanksLoading ? 'Loading banks...' : 'Choose a bank'}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        {isBanksLoading && <Loader2 className="w-4 h-4 animate-spin text-green-600" />}
                                                        <ChevronDown className={`text-gray-400 transition-transform duration-300 ${showBankList ? 'rotate-180' : ''}`} size={20} />
                                                    </div>
                                                </div>

                                                {showBankList && (
                                                    <div className="absolute z-50 left-0 right-0 mt-3 bg-white rounded-2xl md:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in ring-1 ring-black/5">
                                                        <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                                                            <div className="relative">
                                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                                <input
                                                                    type="text"
                                                                    placeholder="Search bank name..."
                                                                    className="w-full pl-12 pr-4 py-3 text-sm bg-white border-2 border-gray-100 rounded-xl md:rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-50 focus:border-green-500 font-bold"
                                                                    value={bankSearch}
                                                                    onChange={(e) => setBankSearch(e.target.value)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    autoFocus
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="max-h-60 md:max-h-72 overflow-y-auto custom-scrollbar">
                                                            {banks.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase())).length > 0 ? (
                                                                banks
                                                                    .filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase()))
                                                                    .map((bank) => (
                                                                        <div
                                                                            key={bank.code}
                                                                            className={`px-5 md:px-6 py-3.5 md:py-4 text-sm cursor-pointer hover:bg-green-50 transition-colors flex items-center justify-between ${transferData.bankCode === bank.code ? 'bg-green-50 text-green-700 font-black' : 'text-gray-700 font-bold'}`}
                                                                            onClick={() => {
                                                                                setTransferData({ ...transferData, bankCode: bank.code });
                                                                                setShowBankList(false);
                                                                                setBankSearch('');
                                                                            }}
                                                                        >
                                                                            {bank.name}
                                                                            {transferData.bankCode === bank.code && <CheckCircle2 size={18} />}
                                                                        </div>
                                                                    ))
                                                            ) : (
                                                                <div className="px-6 py-12 text-center text-gray-400 font-bold">
                                                                    No banks found matching "{bankSearch}"
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] md:text-xs uppercase tracking-widest text-gray-500 font-black mb-3">Account Number</label>
                                            <input
                                                type="text"
                                                name="accountNumber"
                                                value={transferData.accountNumber}
                                                onChange={handleTransferChange}
                                                maxLength={10}
                                                required
                                                placeholder="Enter 10-digit number"
                                                className={`w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl border-2 border-gray-100 focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition-all font-black tracking-widest text-sm md:text-base ${verificationError ? 'border-red-500 bg-red-50' : ''} ${recipientName ? 'border-green-500 bg-green-50' : ''}`}
                                            />
                                            {isVerifying && (
                                                <div className="flex items-center gap-2 mt-3 text-xs text-blue-600 font-bold animate-pulse">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Verifying account...
                                                </div>
                                            )}
                                            {verificationError && (
                                                <div className="flex items-center gap-2 mt-3 text-xs text-red-600 font-bold animate-fade-in">
                                                    <AlertCircle className="w-4 h-4" />
                                                    {verificationError}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-[10px] md:text-xs uppercase tracking-widest text-gray-500 font-black mb-3">Account Name</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={recipientName}
                                                    readOnly
                                                    placeholder="Account name will appear here"
                                                    className={`w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl border-2 border-gray-100 bg-gray-50 font-black outline-none transition-all text-sm md:text-base ${recipientName ? 'text-green-700 border-green-200' : 'text-gray-400'}`}
                                                />
                                                {recipientName && (
                                                    <CheckCircle2 className="absolute right-5 md:right-6 top-1/2 -translate-y-1/2 text-green-500" size={22} />
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={saveBankDetails}
                                            disabled={isSavingAccount || isVerifying || !recipientName}
                                            className="w-full py-4 md:py-5 bg-green-600 hover:bg-green-700 text-white rounded-xl md:rounded-2xl font-black text-base md:text-lg shadow-xl shadow-green-200 mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:translate-y-0"
                                        >
                                            {isSavingAccount ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                                                    Saving Details...
                                                </>
                                            ) : (
                                                <>
                                                    {savedAccount ? 'Update Payout Account' : 'Save Account Details'}
                                                    <CheckCircle2 size={22} />
                                                </>
                                            )}
                                        </button>

                                        {savedAccount && (
                                            <button
                                                type="button"
                                                onClick={() => setShowSavedAccount(true)}
                                                className="w-full text-center text-[10px] text-gray-400 hover:text-green-600 font-black uppercase tracking-widest transition-colors mt-2"
                                            >
                                                Cancel and use saved account
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: History and Info */}
                <div className="space-y-6 md:space-y-8">
                    {/* Payout History */}
                    <div className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <History className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                                <h3 className="text-sm md:text-base font-bold text-gray-900">Recent Payouts</h3>
                            </div>
                            <Link to="/dashboard/transactions" className="text-[10px] font-black uppercase tracking-widest text-green-600 hover:underline">View All</Link>
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[400px] md:max-h-[600px] custom-scrollbar">
                            {isHistoryLoading ? (
                                <div className="p-8 md:p-12 flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-green-600" />
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Loading history...</p>
                                </div>
                            ) : payoutHistory.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {payoutHistory.map((payout) => (
                                        <div key={payout._id} className="p-4 md:p-5 hover:bg-gray-50 transition-colors group">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-[9px] md:text-[10px] font-black px-2 py-0.5 md:px-2.5 md:py-1 rounded-full border flex items-center gap-1 md:gap-1.5 ${getStatusColor(payout.status)}`}>
                                                    {getStatusIcon(payout.status)}
                                                    {payout.status.replace('_', ' ')}
                                                </span>
                                                <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                                    {new Date(payout.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                            <div className="flex items-end justify-between">
                                                <div>
                                                    <p className="text-sm md:text-base font-black text-gray-900">{formatCurrency(payout.amount / 100)}</p>
                                                    {payout.netAmount && (
                                                        <p className="text-[9px] md:text-[10px] font-bold text-green-600 uppercase tracking-wider">
                                                            Net: {formatCurrency(payout.netAmount / 100)}
                                                        </p>
                                                    )}
                                                    <p className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">{payout.bankCode} • {payout.accountNumber}</p>
                                                </div>
                                                <button className="p-2 rounded-lg bg-gray-100 text-gray-400 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all hover:bg-green-100 hover:text-green-600">
                                                    <ExternalLink size={14} />
                                                </button>
                                            </div>
                                            {payout.status === 'MANUAL_REVIEW' && (
                                                <p className="mt-2 text-[9px] md:text-[10px] text-purple-600 font-bold bg-purple-50 p-2 rounded-lg border border-purple-100">
                                                    This transaction requires manual verification by our team.
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 md:p-12 text-center">
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <History className="w-6 h-6 md:w-8 md:h-8 text-gray-200" />
                                    </div>
                                    <p className="text-xs md:text-sm font-bold text-gray-400">No payout history yet</p>
                                    <p className="text-[9px] md:text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Your withdrawals will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Security Note */}
                    <div className="bg-green-50 rounded-2xl md:rounded-3xl p-5 md:p-6 border border-green-100 relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 w-20 md:w-24 h-20 md:h-24 bg-green-100 rounded-full blur-2xl"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg md:rounded-xl flex items-center justify-center shadow-sm">
                                    <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                                </div>
                                <h4 className="text-xs md:text-sm font-black text-gray-900 uppercase tracking-wider">Secure Protocol</h4>
                            </div>
                            <p className="text-[10px] md:text-xs text-green-800 font-medium leading-relaxed">
                                All payouts are processed through encrypted channels. Funds are typically delivered within 60 seconds of approval.
                            </p>
                            <div className="mt-6 space-y-3">
                                <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-green-700 uppercase tracking-widest">
                                    <div className="w-1 md:w-1.5 h-1 md:h-1.5 bg-green-500 rounded-full"></div>
                                    24/7 Monitoring
                                </div>
                                <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-green-700 uppercase tracking-widest">
                                    <div className="w-1 md:w-1.5 h-1 md:h-1.5 bg-green-500 rounded-full"></div>
                                    Fraud Protection
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
