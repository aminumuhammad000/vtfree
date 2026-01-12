import React from 'react';
import {
    Bell,
    Lock,
    Shield,
    User,
    Mail,
    Smartphone,
    Key,
    Eye,
    ChevronRight,
    ShieldCheck,
    Globe,
    Moon,
    Database,
    CreditCard
} from 'lucide-react';

export const Settings: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="settings-header">
                <h1 className="text-heading">Settings</h1>
                <p className="text-body">Manage your account preferences and security settings</p>
            </div>

            <div className="settings-grid">
                {/* Sidebar Navigation */}
                <div className="settings-sidebar">
                    {[
                        { icon: User, label: 'General', active: true },
                        { icon: Bell, label: 'Notifications', active: false },
                        { icon: Shield, label: 'Security', active: false },
                        { icon: CreditCard, label: 'Billing', active: false },
                        { icon: Globe, label: 'Integrations', active: false },
                    ].map((item) => (
                        <button
                            key={item.label}
                            className={`settings-nav-btn ${item.active ? 'active' : ''}`}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <div className="settings-main-col">
                    {/* Notifications Section */}
                    <div className="settings-card">
                        <div className="settings-card-header">
                            <Bell size={18} className="text-blue-600" />
                            <h3 className="text-subheading">Notification Preferences</h3>
                        </div>
                        <div className="settings-card-body">
                            <div className="settings-item">
                                <div className="settings-item-content">
                                    <p className="settings-item-title">Email Notifications</p>
                                    <p className="settings-item-desc">Receive updates about your account activity via email</p>
                                </div>
                                <label className="toggle-switch">
                                    <input type="checkbox" className="toggle-input" defaultChecked />
                                    <div className="toggle-slider">
                                        <div className="toggle-knob"></div>
                                    </div>
                                </label>
                            </div>
                            <div className="settings-item pt-6 border-t border-gray-50">
                                <div className="settings-item-content">
                                    <p className="settings-item-title">Push Notifications</p>
                                    <p className="settings-item-desc">Get real-time alerts on your browser or mobile device</p>
                                </div>
                                <label className="toggle-switch">
                                    <input type="checkbox" className="toggle-input" />
                                    <div className="toggle-slider">
                                        <div className="toggle-knob"></div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Security Section */}
                    <div className="settings-card">
                        <div className="settings-card-header">
                            <ShieldCheck size={18} className="text-green-600" />
                            <h3 className="text-subheading">Security & Privacy</h3>
                        </div>
                        <div className="settings-card-body">
                            <button className="security-btn group">
                                <div className="flex items-center gap-4">
                                    <div className="security-btn-icon">
                                        <Key size={20} />
                                    </div>
                                    <div className="security-btn-content">
                                        <p className="settings-item-title">Change Password</p>
                                        <p className="text-[10px] text-muted mt-0.5">Last updated 3 months ago</p>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button className="security-btn group">
                                <div className="flex items-center gap-4">
                                    <div className="security-btn-icon">
                                        <Smartphone size={20} />
                                    </div>
                                    <div className="security-btn-content">
                                        <p className="settings-item-title">Two-Factor Authentication</p>
                                        <p className="text-[10px] text-amber-600 font-bold mt-0.5">Not enabled</p>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="danger-zone">
                        <h4 className="danger-title">Danger Zone</h4>
                        <p className="danger-desc">Once you delete your account, there is no going back. Please be certain.</p>
                        <button className="btn-danger">
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
