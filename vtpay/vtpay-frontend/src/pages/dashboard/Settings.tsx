import React from 'react';
import {
    Bell,
    Shield,
    User,
    Smartphone,
    Key,
    ChevronRight,
    ShieldCheck,
    Globe,
    CreditCard
} from 'lucide-react';

export const Settings: React.FC = () => {
    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your account preferences and security settings</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2">
                        {[
                            { icon: User, label: 'General', active: true },
                            { icon: Bell, label: 'Notifications', active: false },
                            { icon: Shield, label: 'Security', active: false },
                            { icon: CreditCard, label: 'Billing', active: false },
                            { icon: Globe, label: 'Integrations', active: false },
                        ].map((item) => (
                            <button
                                key={item.label}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold ${item.active
                                    ? 'bg-green-50 text-green-700'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <item.icon size={18} />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Notifications Section */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                <Bell size={18} className="text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Notification Preferences</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Manage how you receive updates</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Email Notifications</p>
                                    <p className="text-xs text-gray-500 mt-1">Receive updates about your account activity via email</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>
                            <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Push Notifications</p>
                                    <p className="text-xs text-gray-500 mt-1">Get real-time alerts on your browser or mobile device</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Security Section */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                                <ShieldCheck size={18} className="text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Security & Privacy</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Keep your account secure</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-2">
                            <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-green-50 transition-colors">
                                        <Key size={20} className="text-gray-600 group-hover:text-green-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-gray-900">Change Password</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Last updated 3 months ago</p>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-gray-400 group-hover:translate-x-1 group-hover:text-gray-900 transition-all" />
                            </button>

                            <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-green-50 transition-colors">
                                        <Smartphone size={20} className="text-gray-600 group-hover:text-green-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-gray-900">Two-Factor Authentication</p>
                                        <p className="text-xs text-amber-600 font-bold mt-0.5">Not enabled</p>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-gray-400 group-hover:translate-x-1 group-hover:text-gray-900 transition-all" />
                            </button>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-red-50 rounded-2xl border-2 border-red-100 p-6">
                        <h4 className="text-lg font-bold text-red-900 mb-2">Danger Zone</h4>
                        <p className="text-sm text-red-700 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                        <button className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-red-200">
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
