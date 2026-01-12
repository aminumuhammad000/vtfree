import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    CreditCard,
    TrendingUp,
    TrendingDown,
    Eye,
    EyeOff,
    Plus,
    Activity,
    CheckCircle2,
    Zap,
    ArrowRight,
    Download
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Overview: React.FC = () => {
    const { user } = useAuth();
    const [wallet, setWallet] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [walletStats, setWalletStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showBalance, setShowBalance] = useState(true);
    const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [walletRes, txnsRes, statsRes] = await Promise.all([
                    api.get('/wallet'),
                    api.get('/wallet/transactions?limit=10'),
                    api.get('/wallet/stats')
                ]);
                setWallet(walletRes.data.data);
                setTransactions(txnsRes.data.data.transactions || []);
                setWalletStats(statsRes.data.data);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatCompactCurrency = (amount: number) => {
        if (amount >= 1000000) {
            return `₦${(amount / 1000000).toFixed(1)}M`;
        }
        if (amount >= 1000) {
            return `₦${(amount / 1000).toFixed(1)}K`;
        }
        return formatCurrency(amount);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="loading-spinner">
                        <div className="loading-spinner-track"></div>
                        <div className="loading-spinner-spin"></div>
                    </div>
                    <p className="text-body font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    const metrics = [
        {
            label: 'Total Balance',
            value: showBalance ? formatCurrency(wallet?.balanceNaira || 0) : '••••••••',
            change: '+2.5%',
            trend: 'up' as const,
            icon: <Wallet className="w-5 h-5" />,
            description: 'Available + Locked'
        },
        {
            label: 'Money In',
            value: showBalance ? formatCurrency(walletStats?.totalInflowNaira || 0) : '••••••••',
            change: '+12.5%',
            trend: 'up' as const,
            icon: <TrendingUp className="w-5 h-5" />,
            description: 'Last 30 days'
        },
        {
            label: 'Money Out',
            value: showBalance ? formatCurrency(walletStats?.totalOutflowNaira || 0) : '••••••••',
            change: '-8.2%',
            trend: 'down' as const,
            icon: <TrendingDown className="w-5 h-5" />,
            description: 'Last 30 days'
        },
        {
            label: 'Transactions',
            value: walletStats?.totalTransactions || 0,
            change: '+18',
            trend: 'up' as const,
            icon: <Activity className="w-5 h-5" />,
            description: 'This month'
        }
    ];

    return (
        <div className="space-y-6 max-w-[1400px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-heading">Dashboard</h1>
                        <button
                            onClick={() => setShowBalance(!showBalance)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            {showBalance ? <Eye className="w-5 h-5 text-gray-500" /> : <EyeOff className="w-5 h-5 text-gray-500" />}
                        </button>
                    </div>
                    <p className="text-body mt-1">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn btn-secondary">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button className="btn btn-primary">
                        <Plus className="w-4 h-4" />
                        Fund Wallet
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((metric, index) => (
                    <div
                        key={index}
                        className="metric-card hover-lift"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="metric-icon">
                                <div className="text-gray-700">
                                    {metric.icon}
                                </div>
                            </div>
                            <span className={`metric-change ${metric.trend === 'up' ? 'positive' : 'negative'}`}>
                                {metric.change}
                            </span>
                        </div>
                        <div>
                            <p className="metric-label mb-1">{metric.label}</p>
                            <p className="metric-value">{metric.value}</p>
                            <p className="text-caption mt-1">{metric.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Section - 2 columns */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Balance Overview */}
                    <div className="balance-chart">
                        <div className="chart-header">
                            <div>
                                <h2 className="chart-title">Balance Overview</h2>
                                <p className="chart-subtitle">Your wallet performance</p>
                            </div>
                            <div className="timeframe-toggle">
                                {(['7d', '30d', '90d'] as const).map((period) => (
                                    <button
                                        key={period}
                                        onClick={() => setTimeframe(period)}
                                        className={`timeframe-button ${timeframe === period ? 'active' : ''}`}
                                    >
                                        {period === '7d' ? '7 days' : period === '30d' ? '30 days' : '90 days'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Simple Chart Representation */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-6 pb-6 border-b border-light">
                                <div>
                                    <p className="text-body mb-2">Available Balance</p>
                                    <p className="text-heading">
                                        {showBalance ? formatCompactCurrency(wallet?.availableBalanceNaira || 0) : '••••'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-body mb-2">Locked Balance</p>
                                    <p className="text-heading">
                                        {showBalance ? formatCompactCurrency(wallet?.lockedBalanceNaira || 0) : '••••'}
                                    </p>
                                </div>
                            </div>

                            {/* Visual Chart Bars */}
                            <div className="space-y-3 pt-4">
                                <div>
                                    <div className="flex items-center justify-between text-xs mb-2">
                                        <span className="text-muted">Available</span>
                                        <span className="font-medium text-gray-900">
                                            {showBalance ? Math.round((wallet?.availableBalanceNaira / wallet?.balanceNaira) * 100 || 0) : '••'}%
                                        </span>
                                    </div>
                                    <div className="progress-bar-container">
                                        <div
                                            className="progress-bar green"
                                            style={{ width: `${(wallet?.availableBalanceNaira / wallet?.balanceNaira) * 100 || 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between text-xs mb-2">
                                        <span className="text-muted">Locked</span>
                                        <span className="font-medium text-gray-900">
                                            {showBalance ? Math.round((wallet?.lockedBalanceNaira / wallet?.balanceNaira) * 100 || 0) : '••'}%
                                        </span>
                                    </div>
                                    <div className="progress-bar-container">
                                        <div
                                            className="progress-bar amber"
                                            style={{ width: `${(wallet?.lockedBalanceNaira / wallet?.balanceNaira) * 100 || 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="transaction-list">
                        <div className="transaction-header flex items-center justify-between">
                            <div>
                                <h2 className="text-subheading">Recent Transactions</h2>
                                <p className="text-caption mt-0.5">Latest activity on your account</p>
                            </div>
                            <Link
                                to="/dashboard/transactions"
                                className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center gap-1"
                            >
                                View all
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {transactions.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">
                                        <Activity className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <p className="empty-state-title">No transactions yet</p>
                                    <p className="empty-state-description">Your transactions will appear here</p>
                                </div>
                            ) : (
                                transactions.slice(0, 8).map((txn) => (
                                    <div
                                        key={txn.id}
                                        className="transaction-item flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`transaction-icon ${txn.type === 'credit' ? 'credit' : 'debit'}`}>
                                                {txn.type === 'credit' ? (
                                                    <ArrowDownLeft className="w-5 h-5" />
                                                ) : (
                                                    <ArrowUpRight className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 capitalize">{txn.type}</p>
                                                <p className="text-xs text-gray-500 font-mono">{txn.reference}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`transaction-amount ${txn.type === 'credit' ? 'credit' : 'debit'}`}>
                                                {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amountNaira)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(txn.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar - 1 column */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="overview-card p-6">
                        <h3 className="text-subheading mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <Link
                                to="/dashboard/virtual-accounts"
                                className="quick-action group"
                            >
                                <div className="quick-action-icon blue">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">Virtual Accounts</p>
                                    <p className="text-xs text-gray-500">Create & manage</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                            </Link>
                            <Link
                                to="/dashboard/developer"
                                className="quick-action group"
                            >
                                <div className="quick-action-icon purple">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">API Keys</p>
                                    <p className="text-xs text-gray-500">Developer tools</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                            </Link>
                            <Link
                                to="/dashboard/verification"
                                className="quick-action group"
                            >
                                <div className="quick-action-icon amber">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">Verification</p>
                                    <p className="text-xs text-gray-500">KYC status</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                            </Link>
                        </div>
                    </div>

                    {/* Account Status */}
                    <div className="status-card">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="status-icon">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-subheading">Account Status</h3>
                                <p className="text-caption mt-0.5">Verification Level {user?.kycLevel || 0}</p>
                            </div>
                        </div>
                        <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-600">Progress</span>
                                <span className="font-medium text-gray-900">{(user?.kycLevel || 0) * 33}%</span>
                            </div>
                            <div className="status-progress">
                                <div
                                    className="status-progress-bar"
                                    style={{ width: `${(user?.kycLevel || 0) * 33}%` }}
                                ></div>
                            </div>
                        </div>
                        {user?.kycLevel === 0 && (
                            <Link
                                to="/dashboard/verification"
                                className="btn btn-primary w-full justify-center"
                            >
                                Complete Verification
                            </Link>
                        )}
                    </div>

                    {/* Support */}
                    <div className="overview-card p-6">
                        <h3 className="text-subheading mb-3">Need Help?</h3>
                        <p className="text-body mb-4">
                            Our support team is available 24/7 to assist you.
                        </p>
                        <button className="btn w-full justify-center bg-gray-900 text-white hover:bg-gray-800">
                            Contact Support
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
