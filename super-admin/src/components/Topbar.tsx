import React, { useState, useEffect } from 'react';
import { FiBell, FiMenu } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

interface TopbarProps {
  onMenuClick: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <header className="h-16 lg:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shadow-md sticky top-0 z-30 backdrop-blur-sm bg-white/95">
      {/* Left Section - Mobile Menu + Welcome Message */}
      <div className="flex items-center gap-3 lg:gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200 hover:scale-110"
        >
          <FiMenu className="w-6 h-6" />
        </button>

        {/* Welcome Message & Date/Time */}
        <div>
          <h2 className="text-base lg:text-xl font-bold text-slate-900">
            <span className="hidden sm:inline">Welcome back, </span>
            Super Admin! 👋
          </h2>
          <div className="flex items-center gap-2 lg:gap-3 text-xs lg:text-sm text-slate-500 mt-0.5 lg:mt-1">
            {/* Date */}
            <p className="hidden md:block">{formatDate(currentTime)}</p>

            {/* Separator */}
            <span className="hidden md:block text-slate-300">|</span>

            {/* Live Clock */}
            <p className="font-mono font-semibold text-emerald-600">
              {formatTime(currentTime)}
            </p>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3 lg:gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200 hover:scale-110">
          <FiBell className="w-5 h-5 lg:w-6 lg:h-6" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>
        </button>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 bg-slate-200"></div>

        {/* Profile Info */}
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-slate-900">Super Admin</p>
            <p className="text-xs text-slate-500">{user?.email || 'admin@vtfree.com'}</p>
          </div>
          <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-emerald-400/30">
            <span>SA</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
