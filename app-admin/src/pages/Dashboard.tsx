import { useQuery } from '@tanstack/react-query';
import React, { useState, useMemo } from 'react';
import {
  FiRefreshCw, FiAlertCircle, FiArrowRight,
  FiUsers, FiTrendingUp, FiActivity, FiCheckCircle,
  FiClock, FiDatabase, FiPhone
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { getDashboardStats, getTransactions, getAllConfigs, getSupportContent } from '../api/adminApi';
import Layout from '../components/Layout';

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('en-NG', { minimumFractionDigits: 0 });
const fmtCurrency = (n: number) =>
  n >= 1_000_000
    ? `₦${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `₦${(n / 1_000).toFixed(1)}K`
    : `₦${fmt(n)}`;

// ─── Sub-components ──────────────────────────────────────────────────────────
const StatCard = ({
  label, value, sub, icon: Icon, color, currency,
}: {
  label: string;
  value: number;
  sub?: string;
  icon: any;
  color: string; // tailwind color key e.g. 'green'
  currency?: boolean;
}) => {
  const colours: Record<string, { bg: string; icon: string; text: string; light: string }> = {
    green:  { bg: 'bg-green-600',  icon: 'text-green-600',  text: 'text-green-700',  light: 'bg-green-50'  },
    blue:   { bg: 'bg-blue-600',   icon: 'text-blue-600',   text: 'text-blue-700',   light: 'bg-blue-50'   },
    purple: { bg: 'bg-purple-600', icon: 'text-purple-600', text: 'text-purple-700', light: 'bg-purple-50' },
    amber:  { bg: 'bg-amber-500',  icon: 'text-amber-600',  text: 'text-amber-700',  light: 'bg-amber-50'  },
    rose:   { bg: 'bg-rose-500',   icon: 'text-rose-600',   text: 'text-rose-700',   light: 'bg-rose-50'   },
    indigo: { bg: 'bg-indigo-600', icon: 'text-indigo-600', text: 'text-indigo-700', light: 'bg-indigo-50' },
    teal:   { bg: 'bg-teal-600',   icon: 'text-teal-600',   text: 'text-teal-700',   light: 'bg-teal-50'   },
    slate:  { bg: 'bg-slate-600',  icon: 'text-slate-500',  text: 'text-slate-600',  light: 'bg-slate-100' },
  };
  const c = colours[color] || colours.green;

  return (
    <div className="group bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${c.light}`}>
          <Icon className={`w-4 h-4 ${c.icon}`} />
        </div>
        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${c.light} ${c.text}`}>
          Live
        </span>
      </div>
      <p className="text-xl font-extrabold text-slate-900 tracking-tight leading-none mb-1">
        {currency ? fmtCurrency(value) : fmt(value)}
      </p>
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
};

const ProfitCard = ({
  label, value, count, period,
}: {
  label: string;
  value: number;
  count: number;
  period: 'today' | 'month';
}) => (
  <div className={`relative overflow-hidden rounded-xl p-4 ${
    period === 'today'
      ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
      : 'bg-gradient-to-br from-green-600 to-emerald-700'
  }`}>
    {/* Decorative circle */}
    <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
    <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/5 rounded-full" />

    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-white/70">{label}</span>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
          {count} txns
        </span>
      </div>
      <p className="text-2xl font-black text-white tracking-tight">
        {value >= 1_000_000
          ? `₦${(value / 1_000_000).toFixed(2)}M`
          : value >= 1_000
          ? `₦${(value / 1_000).toFixed(1)}K`
          : `₦${value.toLocaleString()}`}
      </p>
      <p className="text-[11px] text-white/70 mt-0.5 font-medium">
        {period === 'today' ? 'Gross profit today' : 'Gross profit this month'}
      </p>
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, isError, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });

  const { data: recentTransactionsData, refetch: refetchTransactions } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: () => getTransactions({ page: 1, limit: 6 }),
  });

  const { data: configs } = useQuery({
    queryKey: ['system-configs'],
    queryFn: async () => {
      const res = await getAllConfigs();
      return res.data?.data || [];
    },
  });

  const { data: supportRes } = useQuery({
    queryKey: ['support-content'],
    queryFn: getSupportContent,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchStats(), refetchTransactions()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const missingConfigs = useMemo(() => {
    const missing: string[] = [];
    if (Array.isArray(configs)) {
      const gateway = configs.find((c: any) => c.key === 'DEFAULT_PAYMENT_GATEWAY')?.value;
      if (!gateway) missing.push('Payment gateway not configured');
      else if (gateway === 'vtstack') {
        if (!configs.find((c: any) => c.key === 'VTSTACK_API_KEY')?.value)
          missing.push('VTStack API key missing');
      }
      const mailUser = configs.find((c: any) => c.key === 'MAIL_USER')?.value;
      const mailPass = configs.find((c: any) => c.key === 'MAIL_PASSWORD')?.value;
      if (!mailUser || !mailPass) missing.push('Email not configured');
    }
    if (supportRes?.data?.success) {
      const s = supportRes.data.data;
      if (!s.email || !s.phoneNumber) missing.push('Support contacts incomplete');
    }
    return missing;
  }, [configs, supportRes]);

  const sd = data?.data?.data;
  const recentTxns = recentTransactionsData?.data?.data || [];
  const successRate = sd?.totalTransactions > 0
    ? Math.round((sd?.successfulTransactions / sd?.totalTransactions) * 100)
    : 0;

  const statCards = [
    { label: 'Total Users',    value: sd?.totalUsers || 0,              icon: FiUsers,      color: 'blue'   },
    { label: 'Active Users',   value: sd?.activeUsers || 0,             icon: FiActivity,   color: 'green'  },
    { label: 'Transactions',   value: sd?.totalTransactions || 0,       icon: FiTrendingUp, color: 'purple' },
    { label: 'Successful',     value: sd?.successfulTransactions || 0,  icon: FiCheckCircle,color: 'teal'   },
    { label: 'Data Sales',     value: sd?.totalDataSales || 0,          icon: FiDatabase,   color: 'indigo', currency: true },
    { label: 'Airtime Sales',  value: sd?.totalAirtimeSales || 0,       icon: FiPhone,      color: 'amber',  currency: true },
    { label: 'Pending',        value: sd?.pendingTransactions || 0,     icon: FiClock,      color: 'rose'   },
  ];

  return (
    <Layout>
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-5">

          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
              <p className="text-xs text-slate-500 mt-0.5">Overview of your platform activity</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 text-green-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* ── Config Alert ── */}
          {missingConfigs.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                  <FiAlertCircle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Setup Required</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {missingConfigs.map((msg, i) => (
                      <span key={i} className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        {msg}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Link
                to="/settings"
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0"
              >
                Configure <FiArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* ── Profit Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ProfitCard
              label="Today's Profit"
              value={sd?.dailyProfit || 0}
              count={sd?.dailyTransactions || 0}
              period="today"
            />
            <ProfitCard
              label="Monthly Profit"
              value={sd?.monthlyProfit || 0}
              count={sd?.monthlyTransactions || 0}
              period="month"
            />
          </div>

          {/* ── Stats Grid ── */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
                  <div className="h-8 w-8 bg-slate-200 rounded-lg mb-3" />
                  <div className="h-7 bg-slate-200 rounded mb-2 w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 font-medium">
              Failed to load statistics. <button onClick={handleRefresh} className="underline font-bold">Retry</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {statCards.map((s, i) => <StatCard key={i} {...s as any} />)}
            </div>
          )}

          {/* ── Bottom Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Recent Transactions — wider */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800">Recent Activity</h2>
                <Link to="/transactions" className="text-[11px] font-bold text-green-600 hover:text-green-700 flex items-center gap-1">
                  View all <FiArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {recentTxns.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">No recent transactions</div>
                ) : (
                  recentTxns.map((txn: any) => {
                    const isSuccess = ['successful', 'success'].includes(txn.status?.toLowerCase());
                    const isPending = txn.status?.toLowerCase() === 'pending';
                    return (
                      <div key={txn._id || txn.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            txn.type?.includes('data') ? 'bg-indigo-100' : txn.type?.includes('airtime') ? 'bg-emerald-100' : 'bg-slate-100'
                          }`}>
                            {txn.type?.includes('data')
                              ? <FiDatabase className="w-3.5 h-3.5 text-indigo-600" />
                              : txn.type?.includes('airtime')
                              ? <FiPhone className="w-3.5 h-3.5 text-emerald-600" />
                              : <FiActivity className="w-3.5 h-3.5 text-slate-500" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {txn.type?.replace('_', ' ').toUpperCase()} · ₦{txn.amount?.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-slate-400">{new Date(txn.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                          isSuccess ? 'bg-green-100 text-green-700'
                          : isPending ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                        }`}>
                          {txn.status}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Stats Panel */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-800">Quick Summary</h2>
              </div>
              <div className="p-4 space-y-4">
                {/* Success Rate */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-600">Success Rate</span>
                    <span className="text-xs font-black text-slate-900">{successRate}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${successRate}%` }}
                    />
                  </div>
                </div>

                {/* Total Revenue */}
                <div className="flex items-center justify-between py-2.5 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-600">Total Revenue</span>
                  <span className="text-sm font-black text-green-600">
                    {fmtCurrency((sd?.totalDataSales || 0) + (sd?.totalAirtimeSales || 0))}
                  </span>
                </div>

                {/* Pending */}
                <div className="flex items-center justify-between py-2.5 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-600">Pending Txns</span>
                  <span className={`text-sm font-black ${(sd?.pendingTransactions || 0) > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                    {sd?.pendingTransactions || 0}
                  </span>
                </div>

                {/* Today txns */}
                <div className="flex items-center justify-between py-2.5 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-600">Today's Txns</span>
                  <span className="text-sm font-black text-slate-900">{fmt(sd?.dailyTransactions || 0)}</span>
                </div>

                {/* Month txns */}
                <div className="flex items-center justify-between py-2.5 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-600">Month's Txns</span>
                  <span className="text-sm font-black text-slate-900">{fmt(sd?.monthlyTransactions || 0)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
