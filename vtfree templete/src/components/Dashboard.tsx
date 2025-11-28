import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  Plus,
  Settings,
  FileText,
  Headphones,
  Menu,
  X,
  Smartphone,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  TrendingUp,
  Zap,
  Users
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: string, appId?: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const stats = [
    { icon: Smartphone, label: 'Total Apps', value: '3', color: '#16A34A' },
    { icon: CheckCircle, label: 'Active', value: '2', color: '#22C55E' },
    { icon: Clock, label: 'Building', value: '1', color: '#F59E0B' },
    { icon: TrendingUp, label: 'This Month', value: '+2', color: '#16A34A' }
  ];

  const apps = [
    {
      id: '1',
      name: 'My VTU App',
      status: 'ready',
      icon: '📱',
      buildProgress: 100,
      createdAt: '2 days ago',
      services: ['Airtime', 'Data', 'Cable TV']
    },
    {
      id: '2',
      name: 'QuickRecharge',
      status: 'building',
      icon: '⚡',
      buildProgress: 67,
      createdAt: '5 hours ago',
      services: ['Airtime', 'Data', 'Electricity']
    },
    {
      id: '3',
      name: 'VTU Pro',
      status: 'ready',
      icon: '🚀',
      buildProgress: 100,
      createdAt: '1 week ago',
      services: ['All Services']
    }
  ];

  const menuItems = [
    { icon: Home, label: 'Dashboard', page: 'dashboard' },
    { icon: FileText, label: 'Documentation', page: 'documentation' },
    { icon: Settings, label: 'Settings', page: 'settings' },
    { icon: Headphones, label: 'Support', page: 'support' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-700';
      case 'building':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return CheckCircle;
      case 'building':
        return Clock;
      default:
        return AlertCircle;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />

            {/* Sidebar Content */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl z-50 lg:relative lg:translate-x-0"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#16A34A] to-[#22C55E] rounded-xl flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-white" />
                    </div>
                    <h3>VTfree</h3>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-2">
                  {menuItems.map((item, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ x: 4 }}
                      onClick={() => {
                        onNavigate(item.page);
                        setSidebarOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#DCFCE7] transition-colors text-left"
                    >
                      <item.icon className="w-5 h-5 text-[#16A34A]" />
                      <span className="text-gray-700">{item.label}</span>
                    </motion.button>
                  ))}
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-30"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h2>Dashboard</h2>
              <p className="text-gray-600 text-sm">Manage your VTU apps</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('create-app')}
            className="bg-gradient-to-r from-[#16A34A] to-[#22C55E] text-white px-6 py-2 rounded-xl flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New App</span>
          </motion.button>
        </motion.div>

        <div className="flex-1 p-6 overflow-y-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                <h3>{stat.value}</h3>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-[#16A34A] to-[#22C55E] rounded-2xl p-6 mb-8 text-white"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="mb-2">Ready to build your app?</h3>
                <p className="text-white/90 mb-4">Create a custom VTU app in just a few minutes</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onNavigate('create-app')}
                  className="bg-white text-[#16A34A] px-6 py-3 rounded-xl flex items-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  Start Building
                </motion.button>
              </div>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Smartphone className="w-16 h-16 text-white/30" />
              </motion.div>
            </div>
          </motion.div>

          {/* Apps List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3>Your Apps</h3>
              <button className="text-[#16A34A] text-sm">View All</button>
            </div>

            <div className="space-y-4">
              {apps.map((app, index) => {
                const StatusIcon = getStatusIcon(app.status);
                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{app.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="mb-1">{app.name}</h3>
                            <p className="text-gray-600 text-sm">{app.createdAt}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${getStatusColor(app.status)}`}>
                            <StatusIcon className="w-4 h-4" />
                            {app.status}
                          </span>
                        </div>

                        {/* Build Progress */}
                        {app.status === 'building' && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">Build Progress</span>
                              <span className="text-[#16A34A]">{app.buildProgress}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${app.buildProgress}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="h-full bg-gradient-to-r from-[#16A34A] to-[#22C55E]"
                              />
                            </div>
                          </div>
                        )}

                        {/* Services */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {app.services.map((service, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-[#DCFCE7] text-[#16A34A] rounded-lg text-sm"
                            >
                              {service}
                            </span>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onNavigate('app-details', app.id)}
                            className="flex-1 bg-[#16A34A] text-white py-2 rounded-xl flex items-center justify-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </motion.button>
                          {app.status === 'ready' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl"
                            >
                              Download
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Help Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onNavigate('support')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-[#16A34A] to-[#22C55E] text-white rounded-full shadow-lg flex items-center justify-center z-30"
      >
        <Headphones className="w-6 h-6" />
      </motion.button>
    </div>
  );
}
