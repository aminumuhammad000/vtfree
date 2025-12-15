import React, { useEffect, useState } from 'react';
import api from 'services/api';
import StatsCard from 'components/dashboard/StatsCard';
import RecentTransactions from 'components/dashboard/RecentTransactions';
import TopApps from 'components/dashboard/TopApps';

interface DashboardData {
  total_users: number;
  total_transactions: number;
  revenue: number;
  active_users: number;
  recent_transactions: any[];
  top_apps: any[];
  daily_stats: any[];
}

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/super-admin/dashboard');
        setData(response.data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    {
      label: 'Total Users',
      value: data?.total_users || 0,
      icon: 'solar:users-group-rounded-bold-duotone',
      bgGradient: 'from-blue-500 to-blue-600',
      lightBg: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Active Users',
      value: data?.active_users || 0,
      icon: 'solar:user-check-bold-duotone',
      bgGradient: 'from-green-500 to-green-600',
      lightBg: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      label: 'Total Transactions',
      value: data?.total_transactions || 0,
      icon: 'solar:bill-list-bold-duotone',
      bgGradient: 'from-purple-500 to-purple-600',
      lightBg: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      label: 'Total Revenue',
      value: data?.revenue || 0,
      icon: 'solar:wallet-money-bold-duotone',
      bgGradient: 'from-orange-500 to-orange-600',
      lightBg: 'bg-orange-50',
      textColor: 'text-orange-600',
      isCurrency: true,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500 mt-1">Welcome back, Super Admin</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-6 animate-pulse h-40"></div>
          ))
        ) : (
          stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions - Takes up 2 columns */}
        <div className="lg:col-span-2 h-[500px]">
          <RecentTransactions data={data?.recent_transactions || []} />
        </div>

        {/* Top Apps - Takes up 1 column */}
        <div className="lg:col-span-1 h-[500px]">
          <TopApps data={data?.top_apps || []} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
