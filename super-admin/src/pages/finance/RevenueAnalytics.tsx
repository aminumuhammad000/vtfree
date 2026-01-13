import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getDashboardStats } from 'api/superAdminApi';
import AnalyticsChart from '../../components/dashboard/AnalyticsChart';

const RevenueAnalytics = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await getDashboardStats();
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch revenue analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const chartData = stats?.daily_stats ? {
        labels: stats.daily_stats.map((s: any) => {
            const date = new Date(s._id);
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        }),
        revenue: stats.daily_stats.map((s: any) => s.total),
        transactions: stats.daily_stats.map((s: any) => s.count)
    } : {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        revenue: [0, 0, 0, 0, 0, 0, 0],
        transactions: [0, 0, 0, 0, 0, 0, 0]
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Revenue Analytics</h1>
                <p className="text-slate-500 mt-1">Detailed insights into platform revenue and growth</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <AnalyticsChart
                            title="Revenue Trends"
                            data={chartData}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">₦{stats?.revenue?.toLocaleString() || 0}</p>
                            <div className="flex items-center gap-1 mt-2 text-emerald-600">
                                <Icon icon="solar:trend-up-bold" />
                                <span className="text-xs font-bold">+12.5% vs last month</span>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <p className="text-sm font-medium text-slate-500">Avg. Transaction Value</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">
                                ₦{stats?.total_transactions ? (stats.revenue / stats.total_transactions).toLocaleString(undefined, { maximumFractionDigits: 2 }) : 0}
                            </p>
                            <div className="flex items-center gap-1 mt-2 text-emerald-600">
                                <Icon icon="solar:trend-up-bold" />
                                <span className="text-xs font-bold">+5.2% vs last month</span>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <p className="text-sm font-medium text-slate-500">Total Transactions</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.total_transactions?.toLocaleString() || 0}</p>
                            <div className="flex items-center gap-1 mt-2 text-emerald-600">
                                <Icon icon="solar:trend-up-bold" />
                                <span className="text-xs font-bold">+8.1% vs last month</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RevenueAnalytics;
