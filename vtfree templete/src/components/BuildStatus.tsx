import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, Download, Globe, Monitor, Rocket, Smartphone } from 'lucide-react';

interface BuildStatusProps {
  onNavigate: (page: string) => void;
}

export function BuildStatus({ onNavigate }: BuildStatusProps) {
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);

  const phases = [
    { label: 'Initializing build environment', duration: 15 },
    { label: 'Setting up branding and assets', duration: 20 },
    { label: 'Configuring VTU services', duration: 25 },
    { label: 'Building Android app', duration: 30 },
    { label: 'Building web application', duration: 35 },
    { label: 'Setting up admin panel', duration: 40 },
    { label: 'Running tests', duration: 50 },
    { label: 'Finalizing build', duration: 60 },
    { label: 'Packaging files', duration: 80 },
    { label: 'Build complete!', duration: 100 }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const phase = phases.findIndex(p => progress < p.duration);
    setCurrentPhase(phase === -1 ? phases.length - 1 : Math.max(0, phase - 1));
  }, [progress]);

  const isComplete = progress === 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9FAFB] to-[#DCFCE7]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Build Status Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="text-center mb-8"
        >
          {isComplete ? (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 0.8 }}
              className="w-32 h-32 bg-gradient-to-br from-[#16A34A] to-[#22C55E] rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
            >
              <CheckCircle className="w-16 h-16 text-white" />
            </motion.div>
          ) : (
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0"
              >
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#DCFCE7"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: '0 283' }}
                    animate={{ strokeDasharray: `${progress * 2.83} 283` }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#16A34A" />
                      <stop offset="100%" stopColor="#22C55E" />
                    </linearGradient>
                  </defs>
                </svg>
              </motion.div>
              <Rocket className="w-12 h-12 text-[#16A34A]" />
            </div>
          )}

          <h2 className="mb-2">
            {isComplete ? 'Build Complete!' : 'Building Your App'}
          </h2>
          <p className="text-gray-600">
            {isComplete
              ? 'Your app is ready to download and deploy'
              : phases[currentPhase]?.label || 'Processing...'}
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-700">Progress</span>
            <motion.span
              key={progress}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-[#16A34A]"
            >
              {progress}%
            </motion.span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#16A34A] to-[#22C55E]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* ETA */}
          {!isComplete && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-500 text-sm mt-4"
            >
              Estimated time remaining: {Math.max(1, Math.ceil((100 - progress) / 20))} minutes
            </motion.p>
          )}
        </motion.div>

        {/* Build Phases */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <h3 className="mb-4">Build Phases</h3>
          <div className="space-y-3">
            {phases.slice(0, -1).map((phase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  index < currentPhase
                    ? 'bg-[#DCFCE7]'
                    : index === currentPhase
                    ? 'bg-yellow-50'
                    : 'bg-gray-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index < currentPhase
                      ? 'bg-[#16A34A]'
                      : index === currentPhase
                      ? 'bg-yellow-500'
                      : 'bg-gray-300'
                  }`}
                >
                  {index < currentPhase ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : index === currentPhase ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <span className="text-white text-sm">{index + 1}</span>
                  )}
                </div>
                <span
                  className={`text-sm ${
                    index <= currentPhase ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {phase.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Download Links (shown when complete) */}
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h3 className="text-center mb-4">Download Your App</h3>

            {/* Android APK */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white p-5 rounded-2xl border-2 border-[#16A34A] hover:bg-[#DCFCE7] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#16A34A] rounded-xl flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="mb-1">Android App (APK)</h3>
                  <p className="text-gray-600 text-sm">Download for Android devices</p>
                </div>
                <Download className="w-6 h-6 text-[#16A34A]" />
              </div>
            </motion.button>

            {/* Web App */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white p-5 rounded-2xl border-2 border-[#22C55E] hover:bg-[#DCFCE7] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#22C55E] rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="mb-1">Web Application</h3>
                  <p className="text-gray-600 text-sm">https://yourapp.vtfree.app</p>
                </div>
                <Download className="w-6 h-6 text-[#22C55E]" />
              </div>
            </motion.button>

            {/* Admin Panel */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white p-5 rounded-2xl border-2 border-[#16A34A] hover:bg-[#DCFCE7] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#16A34A] rounded-xl flex items-center justify-center">
                  <Monitor className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="mb-1">Admin Panel</h3>
                  <p className="text-gray-600 text-sm">https://admin.yourapp.vtfree.app</p>
                </div>
                <Download className="w-6 h-6 text-[#16A34A]" />
              </div>
            </motion.button>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('dashboard')}
                className="flex-1 bg-gradient-to-r from-[#16A34A] to-[#22C55E] text-white py-4 rounded-xl shadow-lg"
              >
                Go to Dashboard
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('create-app')}
                className="px-6 py-4 bg-white text-[#16A34A] border border-[#16A34A] rounded-xl"
              >
                Build Another
              </motion.button>
            </div>

            {/* Next Steps */}
            <div className="bg-[#DCFCE7] p-5 rounded-2xl mt-6">
              <h3 className="mb-3">Next Steps</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-[#16A34A] flex-shrink-0 mt-0.5" />
                  <span>Test your app thoroughly before distributing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-[#16A34A] flex-shrink-0 mt-0.5" />
                  <span>Set up your payment gateway credentials</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-[#16A34A] flex-shrink-0 mt-0.5" />
                  <span>Configure your VTU API keys in the admin panel</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-[#16A34A] flex-shrink-0 mt-0.5" />
                  <span>Share your app with customers</span>
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
