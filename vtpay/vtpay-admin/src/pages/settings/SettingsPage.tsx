import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/client';

const SettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security' | 'integrations'>('general');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [showApiKey, setShowApiKey] = useState(false);
    const [showSecretKey, setShowSecretKey] = useState(false);

    // Settings state
    const [settings, setSettings] = useState({
        general: {
            companyName: 'VTPay Systems',
            supportEmail: 'support@vtpay.com',
            timezone: 'Africa/Lagos',
            currency: 'NGN',
            maintenanceMode: false,
        },
        notifications: {
            emailAlerts: true,
            slackIntegration: true,
            webhookRetries: 3,
            dailyReports: true,
        },
        security: {
            twoFactorAuth: true,
            sessionTimeout: 30,
            passwordExpiry: 90,
            ipWhitelist: '',
        },
        integrations: {
            zainpay: {
                apiKey: '',
                secretKey: '',
                baseUrl: 'https://api.zainpay.ng',
                isLive: false,
            }
        }
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setFetching(true);
            const data = await adminApi.getSystemSettings();
            if (data) {
                setSettings(data);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await adminApi.updateSystemSettings(settings);
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    const renderGeneralSettings = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                    <input
                        type="text"
                        value={settings.general.companyName}
                        onChange={(e) => setSettings({
                            ...settings,
                            general: { ...settings.general, companyName: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Support Email</label>
                    <input
                        type="email"
                        value={settings.general.supportEmail}
                        onChange={(e) => setSettings({
                            ...settings,
                            general: { ...settings.general, supportEmail: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Timezone</label>
                    <select
                        value={settings.general.timezone}
                        onChange={(e) => setSettings({
                            ...settings,
                            general: { ...settings.general, timezone: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="Africa/Lagos">West Africa Time (Lagos)</option>
                        <option value="UTC">UTC</option>
                        <option value="Europe/London">London</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Default Currency</label>
                    <select
                        value={settings.general.currency}
                        onChange={(e) => setSettings({
                            ...settings,
                            general: { ...settings.general, currency: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="NGN">Nigerian Naira (NGN)</option>
                        <option value="USD">US Dollar (USD)</option>
                    </select>
                </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <input
                    type="checkbox"
                    checked={settings.general.maintenanceMode}
                    onChange={(e) => setSettings({
                        ...settings,
                        general: { ...settings.general, maintenanceMode: e.target.checked }
                    })}
                    className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500"
                />
                <div>
                    <p className="text-sm font-medium text-yellow-800">Maintenance Mode</p>
                    <p className="text-xs text-yellow-600">Enable to suspend all non-admin access to the platform</p>
                </div>
            </div>
        </div>
    );

    const renderNotificationSettings = () => (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                        <p className="text-sm font-medium text-slate-900">Email Alerts</p>
                        <p className="text-xs text-slate-500">Receive critical system alerts via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.notifications.emailAlerts}
                            onChange={(e) => setSettings({
                                ...settings,
                                notifications: { ...settings.notifications, emailAlerts: e.target.checked }
                            })}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                        <p className="text-sm font-medium text-slate-900">Slack Integration</p>
                        <p className="text-xs text-slate-500">Send notifications to Slack channel</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.notifications.slackIntegration}
                            onChange={(e) => setSettings({
                                ...settings,
                                notifications: { ...settings.notifications, slackIntegration: e.target.checked }
                            })}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                        <p className="text-sm font-medium text-slate-900">Daily Reports</p>
                        <p className="text-xs text-slate-500">Generate and send daily transaction summaries</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.notifications.dailyReports}
                            onChange={(e) => setSettings({
                                ...settings,
                                notifications: { ...settings.notifications, dailyReports: e.target.checked }
                            })}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Webhook Max Retries</label>
                <input
                    type="number"
                    value={settings.notifications.webhookRetries}
                    onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, webhookRetries: parseInt(e.target.value) }
                    })}
                    className="w-full md:w-1/3 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
            </div>
        </div>
    );

    const renderSecuritySettings = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                    <p className="text-sm font-medium text-slate-900">Enforce 2FA</p>
                    <p className="text-xs text-slate-500">Require Two-Factor Authentication for all admin users</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings.security.twoFactorAuth}
                        onChange={(e) => setSettings({
                            ...settings,
                            security: { ...settings.security, twoFactorAuth: e.target.checked }
                        })}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Session Timeout (minutes)</label>
                    <input
                        type="number"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => setSettings({
                            ...settings,
                            security: { ...settings.security, sessionTimeout: parseInt(e.target.value) }
                        })}
                        className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password Expiry (days)</label>
                    <input
                        type="number"
                        value={settings.security.passwordExpiry}
                        onChange={(e) => setSettings({
                            ...settings,
                            security: { ...settings.security, passwordExpiry: parseInt(e.target.value) }
                        })}
                        className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Admin IP Whitelist</label>
                <textarea
                    value={settings.security.ipWhitelist}
                    onChange={(e) => setSettings({
                        ...settings,
                        security: { ...settings.security, ipWhitelist: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 h-24"
                    placeholder="Enter IP addresses separated by commas"
                />
                <p className="text-xs text-slate-500 mt-1">Leave empty to allow access from any IP</p>
            </div>
        </div>
    );
    const renderIntegrationsSettings = () => (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                            ZP
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-slate-900">Zainpay Integration</h3>
                            <p className="text-sm text-slate-500">Configure your Zainpay payment gateway credentials</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${settings.integrations.zainpay.isLive ? 'text-green-600' : 'text-yellow-600'}`}>
                            {settings.integrations.zainpay.isLive ? 'Live Mode' : 'Test Mode'}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.integrations.zainpay.isLive}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    integrations: {
                                        ...settings.integrations,
                                        zainpay: { ...settings.integrations.zainpay, isLive: e.target.checked }
                                    }
                                })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Base URL</label>
                        <input
                            type="text"
                            value={settings.integrations.zainpay.baseUrl}
                            onChange={(e) => setSettings({
                                ...settings,
                                integrations: {
                                    ...settings.integrations,
                                    zainpay: { ...settings.integrations.zainpay, baseUrl: e.target.value }
                                }
                            })}
                            className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="https://api.zainpay.ng"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Public Key</label>
                        <div className="relative">
                            <input
                                type={showApiKey ? 'text' : 'password'}
                                value={settings.integrations.zainpay.apiKey}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    integrations: {
                                        ...settings.integrations,
                                        zainpay: { ...settings.integrations.zainpay, apiKey: e.target.value }
                                    }
                                })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showApiKey ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Secret Key</label>
                        <div className="relative">
                            <input
                                type={showSecretKey ? 'text' : 'password'}
                                value={settings.integrations.zainpay.secretKey}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    integrations: {
                                        ...settings.integrations,
                                        zainpay: { ...settings.integrations.zainpay, secretKey: e.target.value }
                                    }
                                })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowSecretKey(!showSecretKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showSecretKey ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (fetching) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">System Settings</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage global configuration and security</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                        </>
                    ) : (
                        'Save Changes'
                    )}
                </button>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-200">
                    <nav className="flex">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'general'
                                ? 'border-green-600 text-green-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            General
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'notifications'
                                ? 'border-green-600 text-green-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Notifications
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'security'
                                ? 'border-green-600 text-green-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Security
                        </button>
                        <button
                            onClick={() => setActiveTab('integrations')}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'integrations'
                                ? 'border-green-600 text-green-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Integrations
                        </button>
                    </nav>
                </div>
                <div className="p-6">
                    {activeTab === 'general' && renderGeneralSettings()}
                    {activeTab === 'notifications' && renderNotificationSettings()}
                    {activeTab === 'security' && renderSecuritySettings()}
                    {activeTab === 'integrations' && renderIntegrationsSettings()}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
