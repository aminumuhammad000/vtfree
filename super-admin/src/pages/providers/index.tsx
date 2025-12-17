import { useState } from 'react';
import { Icon } from '@iconify/react';

interface Provider {
    id: string;
    name: string;
    type: string;
    status: 'active' | 'inactive' | 'error';
    apiKey: string;
    successRate: number;
    avgResponseTime: number; // in ms
    requestsToday: number;
    lastChecked: string;
    features: string[];
}

const Providers = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const providers: Provider[] = [
        {
            id: 'stripe',
            name: 'Stripe',
            type: 'Payment Gateway',
            status: 'active',
            apiKey: 'sk_live_xxxxx...xxxxx',
            successRate: 99.8,
            avgResponseTime: 250,
            requestsToday: 1247,
            lastChecked: '2 mins ago',
            features: ['Card Payments', 'Bank Transfers', 'Webhooks', 'Refunds'],
        },
        {
            id: 'paystack',
            name: 'Paystack',
            type: 'Payment Gateway',
            status: 'active',
            apiKey: 'sk_live_xxxxx...xxxxx',
            successRate: 98.5,
            avgResponseTime: 320,
            requestsToday: 856,
            lastChecked: '5 mins ago',
            features: ['Card Payments', 'USSD', 'Bank Transfers', 'QR Payments'],
        },
        {
            id: 'flutterwave',
            name: 'Flutterwave',
            type: 'Payment Gateway',
            status: 'active',
            apiKey: 'FLWSECK-xxxxx...xxxxx',
            successRate: 97.2,
            avgResponseTime: 410,
            requestsToday: 634,
            lastChecked: '1 min ago',
            features: ['Card Payments', 'Mobile Money', 'Bank Transfers'],
        },
        {
            id: 'twilio',
            name: 'Twilio',
            type: 'SMS Provider',
            status: 'active',
            apiKey: 'ACxxxxx...xxxxx',
            successRate: 99.5,
            avgResponseTime: 180,
            requestsToday: 2341,
            lastChecked: '3 mins ago',
            features: ['SMS', 'WhatsApp', 'Voice', 'Verify'],
        },
        {
            id: 'sendgrid',
            name: 'SendGrid',
            type: 'Email Provider',
            status: 'inactive',
            apiKey: 'SG.xxxxx...xxxxx',
            successRate: 0,
            avgResponseTime: 0,
            requestsToday: 0,
            lastChecked: '2 hours ago',
            features: ['Transactional Email', 'Marketing Campaigns', 'Analytics'],
        },
        {
            id: 'cloudinary',
            name: 'Cloudinary',
            type: 'Media Storage',
            status: 'active',
            apiKey: 'xxxxx...xxxxx',
            successRate: 99.9,
            avgResponseTime: 120,
            requestsToday: 456,
            lastChecked: '1 min ago',
            features: ['Image Upload', 'Video Hosting', 'Transformations', 'CDN'],
        },
    ];

    const filteredProviders = providers.filter((provider) =>
        provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'inactive':
                return 'bg-slate-50 text-slate-600 border-slate-200';
            case 'error':
                return 'bg-red-50 text-red-600 border-red-200';
            default:
                return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    const getProviderIcon = (type: string) => {
        switch (type) {
            case 'Payment Gateway':
                return 'solar:card-bold';
            case 'SMS Provider':
                return 'solar:chat-round-bold';
            case 'Email Provider':
                return 'solar:letter-bold';
            case 'Media Storage':
                return 'solar:cloud-bold';
            default:
                return 'solar:server-bold';
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">
                        Service Providers
                    </h1>
                    <p className="text-slate-600">
                        Manage API providers, monitor status, and configure integrations
                    </p>
                </div>

                <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300">
                    <Icon icon="solar:add-circle-bold" width="20" />
                    <span>Add Provider</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="relative">
                    <Icon
                        icon="solar:magnifer-linear"
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        width="20"
                    />
                    <input
                        type="text"
                        placeholder="Search providers by name or type..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                </div>
            </div>

            {/* Provider Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProviders.map((provider) => (
                    <div
                        key={provider.id}
                        className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
                                        <Icon icon={getProviderIcon(provider.type)} width="24" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900">
                                            {provider.name}
                                        </h3>
                                        <p className="text-xs text-slate-500">{provider.type}</p>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${getStatusColor(
                                        provider.status
                                    )}`}
                                >
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full ${provider.status === 'active'
                                                ? 'bg-emerald-600'
                                                : provider.status === 'error'
                                                    ? 'bg-red-600'
                                                    : 'bg-slate-600'
                                            }`}
                                    />
                                    {provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
                                </span>
                            </div>

                            {/* API Key */}
                            <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg">
                                <Icon icon="solar:key-bold" width="16" className="text-slate-500" />
                                <span className="text-xs font-mono text-slate-600 flex-1">
                                    {provider.apiKey}
                                </span>
                                <button className="p-1 hover:bg-slate-200 rounded transition-colors">
                                    <Icon icon="solar:copy-bold" width="16" className="text-slate-500" />
                                </button>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-emerald-50 rounded-lg">
                                    <p className="text-xs text-emerald-600 font-semibold mb-1">
                                        Success Rate
                                    </p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {provider.successRate}%
                                    </p>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <p className="text-xs text-blue-600 font-semibold mb-1">
                                        Response Time
                                    </p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {provider.avgResponseTime}ms
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                <div>
                                    <p className="text-xs text-purple-600 font-semibold">Requests Today</p>
                                    <p className="text-xl font-bold text-slate-900">
                                        {provider.requestsToday.toLocaleString()}
                                    </p>
                                </div>
                                <Icon icon="solar:chart-2-bold" width="32" className="text-purple-300" />
                            </div>

                            {/* Last Checked */}
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Icon icon="solar:clock-circle-linear" width="14" />
                                <span>Last checked: {provider.lastChecked}</span>
                            </div>

                            {/* Features */}
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Features:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {provider.features.map((feature, index) => (
                                        <span
                                            key={index}
                                            className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium"
                                        >
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors font-semibold text-sm">
                                    <Icon icon="solar:settings-bold" width="16" />
                                    <span>Configure</span>
                                </button>
                                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-semibold text-sm">
                                    <Icon icon="solar:chart-bold" width="16" />
                                    <span>Analytics</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredProviders.length === 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                        <Icon icon="solar:server-bold" width="40" className="text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No providers found</h3>
                    <p className="text-slate-600">
                        Try adjusting your search query
                    </p>
                </div>
            )}
        </div>
    );
};

export default Providers;
