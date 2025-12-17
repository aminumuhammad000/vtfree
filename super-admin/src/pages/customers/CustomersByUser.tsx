import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

interface UserCustomers {
    user_id: string;
    user_name: string;
    user_email: string;
    total_customers: number;
    total_apps: number;
    total_revenue: number;
    customers: {
        _id: string;
        phone_number: string;
        name?: string;
        app_name: string;
        transactions: number;
        spent: number;
    }[];
}

const CustomersByUser = () => {
    const [data, setData] = useState<UserCustomers[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Mock data
        const mockData: UserCustomers[] = [
            {
                user_id: '1',
                user_name: 'John Doe',
                user_email: 'john@example.com',
                total_customers: 320,
                total_apps: 3,
                total_revenue: 6800000,
                customers: [
                    { _id: '1', phone_number: '+2348012345678', name: 'Alice Johnson', app_name: 'DataHub Pro', transactions: 45, spent: 125000 },
                    { _id: '2', phone_number: '+2348023456789', name: 'Bob Smith', app_name: 'QuickRecharge', transactions: 32, spent: 98000 },
                ]
            },
            {
                user_id: '2',
                user_name: 'Jane Smith',
                user_email: 'jane@example.com',
                total_customers: 245,
                total_apps: 2,
                total_revenue: 4500000,
                customers: [
                    { _id: '3', phone_number: '+2348034567890', app_name: 'BillPay Express', transactions: 28, spent: 75000 },
                ]
            },
        ];
        setData(mockData);
        setSelectedUser(mockData[0]?.user_id || null);
        setLoading(false);
    }, []);

    const selectedUserData = data.find(user => user.user_id === selectedUser);
    const filteredCustomers = selectedUserData?.customers.filter(c =>
        c.phone_number.includes(searchTerm) ||
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.app_name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Customers by User</h1>
                <p className="text-slate-500 mt-1">View customers grouped by app owners</p>
            </div>

            {/* User Selector Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.map((user) => (
                    <div
                        key={user.user_id}
                        onClick={() => setSelectedUser(user.user_id)}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${selectedUser === user.user_id
                                ? 'border-green-500 bg-green-50 shadow-lg'
                                : 'border-slate-200 bg-white hover:border-green-300 hover:shadow-md'
                            }`}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {user.user_name[0]}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-900">{user.user_name}</h3>
                                <p className="text-sm text-slate-500 truncate">{user.user_email}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="text-center p-2 bg-white rounded-lg">
                                <p className="text-xs text-slate-500 mb-1">Customers</p>
                                <p className="text-base font-bold text-blue-600">{user.total_customers}</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded-lg">
                                <p className="text-xs text-slate-500 mb-1">Apps</p>
                                <p className="text-base font-bold text-purple-600">{user.total_apps}</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded-lg">
                                <p className="text-xs text-slate-500 mb-1">Revenue</p>
                                <p className="text-base font-bold text-green-600">₦{(user.total_revenue / 1000).toFixed(0)}k</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Selected User Details */}
            {selectedUserData && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{selectedUserData.user_name}'s Customers</h2>
                            <p className="text-sm text-slate-500">{selectedUserData.total_apps} apps • {selectedUserData.total_customers} total customers</p>
                        </div>
                        <div className="relative">
                            <Icon icon="solar:magnifer-linear" width="20" height="20" className="absolute left-3 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search customers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all w-64"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {filteredCustomers.map((customer) => (
                            <div key={customer._id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                                        {customer.name ? customer.name[0] : customer.phone_number[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900 truncate">{customer.name || 'Unknown'}</p>
                                        <p className="text-sm text-slate-500">{customer.phone_number}</p>
                                        <p className="text-xs text-blue-600 mt-0.5">{customer.app_name}</p>
                                    </div>
                                </div>
                                <div className="flex gap-6 flex-shrink-0">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">Transactions</p>
                                        <p className="font-bold text-slate-900">{customer.transactions}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">Total Spent</p>
                                        <p className="font-bold text-green-600">₦{customer.spent.toLocaleString()}</p>
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

export default CustomersByUser;
