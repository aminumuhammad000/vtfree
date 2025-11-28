import { motion } from 'motion/react';
import { Smartphone, Zap, Shield, TrendingUp, ArrowRight, Book, Headphones } from 'lucide-react';

interface OnboardingProps {
  onNavigate: (page: string) => void;
}

export function Onboarding({ onNavigate }: OnboardingProps) {
  const features = [
    {
      icon: Smartphone,
      title: 'Custom Mobile Apps',
      description: 'Build your own VTU app in minutes',
      color: '#16A34A'
    },
    {
      icon: Zap,
      title: 'Fast & Reliable',
      description: 'Instant delivery and processing',
      color: '#22C55E'
    },
    {
      icon: Shield,
      title: 'Secure & Safe',
      description: 'Bank-level security for all transactions',
      color: '#16A34A'
    },
    {
      icon: TrendingUp,
      title: 'Grow Your Business',
      description: 'Scale with automated solutions',
      color: '#22C55E'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#16A34A] to-[#22C55E] flex flex-col">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white/10 rounded-full"
            style={{
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        {/* Logo Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', duration: 1, bounce: 0.5 }}
          className="mb-8"
        >
          <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center">
            <Smartphone className="w-12 h-12 text-[#16A34A]" strokeWidth={2.5} />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-4"
        >
          <h1 className="text-white mb-2">VTfree</h1>
          <p className="text-white/90">Build Your VTU Business</p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 gap-4 w-full max-w-md mb-12"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
              >
                <feature.icon className="w-8 h-8 text-white mb-2" />
              </motion.div>
              <h3 className="text-white mb-1">{feature.title}</h3>
              <p className="text-white/80 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="w-full max-w-md space-y-4"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('register')}
            className="w-full bg-white text-[#16A34A] py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl"
          >
            Get Started
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="w-5 h-5" />
            </motion.div>
          </motion.button>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('documentation')}
              className="flex-1 bg-white/10 backdrop-blur-md text-white py-4 rounded-2xl border border-white/30 flex items-center justify-center gap-2"
            >
              <Book className="w-5 h-5" />
              Docs
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('support')}
              className="flex-1 bg-white/10 backdrop-blur-md text-white py-4 rounded-2xl border border-white/30 flex items-center justify-center gap-2"
            >
              <Headphones className="w-5 h-5" />
              Support
            </motion.button>
          </div>
        </motion.div>

        {/* Bottom Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-white/70 text-center mt-8 text-sm"
        >
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="text-white underline"
          >
            Sign In
          </button>
        </motion.p>
      </div>
    </div>
  );
}
