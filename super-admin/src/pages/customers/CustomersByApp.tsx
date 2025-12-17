import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

interface AppCustomers {
    app_id: string;
    app_name: string;
    total_customers: number;
    active_customers: number;
    total_transactions: number;
    total_revenue: number;
    customers: {
        _id: string;
        phone_number: string;
        name?: string;
        transactions: number;
        spent: number;
        last_activity: string;
    }[];
}

const CustomersByApp = () => {
    const [data, setData] = useState<AppCustomers[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Mock data
        const mockData: AppCustomers[] = [
            {
                app_id: '1',
                app_name: 'DataHub Pro',
                total_customers: 245,
                active_customers: 198,
                total_transactions: 3450,
                total_revenue: 5200000,
                customers: [
                    { _id: '1', phone_number: '+2348012345678', name: 'Alice Johnson', transactions: 45, spent: 125000, last_activity: '2024-04-20' },
                    { _id: '2', phone_number: '+2348023456789', name: 'Bob Smith', transactions: 32, spent: 98000, last_activity: '2024-04-19' },
                    { _id: '3', phone_number: '+2348034567890', transactions: 28, spent: 75000, last_activity: '2024-04-18' },
                ]
            },
            {
                app_id: '2',
                app_name: 'QuickRecharge',
                total_customers: 189,
                active_customers: 142,
                total_transactions: 2890,
                total_revenue: 3800000,
                customers: [
                    { _id: '4', phone_number: '+2348045678901', name: 'Charlie Brown', transactions: 52, spent: 145000, last_activity: '2024-04-21' },
                    { _id: '5', phone_number: '+2348056789012', transactions: 38, spent: 92000, last_activity: '2024-04-17' },
                ]
            },
        ];
        setData(mockData);
        setSelectedApp(mockData[0]?.app_id || null);
        setLoading(false);
    }, []);

    const selectedAppData = data.find(app => app.app_id === selectedApp);
    const filteredCustomers = selectedAppData?.customers.filter(c =>
        c.phone_number.includes(searchTerm) || c.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Customers by App</h1>
                <p className="text-slate-500 mt-1">View customers grouped by their applications</p>
            </div>

            {/* App Selector Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.map((app) => (
                    <div
                        key={app.app_id}
                        onClick={() => setSelectedApp(app.app_id)}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${selectedApp === app.app_id
                                ? 'border-blue-500 bg-blue-50 shadow-lg'
                                : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'
                            }`}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                {app.app_name[0]}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-900">{app.app_name}</h3>
                                <p className="text-sm text-slate-500">{app.total_customers} customers</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-2 bg-white rounded-lg">
                                <p className="text-xs text-slate-500 mb-1">Active</p>
                                <p className="text-lg font-bold text-green-600">{app.active_customers}</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded-lg">
                                <p className="text-xs text-slate-500 mb-1">Revenue</p>
                                <p className="text-lg font-bold text-purple-600">₦{(app.total_revenue / 1000).toFixed(0)}k</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Selected App Details */}
            {selectedAppData && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900">{selectedAppData.app_name} Customers</h2>
                        <div className="relative">
                            <Icon icon="solar:magnifer-linear" width="20" height="20" className="absolute left-3 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search customers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-64"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {filteredCustomers.map((customer) => (
                            <div key={customer._id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                        {customer.name ? customer.name[0] : customer.phone_number[0]}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">{customer.name || 'Unknown'}</p>
                                        <p className="text-sm text-slate-500">{customer.phone_number}</p>
                                    </div>
                                </div>
                                <div className="flex gap-6">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">Transactions</p>
                                        <p className="font-bold text-slate-900">{customer.transactions}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">Total Spent</p>
                                        <p className="font-bold text-green-600">₦{customer.spent.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right hidden lg:block">
                                        <p className="text-xs text-slate-500">Last Activity</p>
                                        <p className="text-sm text-slate-600">{new Date(customer.last_activity).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomersByApp;
