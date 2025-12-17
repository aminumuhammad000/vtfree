import React from 'react';
import { Icon } from '@iconify/react';

interface Transaction {
    _id: string;
    type: string;
    amount: number;
    status: string;
    created_at: string;
    user?: {
        name: string;
        email: string;
    };
}

interface RecentTransactionsProps {
    data: Transaction[];
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ data }) => {
    const getTypeIcon = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'data':
                return { icon: 'solar:smartphone-2-bold-duotone', color: 'text-blue-600', bg: 'bg-blue-100' };
            case 'airtime':
                return { icon: 'solar:phone-calling-bold-duotone', color: 'text-purple-600', bg: 'bg-purple-100' };
            case 'wallet':
            case 'funding':
                return { icon: 'solar:wallet-money-bold-duotone', color: 'text-green-600', bg: 'bg-green-100' };
            default:
                return { icon: 'solar:bill-list-bold-duotone', color: 'text-slate-600', bg: 'bg-slate-100' };
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'successful':
            case 'success':
                return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Success</span>;
            case 'pending':
                return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">Pending</span>;
            case 'failed':
                return <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">Failed</span>;
            default:
                return <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">{status}</span>;
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                        <Icon icon="solar:history-bold-duotone" width="24" height="24" className="text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div className="p-4 bg-slate-50 rounded-full mb-4">
                            <Icon icon="solar:inbox-line-bold-duotone" width="48" height="48" className="text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-500 font-medium">No recent activity</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {data.map((txn) => {
                            const typeConfig = getTypeIcon(txn.type);
                            return (
                                <div key={txn._id} className="p-4 hover:bg-slate-50/50 transition-colors cursor-pointer group">
                                    <div className="flex items-start gap-3">
                                        <div className={`${typeConfig.bg} p-2.5 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                            <Icon icon={typeConfig.icon} width="20" height="20" className={typeConfig.color} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">
                                                        {txn.type?.toUpperCase()} - ₦{txn.amount?.toLocaleString()}
                                                    </p>
                                                    {txn.user && (
                                                        <p className="text-xs text-slate-500 truncate">{txn.user.name || txn.user.email}</p>
                                                    )}
                                                </div>
                                                {getStatusBadge(txn.status)}
                                            </div>
                                            <p className="text-xs text-slate-400">
                                                {new Date(txn.created_at).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecentTransactions;
