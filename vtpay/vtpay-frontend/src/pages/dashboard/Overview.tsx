import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    CreditCard,
    History,
    TrendingUp,
    Eye,
    EyeOff,
    Plus,
    Send,
    Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Overview: React.FC = () => {
    const { user } = useAuth();
    const [wallet, setWallet] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [walletStats, setWalletStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showBalance, setShowBalance] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [walletRes, txnsRes, statsRes] = await Promise.all([
                    api.get('/wallet'),
                    api.get('/wallet/transactions?limit=5'),
                    api.get('/wallet/stats')
                ]);
                setWallet(walletRes.data.data);
                setTransactions(txnsRes.data.data.transactions);
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
        <div className="space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Welcome back, <span className="font-semibold text-slate-700">{user?.firstName}</span> 👋</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        to="/dashboard/wallet"
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm font-medium group"
                    >
                        <Plus size={18} className="text-slate-400 group-hover:text-green-600 transition-colors" />
                        Fund Wallet
                    </Link>
                    <Link
                        to="/dashboard/wallet"
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 hover:shadow-lg hover:shadow-green-200 transition-all shadow-md font-medium"
                    >
                        <Send size={18} />
                        Transfer
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Premium Balance Card */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
                    {/* Abstract Background Shapes */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-500/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm border border-white/5">
                                <Wallet size={14} className="text-green-400" />
                                <span className="text-xs font-medium text-slate-200">Main Wallet</span>
                            </div>
                            <button
                                onClick={() => setShowBalance(!showBalance)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                            >
                                {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <div className="mb-8">
                            <p className="text-slate-400 text-sm font-medium mb-1">Total Balance</p>
                            <h2 className="text-4xl font-bold tracking-tight text-white">
                                {showBalance ? formatCurrency(wallet?.balanceNaira || 0) : '••••••••'}
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Available</p>
                                </div>
                                <p className="font-semibold text-lg text-slate-100">
                                    {showBalance ? formatCurrency(wallet?.availableBalanceNaira || 0) : '••••••'}
                                </p>
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Locked</p>
                                </div>
                                <p className="font-semibold text-lg text-slate-100">
                                    {showBalance ? formatCurrency(wallet?.lockedBalanceNaira || 0) : '••••••'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Money In Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-6">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            <TrendingUp size={24} />
                        </div>
                        <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-green-50 text-green-700 rounded-full border border-green-100">
                            <Activity size={12} />
                            +12.5%
                        </span>
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">Total Money In</p>
                        <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
                            {showBalance ? formatCurrency(walletStats?.totalInflowNaira || 0) : '••••••••'}
                        </h3>
                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                            <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                            Total received across all channels
                        </p>
                    </div>
                </div>

                {/* Quick Actions Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        Quick Actions
                    </h3>
                    <div className="space-y-3">
                        <Link
                            to="/dashboard/virtual-accounts"
                            className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200 group"
                        >
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform shadow-sm">
                                <CreditCard size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-slate-900 text-sm">Virtual Accounts</p>
                                    <ArrowUpRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">Create & manage accounts</p>
                            </div>
                        </Link>
                        <Link
                            to="/dashboard/transactions"
                            className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200 group"
                        >
                            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg group-hover:scale-110 transition-transform shadow-sm">
                                <History size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-slate-900 text-sm">Transaction History</p>
                                    <ArrowUpRight size={16} className="text-slate-300 group-hover:text-purple-500 transition-colors" />
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">View recent activity</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <div>
                        <h2 className="font-bold text-slate-900 text-lg">Recent Transactions</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Your latest financial activities</p>
                    </div>
                    <Link
                        to="/dashboard/transactions"
                        className="text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        View All
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Reference</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <History size={24} className="text-slate-300" />
                                        </div>
                                        <p className="text-slate-500 font-medium">No recent transactions found</p>
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((txn) => (
                                    <tr key={txn.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${txn.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                                    } group-hover:scale-110 transition-transform`}>
                                                    {txn.type === 'credit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                                </div>
                                                <span className="font-medium text-slate-900 capitalize">{txn.type}</span>
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 font-bold ${txn.type === 'credit' ? 'text-green-600' : 'text-slate-900'
                                            }`}>
                                            {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amountNaira)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                            {txn.reference}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${txn.status === 'success' ? 'bg-green-50 text-green-700 border-green-100' :
                                                    txn.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                                        'bg-red-50 text-red-700 border-red-100'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${txn.status === 'success' ? 'bg-green-500' :
                                                        txn.status === 'pending' ? 'bg-yellow-500' :
                                                            'bg-red-500'
                                                    }`}></span>
                                                {txn.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {new Date(txn.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
