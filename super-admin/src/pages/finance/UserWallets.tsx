import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getWallets } from 'api/superAdminApi';

interface UserWallet {
    id: string;
    userName: string;
    email: string;
    balance: number;
    totalTransactions: number;
    lastTransaction: string;
    status: 'active' | 'suspended' | 'pending';
    avatar?: string;
}

const UserWallets = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'pending'>('all');
    const [userWallets, setUserWallets] = useState<UserWallet[]>([]);

    useEffect(() => {
        fetchWallets();
    }, []);

    const fetchWallets = async () => {
        try {
            const response = await getWallets();
            if (response.data.success) {
                const mappedWallets = response.data.data.wallets.map((w: any) => ({
                    id: w._id,
                    userName: w.user_id ? `${w.user_id.first_name} ${w.user_id.last_name}` : 'Unknown User',
                    email: w.user_id?.email || 'N/A',
                    balance: w.balance,
                    totalTransactions: 0, // We don't have this in the wallet model yet
                    lastTransaction: w.last_transaction_at ? new Date(w.last_transaction_at).toLocaleDateString() : 'Never',
                    status: w.user_id?.status || 'active',
                }));
                setUserWallets(mappedWallets);
            }
        } catch (error) {
            console.error('Failed to fetch wallets:', error);
        }
    };

    const filteredWallets = userWallets.filter((wallet) => {
        const matchesSearch =
            wallet.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            wallet.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            wallet.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'all' || wallet.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const totalBalance = userWallets.reduce((sum, wallet) => sum + wallet.balance, 0);
    const activeUsers = userWallets.filter((w) => w.status === 'active').length;

    return (
        <div className="px-6 py-8 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">User Wallets</h1>
                    <p className="text-slate-600">
                        Manage user wallet balances and transaction activity
                    </p>
                </div>

                {/* Summary Stats */}
                <div className="flex gap-8 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 rounded-xl border border-emerald-100">
                    <div>
                        <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-1">
                            Total Balance
                        </p>
                        <p className="text-2xl font-bold text-slate-900">
                            ₦{totalBalance.toLocaleString('en-NG')}
                        </p>
                    </div>
                    <div className="border-l border-emerald-200 pl-8">
                        <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-1">
                            Active Users
                        </p>
                        <p className="text-2xl font-bold text-slate-900">{activeUsers}</p>
                    </div>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Icon
                            icon="solar:magnifer-linear"
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            width="20"
                        />
                        <input
                            type="text"
                            placeholder="Search by name, email, or user ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex gap-2">
                        {(['all', 'active', 'suspended', 'pending'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${filterStatus === status
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* User Wallet Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredWallets.map((wallet) => (
                    <div
                        key={wallet.id}
                        className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                        {/* Status Bar */}
                        <div
                            className={`h-2 ${wallet.status === 'active'
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                                : wallet.status === 'suspended'
                                    ? 'bg-gradient-to-r from-red-500 to-rose-600'
                                    : 'bg-gradient-to-r from-amber-500 to-orange-600'
                                }`}
                        />

                        <div className="p-6">
                            {/* User Info */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                                        {wallet.userName
                                            .split(' ')
                                            .map((n) => n[0])
                                            .join('')}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg">
                                            {wallet.userName}
                                        </h3>
                                        <p className="text-sm text-slate-500">{wallet.email}</p>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold ${wallet.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : wallet.status === 'suspended'
                                            ? 'bg-red-50 text-red-600'
                                            : 'bg-amber-50 text-amber-600'
                                        }`}
                                >
                                    {wallet.status.charAt(0).toUpperCase() + wallet.status.slice(1)}
                                </span>
                            </div>

                            {/* Balance */}
                            <div className="mb-4 p-4 bg-gradient-to-br from-slate-50 to-emerald-50 rounded-xl">
                                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">
                                    Wallet Balance
                                </p>
                                <p className="text-3xl font-extrabold text-slate-900">
                                    ₦{wallet.balance.toLocaleString('en-NG')}
                                </p>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                        <Icon icon="solar:bill-list-bold" width="18" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Transactions</p>
                                        <p className="text-sm font-bold text-slate-900">
                                            {wallet.totalTransactions}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                                        <Icon icon="solar:clock-circle-bold" width="18" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Last Active</p>
                                        <p className="text-sm font-bold text-slate-900">
                                            {wallet.lastTransaction}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* User ID */}
                            <div className="mb-4 pb-4 border-b border-slate-100">
                                <p className="text-xs text-slate-500 mb-1">User ID</p>
                                <p className="font-mono text-sm font-semibold text-slate-700">
                                    {wallet.id}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-3 gap-2">
                                <button className="flex items-center justify-center gap-1 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors font-semibold text-sm">
                                    <Icon icon="solar:add-circle-bold" width="18" />
                                    <span>Credit</span>
                                </button>
                                <button className="flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-semibold text-sm">
                                    <Icon icon="solar:minus-circle-bold" width="18" />
                                    <span>Debit</span>
                                </button>
                                <button className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-semibold text-sm">
                                    <Icon icon="solar:list-bold" width="18" />
                                    <span>View</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredWallets.length === 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                        <Icon icon="solar:wallet-bold" width="40" className="text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No wallets found</h3>
                    <p className="text-slate-600">
                        Try adjusting your search query or filter settings
                    </p>
                </div>
            )}

            {/* Pagination Info */}
            {filteredWallets.length > 0 && (
                <div className="flex items-center justify-between px-4">
                    <p className="text-sm text-slate-600">
                        Showing <span className="font-semibold">{filteredWallets.length}</span> of{' '}
                        <span className="font-semibold">{userWallets.length}</span> user wallets
                    </p>
                    <button className="text-emerald-600 font-semibold text-sm hover:text-emerald-700 transition-colors">
                        Load More Wallets →
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserWallets;
