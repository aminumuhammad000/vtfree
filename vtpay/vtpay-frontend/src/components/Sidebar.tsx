import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Wallet,
    CreditCard,
    History,
    Code,
    Settings,
    User,
    LogOut,
    ShieldCheck
} from 'lucide-react';

interface SidebarProps {
    isMobileOpen: boolean;
    setIsMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
    const [isDesktopOpen, setIsDesktopOpen] = useState(true);
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleNavClick = () => {
        if (window.innerWidth < 1024) {
            setIsMobileOpen(false);
        }
    };

    const navItems = [
        { path: '/dashboard', label: 'Overview', icon: <LayoutDashboard size={20} />, exact: true },
        { path: '/dashboard/wallet', label: 'Wallet', icon: <Wallet size={20} /> },
        { path: '/dashboard/virtual-accounts', label: 'Virtual Accounts', icon: <CreditCard size={20} /> },
        { path: '/dashboard/transactions', label: 'Transactions', icon: <History size={20} /> },
        { path: '/dashboard/developer', label: 'Developer', icon: <Code size={20} /> },
        { path: '/dashboard/verification', label: 'Verification', icon: <ShieldCheck size={20} /> },
        { path: '/dashboard/settings', label: 'Settings', icon: <Settings size={20} /> },
        { path: '/dashboard/profile', label: 'Profile', icon: <User size={20} /> },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          ${isDesktopOpen ? 'lg:w-64' : 'lg:w-20'} 
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-gradient-to-b from-green-950 via-green-900 to-green-950 
          text-white h-screen flex flex-col transition-all duration-300 ease-in-out
          border-r border-green-700/50 shadow-2xl backdrop-blur-sm
        `}
            >
                {/* Logo Section */}
                <div className="p-4 lg:p-6 border-b border-green-700/50 flex items-center justify-between transition-all">
                    {(isDesktopOpen || isMobileOpen) && (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L9 5.414V18a1 1 0 102 0V5.414l6.293 6.293a1 1 0 001.414-1.414l-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                                    VTPay
                                </h1>
                                <p className="text-xs text-green-300/60">Tenant Portal</p>
                            </div>
                        </div>
                    )}

                    {/* Desktop Toggle */}
                    <button
                        onClick={() => setIsDesktopOpen(!isDesktopOpen)}
                        className="hidden lg:block p-2 hover:bg-green-800/60 rounded-lg transition-all duration-200 text-green-300/60 hover:text-white hover:scale-110"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d={isDesktopOpen ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
                            />
                        </svg>
                    </button>

                    {/* Mobile Close */}
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="lg:hidden p-2 hover:bg-green-800/60 rounded-lg transition-all duration-200 text-green-300/60 hover:text-white hover:scale-110"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto scrollbar-hide">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.exact}
                            onClick={handleNavClick}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                    ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg scale-[1.02]'
                                    : 'text-green-100/80 hover:bg-green-800/60 hover:text-white hover:scale-[1.02] hover:shadow-md'
                                }`
                            }
                        >
                            <span className="flex-shrink-0">{item.icon}</span>
                            {(isDesktopOpen || isMobileOpen) && (
                                <span className="text-sm font-medium truncate">{item.label}</span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-green-700/50 space-y-2">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-green-100/80 hover:text-white hover:bg-red-900/30 rounded-lg transition-all duration-200 text-sm font-medium hover:scale-[1.02]"
                    >
                        <LogOut size={20} className="flex-shrink-0" />
                        {(isDesktopOpen || isMobileOpen) && <span>Logout</span>}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
