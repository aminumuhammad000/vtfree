import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import StatsCard from 'components/dashboard/StatsCard';

const UserDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Mock data for now
    const user = {
        _id: id,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone_number: '1234567890',
        status: 'active',
        kyc_status: 'verified',
        created_at: '2023-01-01T00:00:00Z',
        apps_count: 2,
        wallet_balance: 5000,
        address: '123 Main St, Lagos, Nigeria',
        bvn: '12345678901',
        nin: '12345678901',
    };

    const stats = [
        {
            label: 'Wallet Balance',
            value: user.wallet_balance,
            icon: 'solar:wallet-money-bold-duotone',
            bgGradient: 'from-green-500 to-green-600',
            lightBg: 'bg-green-50',
            textColor: 'text-green-600',
            isCurrency: true,
        },
        {
            label: 'Total Apps',
            value: user.apps_count,
            icon: 'solar:smartphone-2-bold-duotone',
            bgGradient: 'from-blue-500 to-blue-600',
            lightBg: 'bg-blue-50',
            textColor: 'text-blue-600',
        },
        {
            label: 'Total Transactions',
            value: 156,
            icon: 'solar:bill-list-bold-duotone',
            bgGradient: 'from-purple-500 to-purple-600',
            lightBg: 'bg-purple-50',
            textColor: 'text-purple-600',
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <Icon icon="solar:arrow-left-linear" width="24" height="24" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">User Details</h1>
                    <p className="text-slate-500">View and manage user information</p>
                </div>
            </div>

            {/* User Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-3xl">
                        {user.first_name[0]}{user.last_name[0]}
                    </div>
                    <div className="flex-1 space-y-6">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{user.first_name} {user.last_name}</h2>
                                <div className="flex items-center gap-2 mt-1 text-slate-500">
                                    <Icon icon="solar:letter-linear" width="16" height="16" />
                                    <span>{user.email}</span>
                                    <span className="mx-2">•</span>
                                    <Icon icon="solar:phone-linear" width="16" height="16" />
                                    <span>{user.phone_number}</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {user.status.toUpperCase()}
                                </span>
                                <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${user.kyc_status === 'verified' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    KYC: {user.kyc_status.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Address</p>
                                <p className="font-medium text-slate-900">{user.address}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Joined Date</p>
                                <p className="font-medium text-slate-900">{new Date(user.created_at).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 mb-1">BVN</p>
                                <p className="font-medium text-slate-900">{user.bvn}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 mb-1">NIN</p>
                                <p className="font-medium text-slate-900">{user.nin}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <StatsCard key={index} {...stat} />
                ))}
            </div>

            {/* Connected Apps */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Connected Apps</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                                    <Icon icon="solar:smartphone-2-bold-duotone" width="24" height="24" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">App Name {i}</p>
                                    <p className="text-xs text-slate-500">ID: APP-{1000 + i}</p>
                                </div>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Transactions</span>
                                <span className="font-medium text-slate-900">1,234</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UserDetails;
