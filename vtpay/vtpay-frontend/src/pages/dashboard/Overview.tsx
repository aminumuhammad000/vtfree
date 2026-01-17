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
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                    <p className="text-gray-600 font-medium">Loading...</p>
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
        <div className="space-y-6 max-w-[1400px] p-6">
            {/* Header */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-50 rounded-full -ml-24 -mb-24 opacity-50 blur-3xl"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Dashboard</h1>
                            <button
                                onClick={() => setShowBalance(!showBalance)}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
                                title={showBalance ? "Hide Balance" : "Show Balance"}
                            >
                                {showBalance ?
                                    <Eye className="w-5 h-5 text-gray-400 group-hover:text-green-600" /> :
                                    <EyeOff className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
                                }
                            </button>
                        </div>
                        <p className="text-gray-500 font-medium mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-6 py-2.5 rounded-xl border border-gray-200 hover:border-green-200 hover:bg-green-50 transition-all duration-200 flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <button className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-all duration-200 flex items-center gap-2 text-sm font-semibold shadow-lg shadow-green-200 hover:shadow-green-300">
                            <Plus className="w-4 h-4" />
                            Fund Wallet
                        </button>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((metric, index) => (
                    <div
                        key={index}
                        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600 group-hover:bg-green-50 group-hover:text-green-600 transition-colors duration-300">
                                {metric.icon}
                            </div>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${metric.trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                }`}>
                                {metric.change}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-500 mb-1">{metric.label}</p>
                            <p className="text-2xl font-bold text-gray-900 tracking-tight">{metric.value}</p>
                            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                <Activity className="w-3 h-3" />
                                {metric.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Section - 2 columns */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Balance Overview */}
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Balance Overview</h2>
                                <p className="text-sm text-gray-500 mt-1">Your wallet performance and distribution</p>
                            </div>
                            <div className="bg-gray-50 p-1 rounded-xl flex gap-1">
                                {(['7d', '30d', '90d'] as const).map((period) => (
                                    <button
                                        key={period}
                                        onClick={() => setTimeframe(period)}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${timeframe === period
                                            ? 'bg-white text-green-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {period === '7d' ? '7D' : period === '30d' ? '30D' : '90D'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="relative pl-6">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-full"></div>
                                    <p className="text-sm font-semibold text-gray-500 mb-2">Available Balance</p>
                                    <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
                                        {showBalance ? formatCompactCurrency(wallet?.availableBalanceNaira || 0) : '••••'}
                                    </p>
                                </div>
                                <div className="relative pl-6">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-full"></div>
                                    <p className="text-sm font-semibold text-gray-500 mb-2">Locked Balance</p>
                                    <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
                                        {showBalance ? formatCompactCurrency(wallet?.lockedBalanceNaira || 0) : '••••'}
                                    </p>
                                </div>
                            </div>

                            {/* Visual Chart Bars */}
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between text-xs mb-2">
                                        <span className="text-gray-500">Available</span>
                                        <span className="font-medium text-gray-900">
                                            {showBalance ? Math.round((wallet?.availableBalanceNaira / wallet?.balanceNaira) * 100 || 0) : '••'}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                                            style={{ width: `${(wallet?.availableBalanceNaira / wallet?.balanceNaira) * 100 || 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between text-xs mb-2">
                                        <span className="text-gray-500">Locked</span>
                                        <span className="font-medium text-gray-900">
                                            {showBalance ? Math.round((wallet?.lockedBalanceNaira / wallet?.balanceNaira) * 100 || 0) : '••'}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
                                            style={{ width: `${(wallet?.lockedBalanceNaira / wallet?.balanceNaira) * 100 || 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Latest activity on your account</p>
                            </div>
                            <Link
                                to="/dashboard/transactions"
                                className="px-4 py-2 text-sm font-bold text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200 flex items-center gap-2 group"
                            >
                                View all
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {transactions.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Activity className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <p className="text-gray-900 font-bold">No transactions yet</p>
                                    <p className="text-sm text-gray-500 mt-1">Your transactions will appear here</p>
                                </div>
                            ) : (
                                transactions.slice(0, 8).map((txn) => (
                                    <div
                                        key={txn.id}
                                        className="p-4 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${txn.type === 'credit'
                                                ? 'bg-green-50 text-green-600'
                                                : 'bg-gray-50 text-gray-600'
                                                }`}>
                                                {txn.type === 'credit' ? (
                                                    <ArrowDownLeft className="w-5 h-5" />
                                                ) : (
                                                    <ArrowUpRight className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 capitalize">{txn.type}</p>
                                                <p className="text-xs text-gray-400 font-mono mt-0.5">{txn.reference}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-bold ${txn.type === 'credit' ? 'text-green-600' : 'text-gray-900'
                                                }`}>
                                                {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amountNaira)}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-1 font-medium uppercase tracking-wider">
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
                <div className="space-y-8">
                    {/* Quick Actions */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h3>
                        <div className="space-y-4">
                            {[
                                { to: "/dashboard/virtual-accounts", icon: <CreditCard />, label: "Virtual Accounts", sub: "Create & manage", color: "blue" },
                                { to: "/dashboard/developer", icon: <Zap />, label: "API Keys", sub: "Developer tools", color: "purple" },
                                { to: "/dashboard/verification", icon: <CheckCircle2 />, label: "Verification", sub: "KYC status", color: "amber" }
                            ].map((action, i) => (
                                <Link
                                    key={i}
                                    to={action.to}
                                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-all duration-200 group"
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-200 ${action.color === 'blue' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-100' :
                                        action.color === 'purple' ? 'bg-purple-50 text-purple-600 group-hover:bg-purple-100' :
                                            'bg-amber-50 text-amber-600 group-hover:bg-amber-100'
                                        }`}>
                                        {React.cloneElement(action.icon as React.ReactElement<any>, { className: "w-5 h-5" })}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-900">{action.label}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{action.sub}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Account Status */}
                    <div className="bg-gradient-to-br from-green-600 to-green-700 p-8 rounded-3xl shadow-lg shadow-green-100 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <div className="relative">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Account Status</h3>
                                    <p className="text-green-100 text-sm mt-0.5">Verification Level {user?.kycLevel || 0}</p>
                                </div>
                            </div>
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-green-100">Completion Progress</span>
                                    <span>{(user?.kycLevel || 0) * 33}%</span>
                                </div>
                                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-white rounded-full transition-all duration-1000"
                                        style={{ width: `${(user?.kycLevel || 0) * 33}%` }}
                                    ></div>
                                </div>
                            </div>
                            {user?.kycLevel === 0 && (
                                <Link
                                    to="/dashboard/verification"
                                    className="w-full py-3 bg-white text-green-600 font-bold rounded-xl flex items-center justify-center hover:bg-green-50 transition-colors shadow-lg"
                                >
                                    Complete Verification
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Support */}
                    <div className="bg-gray-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-green-500/20 rounded-full -mr-16 -mb-16 blur-2xl"></div>
                        <div className="relative">
                            <h3 className="text-lg font-bold mb-3">Need Help?</h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                Our support team is available 24/7 to assist you with any issues.
                            </p>
                            <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2">
                                <Activity className="w-4 h-4" />
                                Contact Support
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
