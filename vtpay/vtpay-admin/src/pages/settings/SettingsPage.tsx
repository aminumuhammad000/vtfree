import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/client';
import toast from 'react-hot-toast';

const SettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security' | 'integrations' | 'payouts' | 'email'>('general');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [showApiKey, setShowApiKey] = useState(false);
    const [showSecretKey, setShowSecretKey] = useState(false);
    const [showEmailPass, setShowEmailPass] = useState(false);
    const [banks, setBanks] = useState<any[]>([]);
    const [isVerifying, setIsVerifying] = useState(false);

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
            },
            payrant: {
                apiKey: '',
                baseUrl: 'https://api-core.payrant.com/',
            }
        },
        parentAccount: {
            accountName: '',
            accountNumber: '',
            bankCode: '',
            type: 'PRIMARY' as 'PRIMARY' | 'SECONDARY',
            status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
        },
        zainpaySettlement: {
            zainboxCode: '',
            scheduleType: 'T1' as 'T1' | 'T0',
            schedulePeriod: 'Daily' as 'Daily' | 'Weekly' | 'Monthly',
            status: false,
        },
        payout: {
            minAmount: 10000,
            vtpayFeePercent: 0.6,
            zainpayPercentFee: 1.6,
            bankSettlementFee: 2500,
            bankSettlementThreshold: 0,
        },
        deposit: {
            vtpayFeePercent: 2.0,
        },
        emailConfig: {
            provider: 'gmail' as 'gmail' | 'other',
            gmail: {
                user: '',
                pass: '',
            },
            smtp: {
                host: '',
                port: 587,
                secure: false,
                user: '',
                pass: '',
            },
        }
    });

    useEffect(() => {
        fetchSettings();
        fetchBanks();
    }, []);

    const fetchBanks = async () => {
        try {
            const data = await adminApi.getBanks();
            setBanks(data);
        } catch (error) {
            console.error('Failed to fetch banks:', error);
        }
    };

    const handleVerifyAccount = async () => {
        const { bankCode, accountNumber } = settings.parentAccount;
        if (!bankCode || !accountNumber) {
            toast.error('Please select a bank and enter account number');
            return;
        }

        try {
            setIsVerifying(true);
            const data = await adminApi.verifyAccount(bankCode, accountNumber);
            if (data && data.accountName) {
                setSettings({
                    ...settings,
                    parentAccount: {
                        ...settings.parentAccount,
                        accountName: data.accountName
                    }
                });
                toast.success('Account verified successfully');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to verify account');
        } finally {
            setIsVerifying(false);
        }
    };

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
            toast.success('Settings saved successfully!');
            await fetchBanks();
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
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
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 gap-4">
                    <div>
                        <p className="text-sm font-medium text-slate-900">Email Alerts</p>
                        <p className="text-xs text-slate-500">Receive critical system alerts via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
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

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 gap-4">
                    <div>
                        <p className="text-sm font-medium text-slate-900">Slack Integration</p>
                        <p className="text-xs text-slate-500">Send notifications to Slack channel</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
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

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 gap-4">
                    <div>
                        <p className="text-sm font-medium text-slate-900">Daily Reports</p>
                        <p className="text-xs text-slate-500">Generate and send daily transaction summaries</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
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
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 gap-4">
                <div>
                    <p className="text-sm font-medium text-slate-900">Enforce 2FA</p>
                    <p className="text-xs text-slate-500">Require Two-Factor Authentication for all admin users</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex-shrink-0 flex items-center justify-center text-blue-600 font-bold">
                            ZP
                        </div>
                        <div>
                            <h3 className="text-base md:text-lg font-medium text-slate-900">Zainpay Integration</h3>
                            <p className="text-xs md:text-sm text-slate-500">Configure your Zainpay payment gateway credentials</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 w-full sm:w-auto justify-between sm:justify-start">
                        <span className={`text-sm font-medium ${settings.integrations.zainpay.isLive ? 'text-green-600' : 'text-yellow-600'}`}>
                            {settings.integrations.zainpay.isLive ? 'Live Mode' : 'Test Mode'}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.integrations.zainpay.isLive}
                                onChange={(e) => {
                                    const isLive = e.target.checked;
                                    setSettings({
                                        ...settings,
                                        integrations: {
                                            ...settings.integrations,
                                            zainpay: {
                                                ...settings.integrations.zainpay,
                                                isLive,
                                                baseUrl: isLive ? 'https://api.zainpay.ng' : 'https://sandbox.zainpay.ng'
                                            }
                                        }
                                    });
                                }}
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
                        <p className="text-xs text-slate-500 mt-1">
                            {settings.integrations.zainpay.isLive
                                ? 'Live URL: https://api.zainpay.ng'
                                : 'Sandbox URL: https://sandbox.zainpay.ng'}
                        </p>
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

            {/* Payrant Configuration */}
            <div className="bg-white p-6 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex-shrink-0 flex items-center justify-center text-green-600 font-bold">
                        PR
                    </div>
                    <div>
                        <h3 className="text-base md:text-lg font-medium text-slate-900">Payrant Configuration</h3>
                        <p className="text-xs md:text-sm text-slate-500">Configure Payrant API credentials for payouts</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Payrant API Key</label>
                        <input
                            type="password"
                            value={settings.integrations.payrant?.apiKey || ''}
                            onChange={(e) => setSettings({
                                ...settings,
                                integrations: {
                                    ...settings.integrations,
                                    payrant: { ...settings.integrations.payrant, apiKey: e.target.value }
                                }
                            })}
                            className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                            placeholder="Enter Payrant API Key"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Payrant Base URL</label>
                        <input
                            type="text"
                            value={settings.integrations.payrant?.baseUrl || ''}
                            onChange={(e) => setSettings({
                                ...settings,
                                integrations: {
                                    ...settings.integrations,
                                    payrant: { ...settings.integrations.payrant, baseUrl: e.target.value }
                                }
                            })}
                            className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="https://api-core.payrant.com/"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPayoutSettings = () => (
        <div className="space-y-6">
            {/* Parent Account Configuration */}
            <div className="bg-white p-6 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex-shrink-0 flex items-center justify-center text-purple-600 font-bold">
                        PA
                    </div>
                    <div>
                        <h3 className="text-base md:text-lg font-medium text-slate-900">Payrant Parent Account</h3>
                        <p className="text-xs md:text-sm text-slate-500">Configure the source account for Payrant transfers</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Select Bank</label>
                        <select
                            value={settings.parentAccount?.bankCode || ''}
                            onChange={(e) => setSettings({
                                ...settings,
                                parentAccount: { ...settings.parentAccount, bankCode: e.target.value }
                            })}
                            className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="">Select a bank</option>
                            {banks.map((bank) => (
                                <option key={bank.bankCode} value={bank.bankCode}>
                                    {bank.bankName}
                                </option>
                            ))}
                        </select>
                        {banks.length === 0 && (
                            <p className="text-xs text-red-500 mt-1">
                                No banks found. Please ensure <strong>Zainpay Integration</strong> is configured correctly in the Integrations tab.
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={settings.parentAccount?.accountNumber || ''}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    parentAccount: { ...settings.parentAccount, accountNumber: e.target.value }
                                })}
                                className="flex-1 px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="10-digit account number"
                                maxLength={10}
                            />
                            <button
                                onClick={handleVerifyAccount}
                                disabled={isVerifying || !settings.parentAccount.bankCode || settings.parentAccount.accountNumber.length !== 10}
                                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
                            >
                                {isVerifying ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Verifying...
                                    </>
                                ) : 'Verify'}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Account Name (Verified)</label>
                        <input
                            type="text"
                            value={settings.parentAccount?.accountName || ''}
                            readOnly
                            className="w-full px-4 py-2 border border-slate-300 bg-slate-50 text-slate-600 rounded-lg focus:outline-none cursor-not-allowed"
                            placeholder="Verified account name will appear here"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <select
                            value={settings.parentAccount?.status || 'ACTIVE'}
                            onChange={(e) => setSettings({
                                ...settings,
                                parentAccount: { ...settings.parentAccount, status: e.target.value as 'ACTIVE' | 'INACTIVE' }
                            })}
                            className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Zainpay Settlement Configuration */}
            <div className="bg-white p-6 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex-shrink-0 flex items-center justify-center text-amber-600 font-bold">
                        ZS
                    </div>
                    <div>
                        <h3 className="text-base md:text-lg font-medium text-slate-900">Global Settlement Configuration</h3>
                        <p className="text-xs md:text-sm text-slate-500">Configure automatic T1 settlement for <strong>ALL</strong> Zainboxes to the Parent Account</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Schedule Type</label>
                        <select
                            value={settings.zainpaySettlement?.scheduleType || 'T1'}
                            onChange={(e) => setSettings({
                                ...settings,
                                zainpaySettlement: { ...settings.zainpaySettlement, scheduleType: e.target.value as 'T1' | 'T0' }
                            })}
                            className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="T1">T+1 (Next Day)</option>
                            <option value="T0">T+0 (Same Day)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Settlement Status</label>
                        <div className="flex items-center gap-3 p-2">
                            <input
                                type="checkbox"
                                checked={settings.zainpaySettlement?.status || false}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    zainpaySettlement: { ...settings.zainpaySettlement, status: e.target.checked }
                                })}
                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                            />
                            <span className="text-sm text-slate-600">Enable Automatic Settlement</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Deposit Fee Configuration */}
            <div className="bg-white p-6 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex-shrink-0 flex items-center justify-center text-green-600 font-bold">
                        DF
                    </div>
                    <div>
                        <h3 className="text-base md:text-lg font-medium text-slate-900">Deposit Fee Configuration</h3>
                        <p className="text-xs md:text-sm text-slate-500">Configure fees for incoming transfers (Deposits)</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">VTPay Deposit Fee (%)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={settings.deposit?.vtpayFeePercent || 0}
                            onChange={(e) => setSettings({
                                ...settings,
                                deposit: { ...settings.deposit, vtpayFeePercent: parseFloat(e.target.value) }
                            })}
                            className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            This is the total fee percentage deducted from the user's deposit.
                        </p>
                    </div>
                </div>
            </div>

            {/* Payout Fee Configuration */}
            <div className="bg-white p-6 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex-shrink-0 flex items-center justify-center text-blue-600 font-bold">
                        PF
                    </div>
                    <div>
                        <h3 className="text-base md:text-lg font-medium text-slate-900">Payout Configuration</h3>
                        <p className="text-xs md:text-sm text-slate-500">Configure fees and limits for payouts</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Min Payout Amount (Kobo)</label>
                        <input
                            type="number"
                            value={settings.payout?.minAmount || 0}
                            onChange={(e) => setSettings({
                                ...settings,
                                payout: { ...settings.payout, minAmount: parseInt(e.target.value) }
                            })}
                            className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">VTPay Payout Fee (%)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={settings.payout?.vtpayFeePercent || 0}
                            onChange={(e) => setSettings({
                                ...settings,
                                payout: { ...settings.payout, vtpayFeePercent: parseFloat(e.target.value) }
                            })}
                            className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Bank Settlement Fee (Kobo)</label>
                        <input
                            type="number"
                            value={settings.payout?.bankSettlementFee || 0}
                            onChange={(e) => setSettings({
                                ...settings,
                                payout: { ...settings.payout, bankSettlementFee: parseInt(e.target.value) }
                            })}
                            className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Bank Settlement Threshold (Kobo)</label>
                        <input
                            type="number"
                            value={settings.payout?.bankSettlementThreshold || 0}
                            onChange={(e) => setSettings({
                                ...settings,
                                payout: { ...settings.payout, bankSettlementThreshold: parseInt(e.target.value) }
                            })}
                            className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Fee applies only if amount is greater than or equal to this threshold. Set to 0 to apply to all.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderEmailSettings = () => (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200">
                <div className="mb-6">
                    <h3 className="text-base md:text-lg font-medium text-slate-900">Email Service Configuration</h3>
                    <p className="text-xs md:text-sm text-slate-500">Set the email account responsible for sending messages to users</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Email Provider</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setSettings({
                                    ...settings,
                                    emailConfig: { ...settings.emailConfig, provider: 'gmail' }
                                })}
                                className={`px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${settings.emailConfig.provider === 'gmail'
                                    ? 'border-green-600 bg-green-50 text-green-700'
                                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                    }`}
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M24 4.5v15c0 .85-.65 1.5-1.5 1.5H21V7.39l-9 6.58-9-6.58V21H1.5C.65 21 0 20.35 0 19.5v-15c0-.42.17-.8.44-1.08C.72 3.14 1.1 3 1.5 3H2l10 7.25L22 3h.5c.4 0 .78.14 1.06.42.27.28.44.66.44 1.08z" />
                                </svg>
                                Gmail
                            </button>
                            <button
                                onClick={() => setSettings({
                                    ...settings,
                                    emailConfig: { ...settings.emailConfig, provider: 'other' }
                                })}
                                className={`px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${settings.emailConfig.provider === 'other'
                                    ? 'border-green-600 bg-green-50 text-green-700'
                                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Other SMTP
                            </button>
                        </div>
                    </div>

                    {settings.emailConfig.provider === 'gmail' ? (
                        <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center gap-2 text-blue-600 mb-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-xs font-medium">Gmail uses automatic port (465/587) and service settings.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Gmail Address</label>
                                <input
                                    type="email"
                                    value={settings.emailConfig.gmail.user}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        emailConfig: {
                                            ...settings.emailConfig,
                                            gmail: { ...settings.emailConfig.gmail, user: e.target.value }
                                        }
                                    })}
                                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="your-email@gmail.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">App Password</label>
                                <div className="relative">
                                    <input
                                        type={showEmailPass ? 'text' : 'password'}
                                        value={settings.emailConfig.gmail.pass}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            emailConfig: {
                                                ...settings.emailConfig,
                                                gmail: { ...settings.emailConfig.gmail, pass: e.target.value }
                                            }
                                        })}
                                        className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
                                        placeholder="xxxx xxxx xxxx xxxx"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowEmailPass(!showEmailPass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showEmailPass ? (
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
                                <p className="text-xs text-slate-500 mt-2">
                                    Use a Google App Password, not your regular account password.
                                    <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline ml-1">Generate one here</a>
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Host</label>
                                    <input
                                        type="text"
                                        value={settings.emailConfig.smtp.host}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            emailConfig: {
                                                ...settings.emailConfig,
                                                smtp: { ...settings.emailConfig.smtp, host: e.target.value }
                                            }
                                        })}
                                        className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="smtp.example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Port</label>
                                    <input
                                        type="number"
                                        value={settings.emailConfig.smtp.port}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            emailConfig: {
                                                ...settings.emailConfig,
                                                smtp: { ...settings.emailConfig.smtp, port: parseInt(e.target.value) }
                                            }
                                        })}
                                        className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="587"
                                    />
                                </div>
                                <div className="flex items-center gap-2 pt-6">
                                    <input
                                        type="checkbox"
                                        checked={settings.emailConfig.smtp.secure}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            emailConfig: {
                                                ...settings.emailConfig,
                                                smtp: { ...settings.emailConfig.smtp, secure: e.target.checked }
                                            }
                                        })}
                                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                    />
                                    <label className="text-sm text-slate-700">Use Secure Connection (SSL/TLS)</label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                                    <input
                                        type="text"
                                        value={settings.emailConfig.smtp.user}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            emailConfig: {
                                                ...settings.emailConfig,
                                                smtp: { ...settings.emailConfig.smtp, user: e.target.value }
                                            }
                                        })}
                                        className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showEmailPass ? 'text' : 'password'}
                                            value={settings.emailConfig.smtp.pass}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                emailConfig: {
                                                    ...settings.emailConfig,
                                                    smtp: { ...settings.emailConfig.smtp, pass: e.target.value }
                                                }
                                            })}
                                            className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowEmailPass(!showEmailPass)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showEmailPass ? (
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
                    )}
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
        <div className="p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900">System Settings</h1>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">Manage global configuration and security</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm active:scale-95"
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Save Changes
                        </>
                    )}
                </button>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-200 overflow-x-auto scrollbar-hide">
                    <nav className="flex whitespace-nowrap min-w-max sm:min-w-0">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`px-4 md:px-6 py-4 text-xs md:text-sm font-medium border-b-2 transition-colors ${activeTab === 'general'
                                ? 'border-green-600 text-green-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            General
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`px-4 md:px-6 py-4 text-xs md:text-sm font-medium border-b-2 transition-colors ${activeTab === 'notifications'
                                ? 'border-green-600 text-green-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Notifications
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`px-4 md:px-6 py-4 text-xs md:text-sm font-medium border-b-2 transition-colors ${activeTab === 'security'
                                ? 'border-green-600 text-green-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Security
                        </button>
                        <button
                            onClick={() => setActiveTab('integrations')}
                            className={`px-4 md:px-6 py-4 text-xs md:text-sm font-medium border-b-2 transition-colors ${activeTab === 'integrations'
                                ? 'border-green-600 text-green-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Integrations
                        </button>
                        <button
                            onClick={() => setActiveTab('payouts')}
                            className={`px-4 md:px-6 py-4 text-xs md:text-sm font-medium border-b-2 transition-colors ${activeTab === 'payouts'
                                ? 'border-green-600 text-green-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Payouts
                        </button>
                        <button
                            onClick={() => setActiveTab('email')}
                            className={`px-4 md:px-6 py-4 text-xs md:text-sm font-medium border-b-2 transition-colors ${activeTab === 'email'
                                ? 'border-green-600 text-green-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Email Config
                        </button>
                    </nav>
                </div>
                <div className="p-4 md:p-6">
                    {activeTab === 'general' && renderGeneralSettings()}
                    {activeTab === 'notifications' && renderNotificationSettings()}
                    {activeTab === 'security' && renderSecuritySettings()}
                    {activeTab === 'integrations' && renderIntegrationsSettings()}
                    {activeTab === 'payouts' && renderPayoutSettings()}
                    {activeTab === 'email' && renderEmailSettings()}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
