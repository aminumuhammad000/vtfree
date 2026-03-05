import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getApps } from 'api/superAdminApi';
import AppDetailsModal from 'components/apps/AppDetailsModal';
import RegisterAppModal from 'components/apps/RegisterAppModal';

interface App {
  _id: string;
  app_name: string;
  app_id: string;
  owner_id: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  status: string;
  created_at: string;
  package_name: string;
  total_revenue?: number;
  total_transactions?: number;
  total_end_users?: number;
  download_url?: string;
  version?: string;
  platforms?: {
    android: boolean;
    ios: boolean;
    web: boolean;
  };
  services?: string[];
}

const Apps = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const fetchApps = async () => {
    try {
      setLoading(true);
      const response = await getApps();
      if (response.data.success) {
        setApps(response.data.data.apps);
      }
    } catch (error) {
      console.error('Failed to fetch apps', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const filteredApps = apps.filter(app => {
    const matchesSearch = app.app_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.app_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'live':
      case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'suspended': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (status: string) => {
    const colorClass = getStatusColor(status);
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${colorClass}`}>
        {status}
      </span>
    )
  }

  const stats = [
    { label: 'Total Apps', value: apps.length, icon: 'solar:smartphone-2-bold-duotone', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Live Apps', value: apps.filter(a => a.status === 'live' || a.status === 'active').length, icon: 'solar:check-circle-bold-duotone', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending Approval', value: apps.filter(a => a.status === 'pending').length, icon: 'solar:clock-circle-bold-duotone', color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Suspended Apps', value: apps.filter(a => a.status === 'suspended').length, icon: 'solar:close-circle-bold-duotone', color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-8 p-2">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">App Management</h1>
          <p className="text-slate-500 mt-2 text-base">Overview and management of all registered applications</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchApps}
            className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
            title="Refresh List"
          >
            <Icon icon="solar:refresh-bold" width="24" />
          </button>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all active:scale-95"
          >
            <Icon icon="solar:add-circle-bold" width="20" height="20" />
            <span>Register New App</span>
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <Icon icon={stat.icon} width="24" height="24" className={stat.color} />
              </div>
              {/* Trend placeholder - could be real later */}
              {/* <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+2.5%</span> */}
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</p>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls & Filters */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-1 w-full lg:w-auto gap-4">
          <div className="relative flex-1 max-w-md group">
            <Icon icon="solar:magnifer-linear" width="20" height="20" className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search apps..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-transparent border focus:bg-white focus:border-blue-500 rounded-xl outline-none transition-all placeholder:text-slate-400 font-medium"
            />
          </div>
          <div className="w-48">
            <div className="relative">
              <Icon icon="solar:filter-linear" className="absolute left-3 top-3.5 text-slate-400 z-10 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-transparent border focus:bg-white focus:border-blue-500 rounded-xl outline-none transition-all appearance-none font-medium cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="live">Live</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
              <Icon icon="solar:alt-arrow-down-linear" className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Icon icon="solar:list-bold" width="24" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Icon icon="solar:widget-bold" width="24" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="font-medium">Loading applications...</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="p-4 bg-slate-50 rounded-full mb-4">
            <Icon icon="solar:sad-circle-bold" width="48" className="text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Application Found</h3>
          <p className="text-slate-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          {viewMode === 'list' ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/80 border-b border-slate-100 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Application</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Owner Detail</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Metrics</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApps.map((app) => (
                      <tr key={app._id} className="group hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                              {app.app_name[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">{app.app_name}</p>
                              <p className="text-xs text-slate-500 font-mono truncate bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">{app.package_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200">
                              {app.owner_id?.first_name[0]}{app.owner_id?.last_name[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900">{app.owner_id?.first_name} {app.owner_id?.last_name}</p>
                              <p className="text-xs text-slate-500 truncate">{app.owner_id?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(app.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <Icon icon="solar:wallet-money-bold" className="text-emerald-500 text-xs" />
                              <span className="text-sm font-bold text-slate-900">₦{(app.total_revenue || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Icon icon="solar:users-group-bold" className="text-blue-500 text-xs" />
                              <span className="text-xs font-medium text-slate-500">{(app.total_end_users || 0).toLocaleString()} Users</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                          {new Date(app.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="p-2.5 bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm"
                            title="View Details"
                          >
                            <Icon icon="solar:eye-bold" width="20" height="20" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredApps.map((app) => (
                <div key={app._id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl transition-all group flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                      {app.app_name[0]}
                    </div>
                    {getStatusBadge(app.status)}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-1">{app.app_name}</h3>
                  <p className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded w-fit mb-4">{app.package_name}</p>

                  <div className="space-y-3 mb-6 flex-1">
                    <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                      <span className="text-slate-500">Revenue</span>
                      <span className="font-bold text-emerald-600">₦{(app.total_revenue || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                      <span className="text-slate-500">Users</span>
                      <span className="font-semibold text-slate-700">{(app.total_end_users || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200">
                        {app.owner_id?.first_name[0]}{app.owner_id?.last_name[0]}
                      </div>
                      <span className="text-sm text-slate-600 truncate">{app.owner_id?.first_name} {app.owner_id?.last_name}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedApp(app)}
                    className="w-full py-2.5 mt-auto bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Icon icon="solar:eye-bold" />
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* App Details Modal */}
      {selectedApp && (
        <AppDetailsModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onStatusChange={() => {
            fetchApps();
            setSelectedApp(null);
          }}
          onDelete={() => {
            fetchApps();
            setSelectedApp(null);
          }}
        />
      )}

      {showRegisterModal && (
        <RegisterAppModal
          onClose={() => setShowRegisterModal(false)}
          onSuccess={fetchApps}
        />
      )}
    </div>
  );
};

export default Apps;
