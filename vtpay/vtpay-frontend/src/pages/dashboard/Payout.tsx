import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import '../../styles/payout.css';
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
    Edit2
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
    const [showSavedAccount, setShowSavedAccount] = useState(true);
    const [isSavingAccount, setIsSavingAccount] = useState(false);

    // Search State
    const [bankSearch, setBankSearch] = useState('');
    const [showBankList, setShowBankList] = useState(false);

    useEffect(() => {
        fetchBanks();
        fetchSavedAccount();
    }, []);

    const fetchSavedAccount = async () => {
        try {
            const response = await api.get('/payout/saved-account');
            if (response.data.success && response.data.data) {
                setSavedAccount(response.data.data);
                setShowSavedAccount(true);
                // Pre-fill transfer data if saved account exists
                setTransferData(prev => ({
                    ...prev,
                    bankCode: response.data.data.bankCode || '',
                    accountNumber: response.data.data.accountNumber || ''
                }));
                setRecipientName(response.data.data.accountName);
            } else {
                setShowSavedAccount(false);
            }
        } catch (error) {
            console.error('Error fetching saved account:', error);
            setShowSavedAccount(false);
        }
    };

    const saveBankDetails = async () => {
        if (!recipientName) return;

        setIsSavingAccount(true);
        setTransferError('');
        try {
            const bankName = banks.find(b => b.code === transferData.bankCode)?.name || '';
            await api.post('/payout/saved-account', {
                bankCode: transferData.bankCode,
                bankName,
                accountNumber: transferData.accountNumber,
                accountName: recipientName
            });
            await fetchSavedAccount();
            setTransferSuccess('Account details saved successfully!');
            setTimeout(() => setTransferSuccess(''), 3000);
        } catch (error: any) {
            console.error('Error saving bank details:', error);
            setTransferError(error.response?.data?.message || 'Failed to save account details');
        } finally {
            setIsSavingAccount(false);
        }
    };

    // Auto-verify when account number is 10 digits and bank is selected
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

            await api.post('/transactions/transfer', {
                destinationAccountNumber: savedAccount.accountNumber,
                destinationBankCode: savedAccount.bankCode,
                amount: amountInKobo.toString(),
                narration: transferData.narration,
            });

            setTransferSuccess('Withdrawal initiated successfully!');
            setTransferData(prev => ({ ...prev, amount: '', narration: '' }));
        } catch (err: any) {
            console.error('Transfer error:', err);
            setTransferError(err.response?.data?.message || 'Withdrawal failed');
        } finally {
            setIsTransferLoading(false);
        }
    };

    return (
        <div className="payout-container animate-fade-in">
            {/* Header */}
            <div className="payout-header">
                <div>
                    <h1 className="text-heading">Payout</h1>
                    <p className="text-body mt-1">Withdraw funds to your bank account</p>
                </div>
                <Link to="/dashboard/wallet" className="btn btn-secondary">
                    <Wallet size={18} />
                    Back to Wallet
                </Link>
            </div>

            {/* Transfer Section */}
            <div className="space-y-6">
                <div className="transfer-card">
                    <div className="transfer-header">
                        <div className="flex items-center gap-3">
                            <div className="transfer-icon-container">
                                <Send className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-heading">Withdraw Funds</h3>
                                <p className="text-xs text-muted">Securely transfer funds to your bank</p>
                            </div>
                        </div>
                    </div>

                    <div className="transfer-form">
                        {transferSuccess && (
                            <div className="alert alert-success animate-in fade-in slide-in-from-top-2">
                                <div className="alert-icon">
                                    <CheckCircle2 size={18} />
                                </div>
                                <p className="text-sm font-medium">{transferSuccess}</p>
                            </div>
                        )}

                        {transferError && (
                            <div className="alert alert-error animate-in fade-in slide-in-from-top-2">
                                <div className="alert-icon">
                                    <AlertCircle size={18} />
                                </div>
                                <p className="text-sm font-medium">{transferError}</p>
                            </div>
                        )}

                        {savedAccount && showSavedAccount ? (
                            <div className="saved-account-card animate-in fade-in zoom-in-95">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-primary">
                                        <UserCheck size={20} />
                                        <span className="text-sm font-bold uppercase tracking-wider">Payout Account</span>
                                    </div>
                                    <button
                                        onClick={() => setShowSavedAccount(false)}
                                        className="text-xs text-muted hover:text-primary flex items-center gap-1 font-medium transition-colors"
                                    >
                                        <Edit2 size={14} />
                                        Update Account
                                    </button>
                                </div>

                                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 mb-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest text-muted mb-1">Bank Name</p>
                                            <p className="text-sm font-bold text-heading">{savedAccount.bankName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest text-muted mb-1">Account Number</p>
                                            <p className="text-sm font-bold text-heading">{savedAccount.accountNumber}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-[10px] uppercase tracking-widest text-muted mb-1">Account Name</p>
                                            <p className="text-sm font-bold text-green-600 flex items-center gap-1">
                                                {savedAccount.accountName}
                                                <CheckCircle2 size={14} />
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-dashed border-gray-200 pt-6">
                                    <h4 className="text-sm font-bold text-heading mb-4 flex items-center gap-2">
                                        <Wallet size={16} className="text-primary" />
                                        Enter Withdrawal Amount
                                    </h4>
                                    <form onSubmit={handleTransfer} className="space-y-5">
                                        <div className="form-group">
                                            <label className="form-label text-xs uppercase tracking-wider text-muted">Amount</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₦</span>
                                                <input
                                                    type="number"
                                                    name="amount"
                                                    value={transferData.amount}
                                                    onChange={handleTransferChange}
                                                    min="100"
                                                    required
                                                    placeholder="0.00"
                                                    className="form-input pl-9 font-semibold"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label text-xs uppercase tracking-wider text-muted">Description (Optional)</label>
                                            <input
                                                type="text"
                                                name="narration"
                                                value={transferData.narration}
                                                onChange={handleTransferChange}
                                                placeholder="What's this for?"
                                                className="form-input"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isTransferLoading}
                                            className="btn btn-primary w-full justify-center py-4 text-base font-bold shadow-lg shadow-green-100 mt-2"
                                        >
                                            {isTransferLoading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    Withdraw Funds
                                                    <ArrowRight size={20} />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
                                <div className="mb-4">
                                    <h3 className="text-sm font-bold text-heading flex items-center gap-2">
                                        <ShieldCheck size={18} className="text-primary" />
                                        {savedAccount ? 'Update Payout Account' : 'Setup Payout Account'}
                                    </h3>
                                    <p className="text-xs text-muted mt-1">Please provide your bank details to receive funds.</p>
                                </div>

                                <div className="form-group">
                                    <label className="form-label text-xs uppercase tracking-wider text-muted">Select Bank</label>
                                    <div className="relative">
                                        <div
                                            className={`form-input cursor-pointer flex items-center justify-between ${banksError ? 'border-red-500' : ''}`}
                                            onClick={() => !isBanksLoading && setShowBankList(!showBankList)}
                                        >
                                            <span className={transferData.bankCode ? 'text-heading font-medium' : 'text-gray-400'}>
                                                {transferData.bankCode
                                                    ? banks.find(b => b.code === transferData.bankCode)?.name
                                                    : isBanksLoading ? 'Loading banks...' : 'Choose a bank'}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {isBanksLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                                                <ChevronDown className={`text-gray-400 transition-transform ${showBankList ? 'rotate-180' : ''}`} size={18} />
                                            </div>
                                        </div>

                                        {showBankList && (
                                            <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95">
                                                <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                        <input
                                                            type="text"
                                                            placeholder="Search bank name..."
                                                            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                            value={bankSearch}
                                                            onChange={(e) => setBankSearch(e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            autoFocus
                                                        />
                                                    </div>
                                                </div>
                                                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                                    {banks.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase())).length > 0 ? (
                                                        banks
                                                            .filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase()))
                                                            .map((bank) => (
                                                                <div
                                                                    key={bank.code}
                                                                    className={`px-4 py-3 text-sm cursor-pointer hover:bg-primary/5 transition-colors flex items-center justify-between ${transferData.bankCode === bank.code ? 'bg-primary/5 text-primary font-bold' : 'text-heading'}`}
                                                                    onClick={() => {
                                                                        setTransferData({ ...transferData, bankCode: bank.code });
                                                                        setShowBankList(false);
                                                                        setBankSearch('');
                                                                    }}
                                                                >
                                                                    {bank.name}
                                                                    {transferData.bankCode === bank.code && <CheckCircle2 size={16} />}
                                                                </div>
                                                            ))
                                                    ) : (
                                                        <div className="px-4 py-8 text-center text-muted text-sm">
                                                            No banks found matching "{bankSearch}"
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {banksError && (
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-xs text-red-600 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                {banksError}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={fetchBanks}
                                                className="text-xs text-primary font-semibold hover:underline"
                                            >
                                                Retry
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label text-xs uppercase tracking-wider text-muted">Account Number</label>
                                    <input
                                        type="text"
                                        name="accountNumber"
                                        value={transferData.accountNumber}
                                        onChange={handleTransferChange}
                                        maxLength={10}
                                        required
                                        placeholder="Enter 10-digit number"
                                        className={`form-input ${verificationError ? 'border-red-500 bg-red-50' : ''} ${recipientName ? 'border-green-500 bg-green-50' : ''}`}
                                    />
                                    {isVerifying && (
                                        <div className="flex items-center gap-2 mt-2 text-xs text-blue-600 animate-pulse">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Verifying account...
                                        </div>
                                    )}
                                    {verificationError && (
                                        <div className="flex items-center gap-2 mt-2 text-xs text-red-600 animate-in fade-in">
                                            <AlertCircle className="w-3 h-3" />
                                            {verificationError}
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label text-xs uppercase tracking-wider text-muted">Account Name</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={recipientName}
                                            readOnly
                                            placeholder="Account name will appear here"
                                            className={`form-input bg-gray-50 font-medium ${recipientName ? 'text-green-700 border-green-200' : 'text-gray-400'}`}
                                        />
                                        {recipientName && (
                                            <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={18} />
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={saveBankDetails}
                                    disabled={isSavingAccount || isVerifying || !recipientName}
                                    className="btn btn-primary w-full justify-center py-4 text-base font-bold shadow-lg shadow-green-100 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSavingAccount ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Saving Details...
                                        </>
                                    ) : (
                                        <>
                                            {savedAccount ? 'Update Payout Account' : 'Save Account Details'}
                                            <CheckCircle2 size={20} />
                                        </>
                                    )}
                                </button>

                                {savedAccount && (
                                    <button
                                        type="button"
                                        onClick={() => setShowSavedAccount(true)}
                                        className="w-full text-center text-xs text-muted hover:text-primary font-medium transition-colors mt-2"
                                    >
                                        Cancel and use saved account
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Security Note */}
                <div className="security-note">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-heading">Secure Transfers</h4>
                            <p className="text-xs text-muted mt-1 leading-relaxed">
                                All transactions are encrypted and monitored for your safety. Funds are typically delivered within seconds.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
