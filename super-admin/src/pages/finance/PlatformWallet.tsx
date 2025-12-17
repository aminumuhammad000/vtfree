import { useState } from 'react';
import { Icon } from '@iconify/react';
import StatsCard from '../../components/dashboard/StatsCard';

interface Transaction {
    id: string;
    type: 'credit' | 'debit';
    description: string;
    amount: number;
    date: string;
    status: 'completed' | 'pending' | 'failed';
}

const PlatformWallet = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('7d');

    // Mock data - replace with actual API calls
    const stats = {
        totalBalance: 24567890,
        totalRevenue: 5432100,
        totalTransactions: 12847,
        pendingWithdrawals: 234500,
    };

    const recentTransactions: Transaction[] = [
        {
            id: 'TXN001',
            type: 'credit',
            description: 'Transaction fees from user payments',
            amount: 45000,
            date: '2025-12-16 10:30 AM',
            status: 'completed',
        },
        {
            id: 'TXN002',
            type: 'debit',
            description: 'Withdrawal to bank account',
            amount: 500000,
            date: '2025-12-16 09:15 AM',
            status: 'completed',
        },
        {
            id: 'TXN003',
            type: 'credit',
            description: 'Platform subscription fees',
            amount: 125000,
            date: '2025-12-15 04:20 PM',
            status: 'completed',
        },
        {
            id: 'TXN004',
            type: 'credit',
            description: 'API usage charges',
            amount: 78500,
            date: '2025-12-15 02:45 PM',
            status: 'completed',
        },
        {
            id: 'TXN005',
            type: 'debit',
            description: 'Payment to service provider',
            amount: 250000,
            date: '2025-12-15 11:30 AM',
            status: 'pending',
        },
    ];

    const periods = [
        { value: '24h', label: '24 Hours' },
        { value: '7d', label: '7 Days' },
        { value: '30d', label: '30 Days' },
        { value: '90d', label: '90 Days' },
    ];

    return (
        <div className="px-6 py-8 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">
                        Platform Wallet
                    </h1>
                    <p className="text-slate-600">
                        Monitor platform finances and transaction history
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300">
                        <Icon icon="solar:download-bold" width="20" />
                        <span>Withdraw</span>
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 font-semibold rounded-xl border-2 border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all duration-300">
                        <Icon icon="solar:document-bold" width="20" />
                        <span>Export Report</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatsCard
                    label="Total Balance"
                    value={stats.totalBalance}
                    icon="solar:wallet-bold"
                    bgGradient="from-emerald-500 to-teal-600"
                    lightBg="bg-emerald-50"
                    textColor="text-emerald-600"
                    isCurrency={true}
                    trend={{ value: 12.5, isPositive: true }}
                />
                <StatsCard
                    label="Total Revenue"
                    value={stats.totalRevenue}
                    icon="solar:chart-2-bold"
                    bgGradient="from-blue-500 to-cyan-600"
                    lightBg="bg-blue-50"
                    textColor="text-blue-600"
                    isCurrency={true}
                    trend={{ value: 8.3, isPositive: true }}
                />
                <StatsCard
                    label="Total Transactions"
                    value={stats.totalTransactions}
                    icon="solar:bill-list-bold"
                    bgGradient="from-purple-500 to-pink-600"
                    lightBg="bg-purple-50"
                    textColor="text-purple-600"
                    trend={{ value: 15.7, isPositive: true }}
                />
                <StatsCard
                    label="Pending Withdrawals"
                    value={stats.pendingWithdrawals}
                    icon="solar:clock-circle-bold"
                    bgGradient="from-amber-500 to-orange-600"
                    lightBg="bg-amber-50"
                    textColor="text-amber-600"
                    isCurrency={true}
                />
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-1">
                                Transaction History
                            </h2>
                            <p className="text-slate-600 text-sm">
                                Recent platform wallet transactions
                            </p>
                        </div>

                        {/* Period Selector */}
                        <div className="flex gap-2">
                            {periods.map((period) => (
                                <button
                                    key={period.value}
                                    onClick={() => setSelectedPeriod(period.value)}
                                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${selectedPeriod === period.value
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {period.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Transaction ID
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Date & Time
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentTransactions.map((transaction) => (
                                <tr
                                    key={transaction.id}
                                    className="hover:bg-slate-50 transition-colors duration-200"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center ${transaction.type === 'credit'
                                                    ? 'bg-emerald-50 text-emerald-600'
                                                    : 'bg-red-50 text-red-600'
                                                    }`}
                                            >
                                                <Icon
                                                    icon={
                                                        transaction.type === 'credit'
                                                            ? 'solar:arrow-down-bold'
                                                            : 'solar:arrow-up-bold'
                                                    }
                                                    width="20"
                                                />
                                            </div>
                                            <span className="font-mono text-sm font-semibold text-slate-900">
                                                {transaction.id}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-slate-900">
                                            {transaction.description}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Icon icon="solar:clock-circle-linear" width="16" />
                                            <span className="text-sm">{transaction.date}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span
                                            className={`text-base font-bold ${transaction.type === 'credit'
                                                ? 'text-emerald-600'
                                                : 'text-red-600'
                                                }`}
                                        >
                                            {transaction.type === 'credit' ? '+' : '-'}₦
                                            {transaction.amount.toLocaleString('en-NG')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <span
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${transaction.status === 'completed'
                                                    ? 'bg-emerald-50 text-emerald-600'
                                                    : transaction.status === 'pending'
                                                        ? 'bg-amber-50 text-amber-600'
                                                        : 'bg-red-50 text-red-600'
                                                    }`}
                                            >
                                                <span
                                                    className={`w-1.5 h-1.5 rounded-full ${transaction.status === 'completed'
                                                        ? 'bg-emerald-600'
                                                        : transaction.status === 'pending'
                                                            ? 'bg-amber-600'
                                                            : 'bg-red-600'
                                                        }`}
                                                />
                                                {transaction.status.charAt(0).toUpperCase() +
                                                    transaction.status.slice(1)}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-sm text-slate-600">
                        Showing <span className="font-semibold">5</span> of{' '}
                        <span className="font-semibold">128</span> transactions
                    </p>
                    <button className="text-emerald-600 font-semibold text-sm hover:text-emerald-700 transition-colors">
                        View All Transactions →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlatformWallet;
