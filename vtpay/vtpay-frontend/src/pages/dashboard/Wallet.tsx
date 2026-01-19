import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
    Wallet as WalletIcon,
    Plus,
    ArrowRight,
    History,
    ArrowUpRight,
    ArrowDownLeft,
    ShieldCheck,
    Info,
    CreditCard,
    Send,
    CheckCircle2,
    Clock,
    Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Wallet: React.FC = () => {
    const [wallet, setWallet] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [walletRes, statsRes] = await Promise.all([
                api.get('/wallet'),
                api.get('/wallet/stats')
            ]);
            setWallet(walletRes.data.data);
            setStats(statsRes.data.data);
        } catch (error) {
            console.error('Error fetching wallet data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatCompactCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                    <p className="text-gray-600 font-medium">Loading wallet...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-[1400px] space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">Wallet</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your funds, transfers, and payouts</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <Link
                        to="/dashboard/transactions"
                        className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl border border-gray-200 hover:border-green-200 hover:bg-green-50 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-semibold text-gray-700"
                    >
                        <History className="w-4 h-4" />
                        History
                    </Link>
                    <Link
                        to="/dashboard/payout"
                        className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl border border-gray-200 hover:border-green-200 hover:bg-green-50 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-semibold text-gray-700"
                    >
                        <Send className="w-4 h-4" />
                        Payout
                    </Link>
                    <Link
                        to="/dashboard/virtual-accounts"
                        className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-all duration-200 flex items-center justify-center gap-2 text-sm font-semibold shadow-lg shadow-green-200"
                    >
                        <Plus className="w-4 h-4" />
                        Fund Wallet
                    </Link>
                </div>
            </div>

            {/* Main Balance Card - Premium Design */}
            <div className="relative bg-gradient-to-br from-green-600 via-green-700 to-green-800 p-6 md:p-10 rounded-3xl shadow-xl overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-white rounded-full -mr-32 md:-mr-48 -mt-32 md:-mt-48 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-48 md:w-64 h-48 md:h-64 bg-white rounded-full -ml-24 md:-ml-32 -mb-24 md:-mb-32 blur-3xl"></div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6 md:mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm rounded-xl md:rounded-2xl flex items-center justify-center">
                                <WalletIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-green-100 text-[10px] md:text-sm font-bold uppercase tracking-wider">Wallet Balance</p>
                                <p className="text-white font-bold text-sm md:text-base">{wallet?.accountName || 'Primary Wallet'}</p>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                            <ShieldCheck className="w-3.5 h-3.5 text-green-300" />
                            <span className="text-[10px] font-bold text-white uppercase tracking-tight">Secure</span>
                        </div>
                    </div>

                    <div className="mb-8 md:mb-12">
                        <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-2 tracking-tight">
                            {formatCurrency(wallet?.balanceNaira || 0)}
                        </h2>
                        <p className="flex items-center gap-1.5 text-green-100 text-xs md:text-sm font-medium">
                            <Info className="w-3.5 h-3.5" />
                            Total balance across all sub-accounts
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 pt-6 md:pt-8 border-t border-white/20">
                        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                            <p className="text-green-100 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                <CheckCircle2 size={12} className="text-green-300" />
                                Cleared
                            </p>
                            <p className="text-xl md:text-2xl font-black text-white">
                                {formatCurrency(wallet?.clearedBalanceNaira || 0)}
                            </p>
                            <p className="text-[10px] text-green-200 mt-1 font-medium">Available now</p>
                        </div>
                        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                            <p className="text-green-100 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                <Clock size={12} className="text-yellow-300" />
                                Pending
                            </p>
                            <p className="text-xl md:text-2xl font-black text-white">
                                {formatCurrency((wallet?.balanceNaira || 0) - (wallet?.clearedBalanceNaira || 0) - (wallet?.lockedBalanceNaira || 0))}
                            </p>
                            <p className="text-[10px] text-green-200 mt-1 font-medium">Clears in 24h</p>
                        </div>
                        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                            <p className="text-green-100 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                <Lock size={12} className="text-blue-300" />
                                Locked
                            </p>
                            <p className="text-xl md:text-2xl font-black text-white">
                                {formatCurrency(wallet?.lockedBalanceNaira || 0)}
                            </p>
                            <p className="text-[10px] text-green-200 mt-1 font-medium">Payouts in progress</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-green-50 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                        <ArrowDownLeft className="w-6 h-6 md:w-7 md:h-7 text-green-600" />
                    </div>
                    <div>
                        <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wider">Total Received</p>
                        <p className="text-xl md:text-2xl font-black text-gray-900 mt-0.5">
                            {formatCompactCurrency(stats?.totalInflowNaira || 0)}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-50 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                        <ArrowUpRight className="w-6 h-6 md:w-7 md:h-7 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wider">Total Sent</p>
                        <p className="text-xl md:text-2xl font-black text-gray-900 mt-0.5">
                            {formatCompactCurrency(stats?.totalOutflowNaira || 0)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Funding Options */}
            <div className="bg-white p-6 md:p-10 rounded-3xl border border-gray-100 shadow-sm">
                <div className="mb-8">
                    <h3 className="text-xl md:text-2xl font-black text-gray-900">Funding Options</h3>
                    <p className="text-sm text-gray-500 mt-1">Choose your preferred method to add funds</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="group p-6 rounded-2xl border-2 border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all duration-300 cursor-pointer">
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-12 h-12 bg-green-100 group-hover:bg-green-200 rounded-xl flex items-center justify-center transition-colors">
                                <CreditCard className="w-6 h-6 text-green-600" />
                            </div>
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-widest">Instant</span>
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Virtual Account</h4>
                        <p className="text-sm text-gray-600 mb-6 leading-relaxed">Transfer to your dedicated virtual bank account from any banking app.</p>
                        <Link
                            to="/dashboard/virtual-accounts"
                            className="inline-flex items-center gap-2 text-sm font-bold text-green-600 group-hover:text-green-700"
                        >
                            Get Details <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                    <div className="p-6 rounded-2xl border-2 border-gray-100 bg-gray-50/50 opacity-60">
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                                <Plus className="w-6 h-6 text-gray-400" />
                            </div>
                            <span className="px-3 py-1 bg-gray-200 text-gray-500 rounded-full text-[10px] font-bold uppercase tracking-widest">Coming Soon</span>
                        </div>
                        <h4 className="text-lg font-bold text-gray-700 mb-2">Card Payment</h4>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">Top up instantly using your debit or credit card (Mastercard, Visa, Verve).</p>
                        <span className="flex items-center gap-2 text-sm font-bold text-gray-400">
                            Not Available <ArrowRight className="w-4 h-4" />
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
