import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

interface Customer {
    _id: string;
    phone_number: string;
    email?: string;
    name?: string;
    app_name: string;
    user_name: string;
    total_transactions: number;
    total_spent: number;
    last_transaction: string;
    status: string;
}

const AllCustomers = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        // Mock data
        const mockCustomers: Customer[] = [
            { _id: '1', phone_number: '+2348012345678', email: 'customer1@example.com', name: 'Alice Johnson', app_name: 'DataHub Pro', user_name: 'John Doe', total_transactions: 45, total_spent: 25000, last_transaction: '2024-04-20', status: 'active' },
            { _id: '2', phone_number: '+2348023456789', name: 'Bob Smith', app_name: 'QuickRecharge', user_name: 'Jane Smith', total_transactions: 32, total_spent: 18000, last_transaction: '2024-04-19', status: 'active' },
            { _id: '3', phone_number: '+2348034567890', email: 'customer3@example.com', app_name: 'BillPay Express', user_name: 'Bob Johnson', total_transactions: 12, total_spent: 8500, last_transaction: '2024-04-15', status: 'inactive' },
            { _id: '4', phone_number: '+2348045678901', name: 'Diana Prince', app_name: 'DataHub Pro', user_name: 'Alice Williams', total_transactions: 67, total_spent: 42000, last_transaction: '2024-04-21', status: 'active' },
            { _id: '5', phone_number: '+2348056789012', email: 'customer5@example.com', name: 'Eve Anderson', app_name: 'Mobile Topup', user_name: 'Charlie Brown', total_transactions: 23, total_spent: 15000, last_transaction: '2024-04-18', status: 'active' },
        ];
        setCustomers(mockCustomers);
        setLoading(false);
    }, []);

    const filteredCustomers = customers.filter(customer => {
        const matchesSearch = customer.phone_number.includes(searchTerm) ||
            customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.app_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.user_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = [
        { label: 'Total Customers', value: customers.length, icon: 'solar:users-group-rounded-bold-duotone', color: 'blue' },
        { label: 'Active', value: customers.filter(c => c.status === 'active').length, icon: 'solar:user-check-bold-duotone', color: 'green' },
        { label: 'Total Spent', value: `₦${customers.reduce((sum, c) => sum + c.total_spent, 0).toLocaleString()}`, icon: 'solar:wallet-money-bold-duotone', color: 'purple' },
        { label: 'Avg per Customer', value: `₦${Math.round(customers.reduce((sum, c) => sum + c.total_spent, 0) / customers.length).toLocaleString()}`, icon: 'solar:chart-bold-duotone', color: 'orange' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">All Customers</h1>
                <p className="text-slate-500 mt-1">View all customers across all apps and users</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <div key={index} className={`bg-white rounded-xl p-5 border border-${stat.color}-100 hover:shadow-lg transition-all`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-3 bg-${stat.color}-50 rounded-xl`}>
                                <Icon icon={stat.icon} width="24" height="24" className={`text-${stat.color}-600`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                                <p className="text-sm text-slate-500">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Icon icon="solar:magnifer-linear" width="20" height="20" className="absolute left-3 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by phone, name, email, app, or user..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Customer</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">App</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase hidden lg:table-cell">Owner</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase hidden xl:table-cell">Transactions</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase hidden lg:table-cell">Total Spent</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase hidden xl:table-cell">Last Activity</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center">Loading...</td></tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">No customers found</td></tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                                                    {customer.name ? customer.name[0] : customer.phone_number[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-900 truncate">{customer.name || 'Unknown'}</p>
                                                    <p className="text-xs text-slate-500 truncate">{customer.phone_number}</p>
                                                    {customer.email && (
                                                        <p className="text-xs text-slate-400 truncate">{customer.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <span className="text-sm font-medium text-slate-900">{customer.app_name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 hidden lg:table-cell">{customer.user_name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-medium hidden xl:table-cell">{customer.total_transactions}</td>
                                        <td className="px-6 py-4 text-sm font-mono text-slate-700 hidden lg:table-cell">₦{customer.total_spent.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500 hidden xl:table-cell">
                                            {new Date(customer.last_transaction).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                                <Icon icon="solar:menu-dots-bold" width="20" height="20" className="text-slate-400" />
                                            </button>
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

export default AllCustomers;
