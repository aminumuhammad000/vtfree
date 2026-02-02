import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getApps } from 'api/superAdminApi';

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
    switch (status) {
      case 'live':
      case 'active': return 'bg-green-100 text-green-700';
      case 'suspended': return 'bg-red-100 text-red-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const stats = [
    { label: 'Total Apps', value: apps.length, icon: 'solar:smartphone-2-bold-duotone', color: 'blue' },
    { label: 'Live', value: apps.filter(a => a.status === 'live' || a.status === 'active').length, icon: 'solar:check-circle-bold-duotone', color: 'green' },
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
          <div key={index} className="bg-white rounded-xl p-5 border border-slate-100 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl bg-slate-50`}>
                <Icon icon={stat.icon} width="24" height="24" className="text-slate-600" />
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
                placeholder="Search apps by name or ID..."
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
              <option value="live">Live</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Apps Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">App Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Owner</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Package Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Revenue</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Created</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex justify-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
                </td></tr>
              ) : filteredApps.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">No apps found</td></tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                          {app.app_name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{app.app_name}</p>
                          <p className="text-xs text-slate-500 font-mono truncate">{app.app_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">{app.owner_id?.first_name} {app.owner_id?.last_name}</p>
                        <p className="text-xs text-slate-500 truncate">{app.owner_id?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">{app.package_name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                        {app.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                      ₦{(app.total_revenue || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Icon icon="solar:eye-bold" width="20" height="20" className="text-slate-400 hover:text-blue-600" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* App Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
              <h3 className="text-lg font-bold text-slate-900">App Details</h3>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <Icon icon="solar:close-circle-bold" width="24" height="24" className="text-slate-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* App Info Section */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {selectedApp.app_name[0]}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900">{selectedApp.app_name}</h2>
                  <p className="text-slate-500 font-mono text-sm">{selectedApp.package_name}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedApp.status)}`}>
                      {selectedApp.status.toUpperCase()}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-sm text-slate-500">ID: {selectedApp.app_id}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-sm text-slate-500">v{selectedApp.version || '1.0.0'}</span>
                  </div>
                </div>
                {selectedApp.download_url && (
                  <a
                    href={selectedApp.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <Icon icon="solar:download-bold" width="20" height="20" />
                    Download App
                  </a>
                )}
              </div>

              {/* Platforms & Services */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Icon icon="solar:devices-bold" className="text-indigo-500" />
                    Platforms
                  </h4>
                  <div className="flex gap-3">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${selectedApp.platforms?.android ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                      <Icon icon="logos:android-icon" width="20" />
                      <span className="text-sm font-medium">Android</span>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${selectedApp.platforms?.ios ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                      <Icon icon="logos:apple" width="20" />
                      <span className="text-sm font-medium">iOS</span>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${selectedApp.platforms?.web ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                      <Icon icon="logos:chrome" width="20" />
                      <span className="text-sm font-medium">Web</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Icon icon="solar:layers-bold" className="text-orange-500" />
                    Active Features
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedApp.services && selectedApp.services.length > 0 ? (
                      selectedApp.services.map((service, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-600 shadow-sm">
                          {service.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400 italic">No specific features listed</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Owner Details */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Icon icon="solar:user-circle-bold" className="text-blue-500" />
                    Owner Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Name:</span>
                      <span className="font-medium text-slate-900">{selectedApp.owner_id?.first_name} {selectedApp.owner_id?.last_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="font-medium text-slate-900">{selectedApp.owner_id?.email}</span>
                    </div>
                    {selectedApp.owner_id?.phone && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Phone:</span>
                        <span className="font-medium text-slate-900">{selectedApp.owner_id.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* App Stats */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Icon icon="solar:chart-bold" className="text-emerald-500" />
                    Performance Stats
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total End Users:</span>
                      <span className="font-bold text-blue-600">{(selectedApp.total_end_users || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Revenue:</span>
                      <span className="font-bold text-emerald-600">₦{(selectedApp.total_revenue || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Transactions:</span>
                      <span className="font-medium text-slate-900">{(selectedApp.total_transactions || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Created At:</span>
                      <span className="font-medium text-slate-900">{new Date(selectedApp.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Apps;

