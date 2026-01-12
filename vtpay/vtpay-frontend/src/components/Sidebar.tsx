import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Wallet,
    CreditCard,
    History,
    Code,
    Settings,
    LogOut,
    ShieldCheck,
    HelpCircle,
    User,
    Send
} from 'lucide-react';
import '../styles/sidebar.css';

interface SidebarProps {
    isMobileOpen: boolean;
    setIsMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
    const [isDesktopOpen, setIsDesktopOpen] = useState(true);
    const { logout } = useAuth();
    const navigate = useNavigate();

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
        { path: '/dashboard/transactions', label: 'Transactions', icon: <History size={20} /> },
        { path: '/dashboard/virtual-accounts', label: 'Virtual Accounts', icon: <CreditCard size={20} /> },
        { path: '/dashboard/wallet', label: 'Wallet', icon: <Wallet size={20} /> },
        { path: '/dashboard/payout', label: 'Payout', icon: <Send size={20} /> },
        { path: '/dashboard/verification', label: 'Verification', icon: <ShieldCheck size={20} /> },
        { path: '/dashboard/developer', label: 'Developer', icon: <Code size={20} /> },
        { path: '/dashboard/profile', label: 'Profile', icon: <User size={20} /> },
        { path: '/dashboard/settings', label: 'Settings', icon: <Settings size={20} /> },
        { path: '/dashboard/help', label: 'Need Help?', icon: <HelpCircle size={20} /> },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="sidebar-overlay active lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`sidebar ${isMobileOpen ? 'open' : ''} ${isDesktopOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}
            >
                {/* Logo Section */}
                <div className="sidebar-header">
                    {(isDesktopOpen || isMobileOpen) && (
                        <div className="sidebar-brand">
                            <div className="sidebar-logo-icon">
                                <span className="sidebar-logo-text-inner">V</span>
                            </div>
                            <div className="sidebar-logo-text">
                                <h1>VTPay</h1>
                                <p>Dashboard</p>
                            </div>
                        </div>
                    )}
                    {!isDesktopOpen && !isMobileOpen && (
                        <div className="sidebar-logo-icon sidebar-logo-centered">
                            <span className="sidebar-logo-text-inner">V</span>
                        </div>
                    )}

                    {/* Desktop Toggle */}
                    <button
                        onClick={() => setIsDesktopOpen(!isDesktopOpen)}
                        className="sidebar-toggle-btn hidden lg:block"
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
                        className="sidebar-close-btn lg:hidden"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    <ul className="sidebar-nav-list">
                        {navItems.map((item) => (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    end={item.exact}
                                    onClick={handleNavClick}
                                    className={({ isActive }) =>
                                        `sidebar-nav-item ${isActive ? 'active' : ''}`
                                    }
                                >
                                    <span className="sidebar-nav-icon">{item.icon}</span>
                                    {(isDesktopOpen || isMobileOpen) && (
                                        <span className="sidebar-nav-label">{item.label}</span>
                                    )}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Logout Button */}
                <div className="sidebar-footer">
                    <button
                        onClick={handleLogout}
                        className="sidebar-logout-btn"
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
