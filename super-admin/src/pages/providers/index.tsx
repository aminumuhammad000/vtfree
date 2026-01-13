import { useState } from 'react';
import { Icon } from '@iconify/react';

interface Provider {
    id: string;
    name: string;
    type: 'VTU' | 'Data' | 'Electricity' | 'Cable';
    status: 'active' | 'inactive' | 'maintenance';
    balance: number;
    successRate: number;
    lastUsed: string;
}

const Providers = () => {
    const [providers] = useState<Provider[]>([
        {
            id: 'PROV-001',
            name: 'MTN VTU Provider',
            type: 'VTU',
            status: 'active',
            balance: 150000,
            successRate: 98.5,
            lastUsed: '2 mins ago'
        },
        {
            id: 'PROV-002',
            name: 'Airtel Data Service',
            type: 'Data',
            status: 'active',
            balance: 85000,
            successRate: 97.2,
            lastUsed: '5 mins ago'
        },
        {
            id: 'PROV-003',
            name: 'Glo VTU Gateway',
            type: 'VTU',
            status: 'maintenance',
            balance: 45000,
            successRate: 92.0,
            lastUsed: '1 hour ago'
        },
        {
            id: 'PROV-004',
            name: 'DSTV/GOTV API',
            type: 'Cable',
            status: 'active',
            balance: 210000,
            successRate: 99.1,
            lastUsed: '12 mins ago'
        }
    ]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Service Providers</h1>
                    <p className="text-slate-500 mt-1">Manage and monitor external service provider integrations</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
                    <Icon icon="solar:add-circle-bold" width="20" height="20" />
                    <span>Add Provider</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {providers.map((provider) => (
                    <div key={provider.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${provider.type === 'VTU' ? 'bg-blue-50 text-blue-600' :
                                    provider.type === 'Data' ? 'bg-emerald-50 text-emerald-600' :
                                        provider.type === 'Cable' ? 'bg-purple-50 text-purple-600' :
                                            'bg-amber-50 text-amber-600'
                                }`}>
                                <Icon icon={
                                    provider.type === 'VTU' ? 'solar:smartphone-bold' :
                                        provider.type === 'Data' ? 'solar:globus-bold' :
                                            provider.type === 'Cable' ? 'solar:tv-bold' :
                                                'solar:bolt-bold'
                                } width="24" />
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${provider.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                    provider.status === 'maintenance' ? 'bg-amber-100 text-amber-700' :
                                        'bg-slate-100 text-slate-700'
                                }`}>
                                {provider.status}
                            </span>
                        </div>
                        <h3 className="font-bold text-slate-900">{provider.name}</h3>
                        <p className="text-xs text-slate-500 mt-1">{provider.type} Service</p>

                        <div className="mt-6 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Balance</span>
                                <span className="font-bold text-slate-900">₦{provider.balance.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Success Rate</span>
                                <span className="font-bold text-emerald-600">{provider.successRate}%</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Last Used</span>
                                <span className="text-slate-600">{provider.lastUsed}</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                            <button className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">Configure</button>
                            <button className="text-sm font-semibold text-slate-400 hover:text-slate-600">Logs</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Providers;
