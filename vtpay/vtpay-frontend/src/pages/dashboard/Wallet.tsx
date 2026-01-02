import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Wallet as WalletIcon, CheckCircle, Plus, AlertCircle, ChevronDown, ArrowRight, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Wallet: React.FC = () => {
    const [wallet, setWallet] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [transferData, setTransferData] = useState({
        accountNumber: '',
        bankCode: '',
        amount: '',
        narration: '',
    });
    const [banks, setBanks] = useState<any[]>([]);
    const [isTransferLoading, setIsTransferLoading] = useState(false);
    const [transferSuccess, setTransferSuccess] = useState('');
    const [transferError, setTransferError] = useState('');

    useEffect(() => {
        fetchWallet();
        fetchBanks();
    }, []);

    const fetchWallet = async () => {
        try {
            const response = await api.get('/wallet');
            setWallet(response.data.data);
        } catch (error) {
            console.error('Error fetching wallet:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBanks = async () => {
        try {
            const response = await api.get('/banks');
            setBanks(response.data.data || []);
        } catch (error) {
            console.error('Error fetching banks:', error);
        }
    };

    const handleTransferChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setTransferData({ ...transferData, [e.target.name]: e.target.value });
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsTransferLoading(true);
        setTransferError('');
        setTransferSuccess('');

        try {
            const amountInKobo = Math.round(parseFloat(transferData.amount) * 100);

            await api.post('/transactions/transfer', {
                destinationAccountNumber: transferData.accountNumber,
                destinationBankCode: transferData.bankCode,
                amount: amountInKobo.toString(),
                narration: transferData.narration,
            });

            setTransferSuccess('Transfer initiated successfully!');
            setTransferData({ accountNumber: '', bankCode: '', amount: '', narration: '' });
            fetchWallet(); // Refresh balance
        } catch (err: any) {
            console.error('Transfer error:', err);
            setTransferError(err.response?.data?.message || 'Transfer failed');
        } finally {
            setIsTransferLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Wallet</h1>
                <p className="text-slate-500">Manage your funds and transfers</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Balance Card */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-8 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <WalletIcon size={140} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                    <WalletIcon size={24} />
                                </div>
                                <div>
                                    <p className="text-slate-300 text-sm">Wallet ID</p>
                                    <p className="font-medium">{wallet?.accountName || 'Loading...'}</p>
                                </div>
                            </div>

                            <div className="mb-8">
                                <p className="text-slate-300 text-sm mb-1">Total Balance</p>
                                <h2 className="text-4xl font-bold tracking-tight">
                                    {formatCurrency(wallet?.balanceNaira || 0)}
                                </h2>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
                                <div>
                                    <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Available</p>
                                    <p className="font-semibold text-xl">
                                        {formatCurrency(wallet?.availableBalanceNaira || 0)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Locked</p>
                                    <p className="font-semibold text-xl">
                                        {formatCurrency(wallet?.lockedBalanceNaira || 0)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fund Wallet CTA */}
                    <div className="bg-green-50 rounded-xl p-6 border border-green-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                                <Plus size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-green-900">Fund Your Wallet</h3>
                                <p className="text-sm text-green-700">Add money via bank transfer or card payment.</p>
                            </div>
                        </div>
                        <Link
                            to="/dashboard/virtual-accounts"
                            className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                        >
                            View Options
                        </Link>
                    </div>
                </div>

                {/* Transfer Form */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-fit">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Send size={20} />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900">Transfer Funds</h2>
                            <p className="text-xs text-slate-500">Send money to any bank</p>
                        </div>
                    </div>

                    {transferSuccess && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg flex items-start gap-3">
                            <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={18} />
                            <p className="text-sm text-green-700">{transferSuccess}</p>
                        </div>
                    )}

                    {transferError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
                            <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
                            <p className="text-sm text-red-600">{transferError}</p>
                        </div>
                    )}

                    <form onSubmit={handleTransfer} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Select Bank</label>
                            <div className="relative">
                                <select
                                    name="bankCode"
                                    value={transferData.bankCode}
                                    onChange={handleTransferChange}
                                    required
                                    className="w-full appearance-none px-4 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                >
                                    <option value="">Select a bank</option>
                                    {banks.map((bank) => (
                                        <option key={bank.code} value={bank.code}>
                                            {bank.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
                            <input
                                type="text"
                                name="accountNumber"
                                value={transferData.accountNumber}
                                onChange={handleTransferChange}
                                maxLength={10}
                                required
                                placeholder="0123456789"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₦</span>
                                <input
                                    type="number"
                                    name="amount"
                                    value={transferData.amount}
                                    onChange={handleTransferChange}
                                    min="100"
                                    required
                                    placeholder="0.00"
                                    className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                            <input
                                type="text"
                                name="narration"
                                value={transferData.narration}
                                onChange={handleTransferChange}
                                placeholder="Payment for..."
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isTransferLoading}
                            className="w-full py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                        >
                            {isTransferLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Transfer Funds
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
