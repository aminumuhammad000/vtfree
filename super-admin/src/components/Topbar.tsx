import React from 'react';
import { FiBell, FiMenu, FiSearch } from 'react-icons/fi';

interface TopbarProps {
  onMenuClick: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <FiMenu className="w-6 h-6" />
        </button>

        {/* Search Bar */}
        <div className="hidden md:flex items-center relative">
          <FiSearch className="absolute left-3 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search anything..."
            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 w-64 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
          <FiBell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* Profile Dropdown */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-slate-900">Super Admin</p>
            <p className="text-xs text-slate-500">admin@vtfree.com</p>
          </div>
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            <span className="text-green-700 font-bold">SA</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
