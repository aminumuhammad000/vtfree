import React from 'react';
import { Icon } from '@iconify/react';

interface Transaction {
    _id: string;
    type: string;
    amount: number;
    status: string;
    created_at: string;
}

interface RecentTransactionsProps {
    data: Transaction[];
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ data }) => {
    const getTypeIcon = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'data':
                return <Icon icon="solar:smartphone-2-bold-duotone" width="20" height="20" className="text-white" />;
            case 'airtime':
                return <Icon icon="solar:phone-calling-bold-duotone" width="20" height="20" className="text-white" />;
            default:
                return <Icon icon="solar:wallet-money-bold-duotone" width="20" height="20" className="text-white" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'successful':
            case 'success':
                return <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">Success</span>;
            case 'pending':
                return <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">Pending</span>;
            case 'failed':
                return <span className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">Failed</span>;
            default:
                return <span className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">{status}</span>;
        }
    };

    return (
        <div className="relative bg-gradient-to-br from-white to-slate-50/50 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-slate-100 overflow-hidden group h-full">
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-400/10 to-green-600/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                        <Icon icon="solar:history-bold-duotone" width="20" height="20" className="text-green-600" />
                    </div>
                    Recent Activity
                </h2>
                <div className="space-y-4">
                    {data.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No recent activity</p>
                    ) : (
                        data.map((txn) => (
                            <div key={txn._id} className="flex items-center justify-between pb-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 -mx-2 px-2 py-1 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                                        {getTypeIcon(txn.type)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">{txn.type?.toUpperCase()} - ₦{txn.amount?.toLocaleString()}</p>
                                        <p className="text-xs text-slate-500">{new Date(txn.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                {getStatusBadge(txn.status)}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecentTransactions;
