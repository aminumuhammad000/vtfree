import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

interface App {
  _id: string;
  app_name: string;
  app_id: string;
  owner: {
    name: string;
    email: string;
  };
  status: string;
  api_calls: number;
  revenue: number;
  created_at: string;
  category: string;
}

const Apps = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    // Mock data
    const mockApps: App[] = [
      { _id: '1', app_name: 'DataHub Pro', app_id: 'APP-1001', owner: { name: 'John Doe', email: 'john@example.com' }, status: 'active', api_calls: 15420, revenue: 2500000, created_at: '2024-01-10', category: 'Data Services' },
      { _id: '2', app_name: 'QuickRecharge', app_id: 'APP-1002', owner: { name: 'Jane Smith', email: 'jane@example.com' }, status: 'active', api_calls: 9850, revenue: 1800000, created_at: '2024-02-15', category: 'Airtime' },
      { _id: '3', app_name: 'BillPay Express', app_id: 'APP-1003', owner: { name: 'Bob Johnson', email: 'bob@example.com' }, status: 'suspended', api_calls: 5200, revenue: 1200000, created_at: '2024-03-20', category: 'Bill Payment' },
      { _id: '4', app_name: 'Mobile Topup', app_id: 'APP-1004', owner: { name: 'Alice Williams', email: 'alice@example.com' }, status: 'pending', api_calls: 0, revenue: 0, created_at: '2024-04-25', category: 'Airtime' },
      { _id: '5', app_name: 'Data Bundle Plus', app_id: 'APP-1005', owner: { name: 'Charlie Brown', email: 'charlie@example.com' }, status: 'active', api_calls: 12300, revenue: 980000, created_at: '2024-01-30', category: 'Data Services' },
    ];
    setApps(mockApps);
    setLoading(false);
  }, []);

  const filteredApps = apps.filter(app => {
    const matchesSearch = app.app_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.app_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.owner.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'suspended': return 'bg-red-100 text-red-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const stats = [
    { label: 'Total Apps', value: apps.length, icon: 'solar:smartphone-2-bold-duotone', color: 'blue' },
    { label: 'Active', value: apps.filter(a => a.status === 'active').length, icon: 'solar:check-circle-bold-duotone', color: 'green' },
    { label: 'Pending Approval', value: apps.filter(a => a.status === 'pending').length, icon: 'solar:clock-circle-bold-duotone', color: 'yellow' },
    { label: 'Suspended', value: apps.filter(a => a.status === 'suspended').length, icon: 'solar:close-circle-bold-duotone', color: 'red' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">App Management</h1>
          <p className="text-slate-500 mt-1">Monitor and manage all registered apps</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all">
          <Icon icon="solar:add-circle-bold" width="20" height="20" />
          <span>Register App</span>
        </button>
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
                placeholder="Search apps by name, ID, or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse h-48"></div>
          ))
        ) : filteredApps.length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-white rounded-xl">
            <Icon icon="solar:inbox-line-bold-duotone" width="64" height="64" className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No apps found</p>
          </div>
        ) : (
          filteredApps.map((app) => (
            <div key={app._id} className="group bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {app.app_name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{app.app_name}</h3>
                    <p className="text-sm text-slate-500 font-mono">{app.app_id}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(app.status)}`}>
                  {app.status.toUpperCase()}
                </span>
              </div>

              {/* Owner Info */}
              <div className="flex items-center gap-2 mb-4 p-3 bg-slate-50 rounded-lg">
                <Icon icon="solar:user-circle-bold-duotone" width="20" height="20" className="text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{app.owner.name}</p>
                  <p className="text-xs text-slate-500 truncate">{app.owner.email}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-600 font-semibold mb-1">API Calls</p>
                  <p className="text-lg font-bold text-slate-900">{app.api_calls.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600 font-semibold mb-1">Revenue</p>
                  <p className="text-lg font-bold text-slate-900">₦{(app.revenue / 1000).toFixed(0)}k</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Icon icon="solar:calendar-bold-duotone" width="16" height="16" />
                  <span>Created {new Date(app.created_at).toLocaleDateString()}</span>
                </div>
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <Icon icon="solar:menu-dots-bold" width="20" height="20" className="text-slate-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Apps;
