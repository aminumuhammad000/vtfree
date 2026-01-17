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
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Payout</h1>
                    <p className="text-sm text-gray-500 mt-1">Withdraw funds to your bank account</p>
                </div>
                <Link to="/dashboard/wallet" className="px-4 py-2 rounded-xl border border-gray-200 hover:border-green-200 hover:bg-green-50 transition-all duration-200 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Wallet size={18} />
                    Back to Wallet
                </Link>
            </div>

            {/* Transfer Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <Send className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900">Withdraw Funds</h3>
                            <p className="text-xs text-gray-500">Securely transfer funds to your bank</p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {transferSuccess && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 animate-fade-in">
                            <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-green-800 font-medium">{transferSuccess}</p>
                        </div>
                    )}

                    {transferError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-fade-in">
                            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800 font-medium">{transferError}</p>
                        </div>
                    )}

                    {savedAccount && showSavedAccount ? (
                        <div className="animate-fade-in">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-green-600">
                                    <UserCheck size={20} />
                                    <span className="text-sm font-bold uppercase tracking-wider">Payout Account</span>
                                </div>
                                <button
                                    onClick={() => setShowSavedAccount(false)}
                                    className="text-xs text-gray-500 hover:text-green-600 flex items-center gap-1 font-medium transition-colors"
                                >
                                    <Edit2 size={14} />
                                    Update Account
                                </button>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Bank Name</p>
                                        <p className="text-sm font-bold text-gray-900">{savedAccount.bankName}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Account Number</p>
                                        <p className="text-sm font-bold text-gray-900">{savedAccount.accountNumber}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Account Name</p>
                                        <p className="text-sm font-bold text-green-600 flex items-center gap-1">
                                            {savedAccount.accountName}
                                            <CheckCircle2 size={14} />
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-dashed border-gray-200 pt-6">
                                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Wallet size={16} className="text-green-600" />
                                    Enter Withdrawal Amount
                                </h4>
                                <form onSubmit={handleTransfer} className="space-y-5">
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Amount</label>
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
                                                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all font-semibold"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Description (Optional)</label>
                                        <input
                                            type="text"
                                            name="narration"
                                            value={transferData.narration}
                                            onChange={handleTransferChange}
                                            placeholder="What's this for?"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isTransferLoading}
                                        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-base shadow-lg shadow-green-200 mt-2 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
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
                        <div className="space-y-5 animate-fade-in">
                            <div className="mb-4">
                                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <ShieldCheck size={18} className="text-green-600" />
                                    {savedAccount ? 'Update Payout Account' : 'Setup Payout Account'}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">Please provide your bank details to receive funds.</p>
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Select Bank</label>
                                <div className="relative">
                                    <div
                                        className={`w-full px-4 py-3 rounded-xl border border-gray-200 cursor-pointer flex items-center justify-between hover:border-green-500 transition-all ${banksError ? 'border-red-500' : ''}`}
                                        onClick={() => !isBanksLoading && setShowBankList(!showBankList)}
                                    >
                                        <span className={transferData.bankCode ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                                            {transferData.bankCode
                                                ? banks.find(b => b.code === transferData.bankCode)?.name
                                                : isBanksLoading ? 'Loading banks...' : 'Choose a bank'}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {isBanksLoading && <Loader2 className="w-4 h-4 animate-spin text-green-600" />}
                                            <ChevronDown className={`text-gray-400 transition-transform ${showBankList ? 'rotate-180' : ''}`} size={18} />
                                        </div>
                                    </div>

                                    {showBankList && (
                                        <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in">
                                            <div className="p-3 border-b border-gray-50 bg-gray-50">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                    <input
                                                        type="text"
                                                        placeholder="Search bank name..."
                                                        className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500"
                                                        value={bankSearch}
                                                        onChange={(e) => setBankSearch(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>
                                            <div className="max-h-64 overflow-y-auto">
                                                {banks.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase())).length > 0 ? (
                                                    banks
                                                        .filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase()))
                                                        .map((bank) => (
                                                            <div
                                                                key={bank.code}
                                                                className={`px-4 py-3 text-sm cursor-pointer hover:bg-green-50 transition-colors flex items-center justify-between ${transferData.bankCode === bank.code ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-700'}`}
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
                                                    <div className="px-4 py-8 text-center text-gray-500 text-sm">
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
                                            className="text-xs text-green-600 font-semibold hover:underline"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Account Number</label>
                                <input
                                    type="text"
                                    name="accountNumber"
                                    value={transferData.accountNumber}
                                    onChange={handleTransferChange}
                                    maxLength={10}
                                    required
                                    placeholder="Enter 10-digit number"
                                    className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all ${verificationError ? 'border-red-500 bg-red-50' : ''} ${recipientName ? 'border-green-500 bg-green-50' : ''}`}
                                />
                                {isVerifying && (
                                    <div className="flex items-center gap-2 mt-2 text-xs text-blue-600 animate-pulse">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Verifying account...
                                    </div>
                                )}
                                {verificationError && (
                                    <div className="flex items-center gap-2 mt-2 text-xs text-red-600 animate-fade-in">
                                        <AlertCircle className="w-3 h-3" />
                                        {verificationError}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Account Name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={recipientName}
                                        readOnly
                                        placeholder="Account name will appear here"
                                        className={`w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 font-medium outline-none ${recipientName ? 'text-green-700 border-green-200' : 'text-gray-400'}`}
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
                                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-base shadow-lg shadow-green-200 mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
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
                                    className="w-full text-center text-xs text-gray-500 hover:text-green-600 font-medium transition-colors mt-2"
                                >
                                    Cancel and use saved account
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Security Note */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-gray-900">Secure Transfers</h4>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            All transactions are encrypted and monitored for your safety. Funds are typically delivered within seconds.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
