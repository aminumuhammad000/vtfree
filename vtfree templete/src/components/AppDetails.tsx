import { motion } from 'motion/react';
import {
  ArrowLeft,
  Download,
  Globe,
  Monitor,
  Smartphone,
  RefreshCw,
  Trash2,
  Settings,
  BarChart3,
  Users,
  DollarSign,
  Activity
} from 'lucide-react';

interface AppDetailsProps {
  onNavigate: (page: string) => void;
  appId?: string;
}

export function AppDetails({ onNavigate }: AppDetailsProps) {
  const app = {
    id: '1',
    name: 'My VTU App',
    status: 'ready',
    icon: '📱',
    buildProgress: 100,
    createdAt: '2 days ago',
    services: ['Airtime', 'Data', 'Cable TV', 'Electricity'],
    branding: {
      primaryColor: '#16A34A',
      secondaryColor: '#22C55E',
      tagline: 'Recharge made easy'
    },
    business: {
      name: 'ABC Technologies',
      email: 'contact@abc.com',
      phone: '+234 800 000 0000'
    },
    stats: {
      totalUsers: 1250,
      totalTransactions: 5430,
      revenue: '₦2,450,000',
      activeUsers: 890
    }
  };

  const downloads = [
    {
      title: 'Android App',
      icon: Smartphone,
      url: 'app-v1.0.apk',
      size: '15.2 MB',
      color: '#16A34A'
    },
    {
      title: 'Web Application',
      icon: Globe,
      url: 'https://yourapp.vtfree.app',
      type: 'link',
      color: '#22C55E'
    },
    {
      title: 'Admin Panel',
      icon: Monitor,
      url: 'https://admin.yourapp.vtfree.app',
      type: 'link',
      color: '#16A34A'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white shadow-sm p-4 sticky top-0 z-30"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{app.icon}</span>
              <div>
                <h2>{app.name}</h2>
                <p className="text-gray-600 text-sm">Created {app.createdAt}</p>
              </div>
            </div>
          </div>
          <span className="px-4 py-2 bg-[#DCFCE7] text-[#16A34A] rounded-full text-sm">
            Active
          </span>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {[
            { icon: Users, label: 'Total Users', value: app.stats.totalUsers.toLocaleString(), color: '#16A34A' },
            { icon: Activity, label: 'Active Users', value: app.stats.activeUsers.toLocaleString(), color: '#22C55E' },
            { icon: BarChart3, label: 'Transactions', value: app.stats.totalTransactions.toLocaleString(), color: '#16A34A' },
            { icon: DollarSign, label: 'Revenue', value: app.stats.revenue, color: '#22C55E' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"
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
        </motion.div>

        {/* Downloads Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h3 className="mb-4">Downloads & Links</h3>
          <div className="space-y-3">
            {downloads.map((download, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full bg-white p-5 rounded-2xl border border-gray-200 hover:border-[#16A34A] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${download.color}20` }}
                  >
                    <download.icon className="w-6 h-6" style={{ color: download.color }} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="mb-1">{download.title}</h3>
                    <p className="text-gray-600 text-sm">
                      {download.type === 'link' ? download.url : `${download.url} • ${download.size}`}
                    </p>
                  </div>
                  <Download className="w-6 h-6" style={{ color: download.color }} />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* App Details */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Branding */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h3>Branding</h3>
              <button className="text-[#16A34A] text-sm">Edit</button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-gray-600 text-sm mb-1">App Name</p>
                <p className="text-gray-900">{app.name}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Tagline</p>
                <p className="text-gray-900">{app.branding.tagline}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Brand Colors</p>
                <div className="flex gap-2">
                  <div
                    className="w-12 h-12 rounded-lg border border-gray-200"
                    style={{ backgroundColor: app.branding.primaryColor }}
                  />
                  <div
                    className="w-12 h-12 rounded-lg border border-gray-200"
                    style={{ backgroundColor: app.branding.secondaryColor }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Business Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h3>Business Information</h3>
              <button className="text-[#16A34A] text-sm">Edit</button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-gray-600 text-sm mb-1">Business Name</p>
                <p className="text-gray-900">{app.business.name}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Email</p>
                <p className="text-gray-900">{app.business.email}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Phone</p>
                <p className="text-gray-900">{app.business.phone}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Services */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h3>Enabled Services</h3>
            <button className="text-[#16A34A] text-sm">Manage</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {app.services.map((service, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-[#DCFCE7] text-[#16A34A] rounded-xl"
              >
                {service}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white p-4 rounded-2xl border border-gray-200 hover:border-[#16A34A] transition-colors flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-[#DCFCE7] rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-[#16A34A]" />
            </div>
            <span className="text-gray-900">Settings</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white p-4 rounded-2xl border border-gray-200 hover:border-[#22C55E] transition-colors flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-[#22C55E]" />
            </div>
            <span className="text-gray-900">Rebuild</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white p-4 rounded-2xl border border-gray-200 hover:border-red-500 transition-colors flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <span className="text-gray-900">Delete</span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
