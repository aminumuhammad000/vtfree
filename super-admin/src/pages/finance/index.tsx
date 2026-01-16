import { useState } from 'react';
import { Icon } from '@iconify/react';
import PlatformWallet from './PlatformWallet';
import UserWallets from './UserWallets';
import Withdrawals from './Withdrawals';
import RevenueAnalytics from './RevenueAnalytics';
import Transfers from './Transfers';
import Settlements from './Settlements';

type TabType = 'platform' | 'wallets' | 'withdrawals' | 'analytics' | 'transfers' | 'settlements';

const Finance = () => {
    const [activeTab, setActiveTab] = useState<TabType>('platform');

    const tabs = [
        { id: 'platform' as const, label: 'Platform Wallet', icon: 'solar:wallet-bold' },
        { id: 'wallets' as const, label: 'User Wallets', icon: 'solar:users-group-rounded-bold' },
        { id: 'withdrawals' as const, label: 'Withdrawals', icon: 'solar:card-transfer-bold' },
        { id: 'analytics' as const, label: 'Revenue Analytics', icon: 'solar:chart-2-bold' },
        { id: 'transfers' as const, label: 'Transfers', icon: 'solar:transfer-horizontal-bold' },
        { id: 'settlements' as const, label: 'Settlements', icon: 'solar:bill-check-bold' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Wallet & Finance</h1>
                <p className="text-slate-500 mt-1">Manage platform funds, user wallets, and financial transactions</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all duration-300 border-b-2 whitespace-nowrap ${activeTab === tab.id
                                ? 'border-emerald-600 text-emerald-600'
                                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                                }`}
                        >
                            <Icon icon={tab.icon} width="20" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="mt-6">
                {activeTab === 'platform' && <PlatformWallet />}
                {activeTab === 'wallets' && <UserWallets />}
                {activeTab === 'withdrawals' && <Withdrawals />}
                {activeTab === 'analytics' && <RevenueAnalytics />}
                {activeTab === 'transfers' && <Transfers />}
                {activeTab === 'settlements' && <Settlements />}
            </div>
        </div>
    );
};

export default Finance;
