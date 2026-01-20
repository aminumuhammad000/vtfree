import { useQuery } from '@tanstack/react-query';
import React, { useState, useMemo } from 'react';
import { FiRefreshCw, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { getDashboardStats, getTransactions, getAllConfigs, getSupportContent } from '../api/adminApi';
import Layout from '../components/Layout';

const Dashboard: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, isError, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });

  // Fetch recent transactions for activity feed
  const { data: recentTransactionsData, refetch: refetchTransactions } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: () => getTransactions({ page: 1, limit: 5 }),
  });

  // Fetch system configs to check for missing setup
  const { data: configs } = useQuery({
    queryKey: ['system-configs'],
    queryFn: async () => {
      const res = await getAllConfigs();
      return res.data?.data || [];
    },
  });

  // Fetch support content to check for missing contact info
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

  // Check for missing critical configurations
  const missingConfigs = useMemo(() => {
    const missing = [];

    // Check System Configs
    if (Array.isArray(configs)) {
      const gateway = configs.find((c: any) => c.key === 'DEFAULT_PAYMENT_GATEWAY')?.value;
      if (!gateway) {
        missing.push('Payment Gateway not selected');
      } else if (gateway === 'vtpay') {
        const apiKey = configs.find((c: any) => c.key === 'VTPAY_API_KEY')?.value;
        if (!apiKey) missing.push('VTPay API Key is missing');
      } else if (gateway === 'payrant') {
        const apiKey = configs.find((c: any) => c.key === 'PAYRANT_API_KEY')?.value;
        if (!apiKey) missing.push('Payrant API Key is missing');
      }

      const mailUser = configs.find((c: any) => c.key === 'MAIL_USER')?.value;
      const mailPass = configs.find((c: any) => c.key === 'MAIL_PASSWORD')?.value;
      const mailFrom = configs.find((c: any) => c.key === 'MAIL_FROM_ADDRESS')?.value;
      if (!mailUser || !mailPass || !mailFrom) {
        missing.push('Email Gateway is not configured');
      }
    }

    // Check Support Content
    if (supportRes?.data?.success) {
      const support = supportRes.data.data;
      if (!support.email || !support.phoneNumber || !support.whatsappNumber) {
        missing.push('Support contact information is incomplete');
      }
    }

    return missing;
  }, [configs, supportRes]);

  // Get stats data from API response
  const statsData = data?.data?.data;
  const recentTransactions = recentTransactionsData?.data?.data || [];

  const stats = [
    {
      label: 'Total Users',
      value: statsData?.totalUsers || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20a9 9 0 0118 0v-2a9 9 0 00-18 0v2z" />
        </svg>
      ),
      bgGradient: 'from-green-500 to-green-600',
      lightBg: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      label: 'Active Users',
      value: statsData?.activeUsers || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgGradient: 'from-green-500 to-green-600',
      lightBg: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      label: 'Total Transactions',
      value: statsData?.totalTransactions || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgGradient: 'from-purple-500 to-purple-600',
      lightBg: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      label: 'Successful Transactions',
      value: statsData?.successfulTransactions || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgGradient: 'from-emerald-500 to-emerald-600',
      lightBg: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      label: 'Total Data Sales',
      value: statsData?.totalDataSales || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      bgGradient: 'from-orange-500 to-orange-600',
      lightBg: 'bg-orange-50',
      textColor: 'text-orange-600',
      isCurrency: true,
    },
    {
      label: 'Total Airtime Sales',
      value: statsData?.totalAirtimeSales || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      bgGradient: 'from-pink-500 to-pink-600',
      lightBg: 'bg-pink-50',
      textColor: 'text-pink-600',
      isCurrency: true,
    },
  ];

  return (
    <Layout>
      <div className="p-3 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-2 sm:mb-3 tracking-tight">Dashboard</h1>
              <p className="text-sm sm:text-lg text-slate-600">Monitor your VTU application metrics and activity</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <FiRefreshCw className={`w-4 h-4 text-green-600 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          </div>

          {/* Configuration Alert Card */}
          {missingConfigs.length > 0 && (
            <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="relative bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-[2rem] p-6 sm:p-8 shadow-xl shadow-amber-100/50 overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-amber-200/30 transition-colors duration-700"></div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-4 sm:gap-6">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0 shadow-inner">
                      <FiAlertCircle className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 mb-1 tracking-tight">Action Required: System Configuration Incomplete</h2>
                      <p className="text-sm text-slate-600 font-medium mb-4">Your platform is currently in a restricted state. Please complete the following setup to enable all features:</p>

                      <div className="flex flex-wrap gap-2">
                        {missingConfigs.map((msg, i) => (
                          <span key={i} className="px-3 py-1 bg-amber-100/50 border border-amber-200 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                            {msg}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/settings"
                    className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-slate-200 active:scale-[0.98] group/btn"
                  >
                    <span>Configure Now</span>
                    <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-md p-4 sm:p-6 animate-pulse border border-slate-100">
                  <div className="h-10 sm:h-12 bg-slate-200 rounded mb-4 w-10 sm:w-12"></div>
                  <div className="h-6 sm:h-8 bg-slate-200 rounded mb-2"></div>
                  <div className="h-3 sm:h-4 bg-slate-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6 text-red-700 shadow-sm">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm sm:text-base">Failed to load dashboard statistics</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {stats.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </div>
          )}

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
            {/* Recent Activity */}
            <div className="relative bg-gradient-to-br from-white to-slate-50/50 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-4 sm:p-6 border border-slate-100 overflow-hidden group">
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-400/10 to-green-600/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 sm:mb-6 flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  Recent Activity
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  {recentTransactions.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No recent activity</p>
                  ) : (
                    recentTransactions.map((txn: any) => {
                      const getTypeIcon = (type: string) => {
                        switch (type?.toLowerCase()) {
                          case 'data':
                          case 'data_purchase':
                            return (
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            );
                          case 'airtime':
                          case 'airtime_topup':
                            return (
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                            );
                          default:
                            return (
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            );
                        }
                      };

                      const getStatusBadge = (status: string) => {
                        switch (status?.toLowerCase()) {
                          case 'successful':
                          case 'success':
                            return <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-green-100 text-green-700 text-[10px] sm:text-xs font-bold rounded-full">Success</span>;
                          case 'pending':
                            return <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-yellow-100 text-yellow-700 text-[10px] sm:text-xs font-bold rounded-full">Pending</span>;
                          case 'failed':
                            return <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-100 text-red-700 text-[10px] sm:text-xs font-bold rounded-full">Failed</span>;
                          default:
                            return <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-100 text-slate-700 text-[10px] sm:text-xs font-bold rounded-full">{status}</span>;
                        }
                      };

                      return (
                        <div key={txn._id || txn.id} className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 -mx-2 px-2 py-1 rounded-lg transition-colors">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md shrink-0">
                              {getTypeIcon(txn.type)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 text-sm sm:text-base truncate">{txn.type?.toUpperCase()} - ₦{txn.amount?.toLocaleString()}</p>
                              <p className="text-[10px] sm:text-xs text-slate-500 truncate">{new Date(txn.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="shrink-0">
                            {getStatusBadge(txn.status)}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="relative bg-gradient-to-br from-white to-slate-50/50 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-4 sm:p-6 border border-slate-100 overflow-hidden group">
              {/* Decorative gradient */}
              <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-purple-400/10 to-purple-600/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 sm:mb-6 flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  Quick Stats
                </h2>
                <div className="space-y-4 sm:space-y-5">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center group/item hover:bg-slate-50/50 -mx-2 px-2 py-2 rounded-lg transition-colors gap-2">
                    <span className="text-slate-700 font-medium text-sm sm:text-base">Success Rate</span>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 sm:w-32 h-2 sm:h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-sm"
                          style={{
                            width: `${statsData?.totalTransactions > 0
                              ? Math.round((statsData?.successfulTransactions / statsData?.totalTransactions) * 100)
                              : 0}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-slate-900 min-w-[2.5rem] sm:min-w-[3rem] text-right">
                        {statsData?.totalTransactions > 0
                          ? Math.round((statsData?.successfulTransactions / statsData?.totalTransactions) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center group/item hover:bg-slate-50/50 -mx-2 px-2 py-2 rounded-lg transition-colors">
                    <span className="text-slate-700 font-medium text-sm sm:text-base">Total Revenue</span>
                    <span className="text-base sm:text-lg font-bold text-green-600 bg-green-50 px-2 sm:px-3 py-1 rounded-lg">
                      ₦{((statsData?.totalDataSales || 0) + (statsData?.totalAirtimeSales || 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center group/item hover:bg-slate-50/50 -mx-2 px-2 py-2 rounded-lg transition-colors">
                    <span className="text-slate-700 font-medium text-sm sm:text-base">Pending Transactions</span>
                    <span className="text-base sm:text-lg font-bold text-slate-900 bg-slate-100 px-2 sm:px-3 py-1 rounded-lg">
                      {statsData?.pendingTransactions || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const StatCard = ({
  label,
  value,
  icon,
  bgGradient,
  lightBg,
  textColor,
  isCurrency,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  bgGradient: string;
  lightBg: string;
  textColor: string;
  isCurrency?: boolean;
}) => (
  <div className="group relative bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden hover-lift">
    {/* Gradient accent bar at top */}
    <div className={`h-1 sm:h-1.5 bg-gradient-to-r ${bgGradient}`}></div>

    <div className="p-4 sm:p-6">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        {/* Icon with gradient background and glow */}
        <div className={`relative ${lightBg} p-3 sm:p-4 rounded-lg sm:rounded-xl ${textColor} group-hover:scale-110 transition-transform duration-300`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-0 group-hover:opacity-20 rounded-lg sm:rounded-xl transition-opacity duration-300`}></div>
          <div className="relative scale-75 sm:scale-100">{icon}</div>
        </div>

        {/* Badge */}
        <span className={`text-[10px] sm:text-xs font-bold ${textColor} ${lightBg} px-2 sm:px-3 py-1 sm:py-1.5 rounded-full opacity-80`}>
          Live
        </span>
      </div>

      {/* Value and Label */}
      <div className="space-y-1 sm:space-y-2">
        <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight truncate">
          {isCurrency ? `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value.toLocaleString()}
        </p>
        <p className={`text-[10px] sm:text-sm font-semibold ${textColor} uppercase tracking-wide truncate`}>{label}</p>
      </div>

      {/* Decorative gradient orb */}
      <div className={`absolute -bottom-8 -right-8 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br ${bgGradient} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity duration-500`}></div>
    </div>
  </div>
);

export default Dashboard;
