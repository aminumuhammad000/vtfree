import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    FiGrid,
    FiUsers,
    FiLayers,
    FiCreditCard,
    FiActivity,
    FiServer,
    FiSettings,
    FiLogOut,
    FiX
} from 'react-icons/fi';

interface SidebarProps {
    isMobileOpen: boolean;
    setIsMobileOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
    const menuItems = [
        { icon: FiGrid, label: 'Dashboard', path: '/dashboard' },
        { icon: FiUsers, label: 'Users', path: '/users' },
        { icon: FiLayers, label: 'Apps', path: '/apps' },
        { icon: FiCreditCard, label: 'Wallet & Finance', path: '/finance' },
        { icon: FiActivity, label: 'Transactions', path: '/transactions' },
        { icon: FiServer, label: 'Providers', path: '/providers' },
        { icon: FiSettings, label: 'Settings', path: '/settings' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-slate-200 shadow-xl lg:shadow-none
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
            >
                {/* Logo Section */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">S</span>
                        </div>
                        <span className="text-xl font-bold text-slate-900 tracking-tight">Super Admin</span>
                    </div>
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileOpen(false)}
                            className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${isActive
                                    ? 'bg-green-50 text-green-700 font-medium shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }
              `}
                        >
                            <item.icon
                                className={`w-5 h-5 transition-colors ${window.location.pathname === item.path
                                        ? 'text-green-600'
                                        : 'text-slate-400 group-hover:text-slate-600'
                                    }`}
                            />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* User Profile & Logout */}
                <div className="p-4 border-t border-slate-100">
                    <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-50 text-slate-600 hover:text-red-600 transition-all group">
                        <FiLogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
