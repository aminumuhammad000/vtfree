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
    ChevronDown,
    Code,
    Bell
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
                className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <div className="sidebar-logo-icon">
                            <svg fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L9 5.414V18a1 1 0 102 0V5.414l6.293 6.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                        </div>
                        <div className="sidebar-logo-text">
                            <h1>VTPay</h1>
                            <p>Payment Gateway</p>
                        </div>
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
                    <p className="sidebar-version">v1.0.0</p>
                </div>
            </aside>

            {/* Main Content */}
            <div className="dashboard-main">
                {/* Header */}
                <header className="dashboard-header">
                    <div className="dashboard-header-left">
                        <button
                            className="menu-toggle-btn"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <div className="header-welcome">
                            <h2 className="header-welcome-title">
                                <span className="hidden-mobile">Welcome back, </span>
                                {user?.firstName || 'User'}! 👋
                            </h2>
                            <p className="header-welcome-date">
                                {new Date().toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                        </div>
                    </div>

                    <div className="dashboard-header-right">
                        {/* Notification Bell */}
                        <button className="notification-btn">
                            <span className="notification-dot"></span>
                            <Bell size={20} />
                        </button>

                        {/* Profile Dropdown */}
                        <div className="profile-dropdown">
                            <button
                                className="profile-btn"
                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                            >
                                <div className="profile-avatar">
                                    {user?.firstName?.charAt(0)}
                                </div>
                                <div className="profile-info">
                                    <p className="profile-name">{user?.firstName} {user?.lastName}</p>
                                    <p className="profile-email">{user?.email}</p>
                                </div>
                                <ChevronDown size={16} className="profile-chevron" />
                            </button>

                            {isProfileMenuOpen && (
                                <div className="profile-menu animate-fade-in">
                                    <div className="profile-menu-header">
                                        <p className="profile-name">{user?.firstName} {user?.lastName}</p>
                                        <p className="profile-email">{user?.email}</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="profile-menu-logout"
                                    >
                                        <LogOut size={16} />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Test Mode Banner */}
                {user && user.kycLevel < 3 && (
                    <div className="alert-banner warning">
                        <div className="alert-banner-content">
                            <div className="alert-banner-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                            </div>
                            <div className="alert-banner-text">
                                <h4>Test Mode Active</h4>
                                <p>Your account is currently in test mode. Verify your identity to access live features.</p>
                            </div>
                        </div>
                        <Link
                            to="/dashboard/verification"
                            className="alert-banner-action"
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
