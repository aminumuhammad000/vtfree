import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { getProviderBalances, getAllConfigs } from '../../api/adminApi';

const FundingPanel: React.FC = () => {

    // Default Gateway config (kept for future use)
    const { data: configRes } = useQuery({
        queryKey: ['system-configs'],
        queryFn: async () => {
            const res = await getAllConfigs();
            return res.data?.data || [];
        },
    });

    const defaultGateway = Array.isArray(configRes)
        ? configRes.find((c: any) => c.key === 'DEFAULT_PAYMENT_GATEWAY')?.value || 'vtstack'
        : 'vtstack';

    // Provider Balances
    const { data: balancesRes, status: balancesStatus } = useQuery({
        queryKey: ['provider-balances'],
        queryFn: async () => {
            const res = await getProviderBalances();
            return res.data?.data as {
                providers: Array<{
                    code: string;
                    name: string;
                    balance: number | string | null;
                    currency: string | null;
                    status: string;
                    reason?: string;
                }>;
                total: number;
            };
        }
    });

    const providers = balancesRes?.providers || [];
    const total = balancesRes?.total || 0;

    return (
        <div className="space-y-5">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Total Provider Balance */}
                <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-5 text-white overflow-hidden">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full blur-2xl -mr-14 -mt-14" />
                    <div className="relative">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100 mb-2">Provider Balance</p>
                        <p className="text-3xl font-extrabold">₦{Number(total || 0).toLocaleString()}</p>
                        <p className="text-xs text-blue-200 uppercase tracking-wide mt-1">Total Across All Providers</p>
                    </div>
                </div>

                {/* Active Providers */}
                <div className="relative bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg p-5 text-white overflow-hidden">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full blur-2xl -mr-14 -mt-14" />
                    <div className="relative">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-100 mb-2">Active Providers</p>
                        <p className="text-3xl font-extrabold">{providers.length}</p>
                        <p className="text-xs text-amber-200 uppercase tracking-wide mt-1">
                            Gateway: <span className="font-black uppercase">{defaultGateway}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Provider Balances Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-800">Provider Balances</h2>
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live</span>
                    </div>
                </div>

                {balancesStatus === 'pending' && (
                    <div className="py-10 text-center">
                        <div className="inline-block w-7 h-7 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                        <p className="text-xs text-slate-400 font-medium">Loading balances...</p>
                    </div>
                )}

                {balancesStatus === 'error' && (
                    <div className="py-8 text-center text-sm text-red-500 font-medium">
                        Failed to load provider balances.
                    </div>
                )}

                {balancesStatus === 'success' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-5 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Provider</th>
                                    <th className="px-5 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Code</th>
                                    <th className="px-5 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Balance</th>
                                    <th className="px-5 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {providers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-5 py-8 text-center text-xs text-slate-400">
                                            No providers found.
                                        </td>
                                    </tr>
                                ) : (
                                    providers.map((p) => {
                                        const isConfigError = p.reason?.toLowerCase().includes('configuration') ||
                                            p.reason?.toLowerCase().includes('api key') ||
                                            p.reason?.toLowerCase().includes('unauthorized') ||
                                            p.reason?.includes('401') || p.reason?.includes('403');

                                        return (
                                            <tr key={p.code} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-3">
                                                    <span className="text-sm font-semibold text-slate-800">{p.name}</span>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className="text-xs font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">
                                                        {p.code}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3">
                                                    {p.balance === null || p.balance === '***.**' ? (
                                                        p.status === 'error' ? (
                                                            <div>
                                                                <span className="text-xs font-bold text-red-600">Error</span>
                                                                {isConfigError && (
                                                                    <p className="text-[9px] text-red-400 mt-0.5">Check API Configuration</p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-400">{p.balance === '***.**' ? '***.**' : 'N/A'}</span>
                                                        )
                                                    ) : (
                                                        <span className="text-sm font-bold text-slate-800">₦{Number(p.balance).toLocaleString()}</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                                        p.status === 'ok'
                                                            ? 'bg-green-100 text-green-700'
                                                            : p.status === 'unsupported'
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FundingPanel;
