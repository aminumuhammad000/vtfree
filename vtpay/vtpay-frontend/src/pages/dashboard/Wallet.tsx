import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import '../../styles/wallet.css';
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
    Send
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
            <div className="flex items-center justify-center min-h-[600px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="spinner w-12 h-12 border-4 border-gray-200 border-t-green-600"></div>
                    <p className="text-body font-medium">Loading wallet...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="wallet-container animate-fade-in">
            {/* Header */}
            <div className="wallet-header">
                <div>
                    <h1 className="text-heading">Wallet</h1>
                    <p className="text-body mt-1">Manage your funds, transfers, and payouts</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/dashboard/transactions"
                        className="btn btn-secondary"
                    >
                        <History className="w-4 h-4" />
                        History
                    </Link>
                    <Link
                        to="/dashboard/payout"
                        className="btn btn-secondary"
                    >
                        <Send className="w-4 h-4" />
                        Payout
                    </Link>
                    <button className="btn btn-primary">
                        <Plus className="w-4 h-4" />
                        Fund Wallet
                    </button>
                </div>
            </div>

            <div className="wallet-grid">
                <div className="wallet-main-col">
                    {/* Main Balance Card - Premium Design */}
                    <div className="wallet-premium-card">
                        <div className="wallet-card-pattern"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="wallet-balance-icon-container">
                                        <WalletIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="wallet-balance-label">Wallet Balance</p>
                                        <p className="text-white font-semibold">{wallet?.accountName || 'Primary Wallet'}</p>
                                    </div>
                                </div>
                                <div className="wallet-secure-badge">
                                    <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                                    <span className="text-[10px] font-bold text-white uppercase tracking-tight">Secure</span>
                                </div>
                            </div>

                            <div className="mb-10">
                                <h2 className="wallet-balance-value">
                                    {formatCurrency(wallet?.balanceNaira || 0)}
                                </h2>
                                <p className="wallet-balance-info">
                                    <Info className="w-3.5 h-3.5" />
                                    Total balance across all sub-accounts
                                </p>
                            </div>

                            <div className="wallet-balance-footer">
                                <div>
                                    <p className="wallet-sub-balance-label">Available</p>
                                    <p className="wallet-sub-balance-value">
                                        {formatCurrency(wallet?.availableBalanceNaira || 0)}
                                    </p>
                                </div>
                                <div>
                                    <p className="wallet-sub-balance-label">Locked</p>
                                    <p className="wallet-sub-balance-value">
                                        {formatCurrency(wallet?.lockedBalanceNaira || 0)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Info / Fund Section */}
                    <div className="wallet-stats-grid">
                        <div className="stat-box">
                            <div className="stat-box-icon green">
                                <ArrowDownLeft className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs text-muted font-medium uppercase tracking-wider">Total Received</p>
                                <p className="text-xl font-bold text-heading mt-0.5">
                                    {formatCompactCurrency(stats?.totalInflowNaira || 0)}
                                </p>
                            </div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-box-icon blue">
                                <ArrowUpRight className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs text-muted font-medium uppercase tracking-wider">Total Sent</p>
                                <p className="text-xl font-bold text-heading mt-0.5">
                                    {formatCompactCurrency(stats?.totalOutflowNaira || 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Funding Options */}
                    <div className="funding-options-container">
                        <div className="funding-options-header">
                            <h3 className="text-lg font-semibold text-heading">Funding Options</h3>
                            <p className="text-body mt-1">Choose your preferred method to add funds</p>
                        </div>
                        <div className="funding-options-grid">
                            <div className="funding-card">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="funding-card-icon green">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    <span className="badge badge-success">Instant</span>
                                </div>
                                <h4 className="funding-card-title">Virtual Account</h4>
                                <p className="funding-card-description">Transfer to your dedicated virtual bank account</p>
                                <Link
                                    to="/dashboard/virtual-accounts"
                                    className="funding-card-link"
                                >
                                    Get Details <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                            <div className="funding-card disabled">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="funding-card-icon blue">
                                        <Plus className="w-5 h-5" />
                                    </div>
                                    <span className="badge badge-info text-gray-400 bg-gray-100 border-gray-200">Coming Soon</span>
                                </div>
                                <h4 className="funding-card-title">Card Payment</h4>
                                <p className="funding-card-description">Top up instantly using your debit or credit card</p>
                                <span className="funding-card-link text-gray-400">
                                    Not Available <ArrowRight className="w-4 h-4" />
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
