import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Wallet as WalletIcon,
    CreditCard,
    History as HistoryIcon,
    LogOut,
    Menu,
    X,
    User,
    ChevronDown,
    Code
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', label: 'Overview', icon: <LayoutDashboard size={20} /> },
        { path: '/dashboard/wallet', label: 'Wallet', icon: <WalletIcon size={20} /> },
        { path: '/dashboard/virtual-accounts', label: 'Virtual Accounts', icon: <CreditCard size={20} /> },
        { path: '/dashboard/transactions', label: 'Transactions', icon: <HistoryIcon size={20} /> },
        { path: '/dashboard/developer', label: 'Developer', icon: <Code size={20} /> },
    ];

    const isActive = (path: string) => {
        if (path === '/dashboard' && location.pathname === '/dashboard') return true;
        if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <div className="dashboard-container">
            {/* Mobile Sidebar Overlay */}
            <div
                className={`dashboard-sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`dashboard-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="dashboard-sidebar-inner">
                    <div className="sidebar-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                width: '2rem',
                                height: '2rem',
                                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.25rem',
                                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.2)'
                            }}>
                                💳
                            </div>
                            <h1 className="sidebar-logo">VTPay</h1>
                        </div>
                        <button
                            className="sidebar-close-btn"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <nav className="sidebar-nav">
                        <div className="sidebar-nav-list">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {item.icon}
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </nav>

                    <div className="sidebar-footer">
                        <button
                            onClick={handleLogout}
                            className="sidebar-logout-btn"
                        >
                            <LogOut size={20} />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="dashboard-main transition-all duration-300">
                {/* Header */}
                <header className="dashboard-header mb-8">
                    <div className="flex items-center justify-between h-16 px-4 bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <button
                                className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                onClick={() => setIsMobileMenuOpen(true)}
                            >
                                <Menu size={24} />
                            </button>
                            <h2 className="text-xl font-bold text-gray-800 hidden md:block">
                                {navItems.find(item => isActive(item.path))?.label || 'Dashboard'}
                            </h2>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Notification Bell (Visual Only) */}
                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors relative">
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                                </svg>
                            </button>

                            <div className="relative">
                                <button
                                    className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-medium shadow-sm">
                                        {user?.firstName?.charAt(0)}
                                    </div>
                                    <div className="hidden md:block text-left">
                                        <p className="text-sm font-semibold text-gray-700 leading-none">{user?.firstName} {user?.lastName}</p>
                                        <p className="text-xs text-gray-500 leading-none mt-1">{user?.email}</p>
                                    </div>
                                    <ChevronDown size={16} className="text-gray-400" />
                                </button>

                                {isProfileMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-fade-in z-50">
                                        <div className="px-4 py-3 border-b border-gray-50 md:hidden">
                                            <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                                            <p className="text-xs text-gray-500">{user?.email}</p>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                        >
                                            <LogOut size={16} />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Test Mode Banner */}
                {user && user.kycLevel < 3 && (
                    <div className="mb-8 bg-orange-50 border border-orange-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-orange-900">Test Mode Active</h4>
                                <p className="text-sm text-orange-700">Your account is currently in test mode. Verify your identity to access live features.</p>
                            </div>
                        </div>
                        <Link
                            to="/dashboard/verification"
                            className="whitespace-nowrap px-4 py-2 bg-orange-100 text-orange-700 text-sm font-semibold rounded-lg hover:bg-orange-200 transition-colors"
                        >
                            Verify Identity →
                        </Link>
                    </div>
                )}

                {/* Page Content */}
                <main className="dashboard-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
