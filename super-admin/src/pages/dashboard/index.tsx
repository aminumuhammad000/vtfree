import { useEffect, useState } from 'react';
import { getDashboardStats } from 'api/superAdminApi';
import StatsCard from 'components/dashboard/StatsCard';
import RecentTransactions from 'components/dashboard/RecentTransactions';
import TopApps from 'components/dashboard/TopApps';
import AnalyticsChart from 'components/dashboard/AnalyticsChart';

interface DashboardData {
  total_users: number;
  total_end_users: number;
  total_apps: number;
  total_app_admins: number;
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
        const response = await getDashboardStats();
        if (response.data.success) {
          setData(response.data.data);
        }
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
      label: 'Total Apps',
      value: data?.total_apps || 0,
      icon: 'solar:smartphone-2-bold-duotone',
      bgGradient: 'from-blue-500 to-blue-600',
      lightBg: 'bg-blue-50',
      textColor: 'text-blue-600',
      trend: { value: 12.5, isPositive: true }
    },
    {
      label: 'App Admins',
      value: data?.total_app_admins || 0, // App Admins
      icon: 'solar:user-id-bold-duotone',
      bgGradient: 'from-purple-500 to-purple-600',
      lightBg: 'bg-purple-50',
      textColor: 'text-purple-600',
      trend: { value: 8.2, isPositive: true }
    },
    {
      label: 'End Users',
      value: data?.total_end_users || 0,
      icon: 'solar:users-group-rounded-bold-duotone',
      bgGradient: 'from-green-500 to-green-600',
      lightBg: 'bg-green-50',
      textColor: 'text-green-600',
      trend: { value: 5.4, isPositive: true }
    },
    {
      label: 'Total Revenue',
      value: data?.revenue || 0,
      icon: 'solar:wallet-money-bold-duotone',
      bgGradient: 'from-orange-500 to-orange-600',
      lightBg: 'bg-orange-50',
      textColor: 'text-orange-600',
      isCurrency: true,
      trend: { value: 15.7, isPositive: true }
    },
  ];

  // Map real data from API
  const chartData = data?.daily_stats && data.daily_stats.length > 0 ? {
    labels: data.daily_stats.map(s => {
      const date = new Date(s._id);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }),
    revenue: data.daily_stats.map(s => s.total),
    transactions: data.daily_stats.map(s => s.count)
  } : {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    revenue: [0, 0, 0, 0, 0, 0, 0],
    transactions: [0, 0, 0, 0, 0, 0, 0]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Welcome back, Super Admin</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Last updated</p>
          <p className="text-sm font-semibold text-slate-900">{new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts and Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics Chart - spans 2 columns */}
        <div className="lg:col-span-2">
          <AnalyticsChart
            title="Revenue & Transaction Analytics"
            data={chartData}
          />
        </div>

        {/* Top Apps */}
        <div className="lg:col-span-1">
          <TopApps data={data?.top_apps || []} />
        </div>
      </div>

      {/* Recent Transactions - Full Width */}
      <div className="grid grid-cols-1">
        <RecentTransactions data={data?.recent_transactions || []} />
      </div>
    </div>
  );
};

export default Dashboard;
