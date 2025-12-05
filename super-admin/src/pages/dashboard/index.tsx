import Grid from '@mui/material/Grid';
import Analytics from 'components/sections/dashboard/analytics';
import RecentOrders from 'components/sections/dashboard/recent-orders';
import Reports from 'components/sections/dashboard/reports';
import TopCards from 'components/sections/dashboard/top-cards';
import TopSelling from 'components/sections/dashboard/top-selling';

import { useEffect, useState } from 'react';
import api from 'services/api';
import { TopCard } from 'data/topCardsData';

const Dashboard = () => {
  const [stats, setStats] = useState<TopCard[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [topApps, setTopApps] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dailyStats, setDailyStats] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/super-admin/dashboard');
        const data = response.data.data;

        const mappedStats: TopCard[] = [
          {
            id: 1,
            icon: 'mage:users-fill',
            title: 'Total Users',
            count: data.total_users,
            iconColor: 'primary.main',
            iconBg: 'transparent.primary.main',
          },
          {
            id: 2,
            icon: 'solar:bill-list-bold',
            title: 'Transactions',
            count: data.total_transactions,
            iconColor: 'secondary.main',
            iconBg: 'transparent.secondary.main',
          },
          {
            id: 3,
            icon: 'solar:wallet-money-bold',
            title: 'Revenue',
            count: data.revenue,
            iconColor: 'success.main',
            iconBg: 'transparent.success.main',
          },
          {
            id: 4,
            icon: 'mage:user-check-fill',
            title: 'Active Users',
            count: data.active_users,
            iconColor: 'warning.main',
            iconBg: 'transparent.warning.main',
          },
        ];

        setStats(mappedStats);
        setRecentTransactions(data.recent_transactions || []);
        setTopApps(data.top_apps || []);
        setDailyStats(data.daily_stats || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <Grid container px={3.75} spacing={3.75}>
      <Grid item xs={12}>
        <TopCards data={stats} />
      </Grid>
      <Grid item xs={12} md={7}>
        <Reports data={dailyStats} />
      </Grid>
      <Grid item xs={12} md={5}>
        <Analytics />
      </Grid>
      <Grid item xs={12} md={7}>
        <RecentOrders data={recentTransactions} />
      </Grid>
      <Grid item xs={12} md={5}>
        <TopSelling data={topApps} />
      </Grid>
    </Grid>
  );
};

export default Dashboard;
