import { motion } from 'motion/react';
import {
  ArrowLeft,
  Book,
  Smartphone,
  Settings,
  Zap,
  Shield,
  Download,
  ChevronRight,
  ExternalLink,
  CheckCircle
} from 'lucide-react';

interface DocumentationProps {
  onNavigate: (page: string) => void;
}

export function Documentation({ onNavigate }: DocumentationProps) {
  const sections = [
    {
      icon: Book,
      title: 'Getting Started',
      color: '#16A34A',
      articles: [
        { title: 'Introduction to VTfree', time: '3 min' },
        { title: 'Creating Your First App', time: '5 min' },
        { title: 'Understanding the Dashboard', time: '4 min' },
        { title: 'Best Practices', time: '6 min' }
      ]
    },
    {
      icon: Smartphone,
      title: 'App Branding',
      color: '#22C55E',
      articles: [
        { title: 'Customizing Your App Logo', time: '3 min' },
        { title: 'Choosing Brand Colors', time: '4 min' },
        { title: 'Creating App Name & Tagline', time: '2 min' },
        { title: 'Design Guidelines', time: '8 min' }
      ]
    },
    {
      icon: Settings,
      title: 'API Configuration',
      color: '#16A34A',
      articles: [
        { title: 'SMEplug Integration', time: '7 min' },
        { title: 'Hawk API Setup', time: '6 min' },
        { title: 'ClubKonnect Guide', time: '7 min' },
        { title: 'Testing API Connections', time: '5 min' }
      ]
    },
    {
      icon: Zap,
      title: 'Services Setup',
      color: '#22C55E',
      articles: [
        { title: 'Airtime & Data Configuration', time: '5 min' },
        { title: 'Cable TV Setup', time: '4 min' },
        { title: 'Electricity Bills', time: '4 min' },
        { title: 'Exam Pins & Others', time: '6 min' }
      ]
    },
    {
      icon: Shield,
      title: 'Security & Payments',
      color: '#16A34A',
      articles: [
        { title: 'Payment Gateway Setup', time: '8 min' },
        { title: 'Security Best Practices', time: '6 min' },
        { title: 'User Authentication', time: '5 min' },
        { title: 'Data Protection', time: '7 min' }
      ]
    },
    {
      icon: Download,
      title: 'Publishing Your App',
      color: '#22C55E',
      articles: [
        { title: 'Building for Android', time: '10 min' },
        { title: 'Web App Deployment', time: '8 min' },
        { title: 'Publishing to Play Store', time: '15 min' },
        { title: 'App Updates & Maintenance', time: '9 min' }
      ]
    }
  ];

  const quickLinks = [
    { title: 'API Documentation', icon: ExternalLink },
    { title: 'Video Tutorials', icon: ExternalLink },
    { title: 'Community Forum', icon: ExternalLink },
    { title: 'Changelog', icon: ExternalLink }
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
          <div>
            <h2>Documentation</h2>
            <p className="text-gray-600 text-sm">Learn everything about VTfree</p>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#16A34A] to-[#22C55E] rounded-3xl p-8 md:p-12 mb-8 text-white"
        >
          <div className="max-w-2xl">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6"
            >
              <Book className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="mb-4">Complete Documentation</h1>
            <p className="text-white/90 text-lg mb-6">
              Everything you need to build, deploy, and manage your VTU applications
            </p>
            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-[#16A34A] px-6 py-3 rounded-xl flex items-center gap-2"
              >
                <Book className="w-5 h-5" />
                Quick Start Guide
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('support')}
                className="bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-xl border border-white/30 flex items-center gap-2"
              >
                Need Help?
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {quickLinks.map((link, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-[#16A34A] transition-colors flex items-center gap-3"
            >
              <link.icon className="w-5 h-5 text-[#16A34A]" />
              <span className="text-gray-900 text-sm">{link.title}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Documentation Sections */}
        <div className="space-y-6">
          {sections.map((section, sectionIndex) => (
            <motion.div
              key={sectionIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + sectionIndex * 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Section Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${section.color}20` }}
                  >
                    <section.icon className="w-7 h-7" style={{ color: section.color }} />
                  </div>
                  <div>
                    <h3 className="mb-1">{section.title}</h3>
                    <p className="text-gray-600 text-sm">{section.articles.length} articles</p>
                  </div>
                </div>
              </div>

              {/* Articles List */}
              <div className="divide-y divide-gray-100">
                {section.articles.map((article, articleIndex) => (
                  <motion.button
                    key={articleIndex}
                    whileHover={{ backgroundColor: '#F9FAFB' }}
                    className="w-full p-5 flex items-center justify-between text-left transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <CheckCircle className="w-5 h-5 text-gray-300" />
                      <span className="text-gray-900">{article.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-sm">{article.time}</span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-[#DCFCE7] rounded-2xl p-8 mt-8 text-center"
        >
          <h3 className="mb-2">Can't find what you're looking for?</h3>
          <p className="text-gray-600 mb-6">
            Our support team is here to help you with any questions
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('support')}
              className="bg-[#16A34A] text-white px-6 py-3 rounded-xl"
            >
              Contact Support
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-[#16A34A] px-6 py-3 rounded-xl border border-[#16A34A]"
            >
              Join Community
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
