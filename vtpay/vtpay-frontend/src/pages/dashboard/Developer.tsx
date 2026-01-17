import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
    Copy,
    RefreshCw,
    Eye,
    EyeOff,
    Code,
    ExternalLink,
    Check,
    Terminal,
    ShieldCheck,
    BookOpen,
    Zap,
    AlertTriangle,
    Webhook,
    Save,
    Loader2
} from 'lucide-react';

export const Developer: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [showKey, setShowKey] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [zainbox, setZainbox] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<any>(null);

    const [copied, setCopied] = useState(false);

    // Webhook State
    const [webhookUrl, setWebhookUrl] = useState<string>('');
    const [isEditingWebhook, setIsEditingWebhook] = useState(false);
    const [isSavingWebhook, setIsSavingWebhook] = useState(false);
    const [webhookError, setWebhookError] = useState<string>('');
    const [webhookSuccess, setWebhookSuccess] = useState<string>('');

    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            await Promise.all([
                fetchUserProfile(),
                fetchZainbox(),
                fetchApiKey(),
                fetchApiKey(),
                fetchWebhookUrl()
            ]);
            setIsLoading(false);
        };
        init();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const response = await api.get('/auth/profile');
            setUserProfile(response.data.data);
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const fetchZainbox = async () => {
        try {
            const response = await api.get('/zainbox');
            if (response.data.success && response.data.data?.length > 0) {
                setZainbox(response.data.data[0]);
            }
        } catch (error) {
            console.error('Error fetching zainbox:', error);
        }
    };

    const fetchApiKey = async () => {
        try {
            const response = await api.get('/developer/apikey');
            setApiKey(response.data.data.apiKey);
        } catch (error) {
            console.error('Error fetching API key:', error);
        }
    };



    const fetchWebhookUrl = async () => {
        try {
            const response = await api.get('/developer/webhook');
            if (response.data.success && response.data.data.webhookUrl) {
                setWebhookUrl(response.data.data.webhookUrl);
            }
        } catch (error) {
            console.error('Error fetching webhook URL:', error);
        }
    };

    const handleSaveWebhook = async () => {
        setWebhookError('');
        setWebhookSuccess('');

        // Validate webhook URL if provided
        if (webhookUrl && webhookUrl.trim()) {
            try {
                new URL(webhookUrl);
            } catch (error) {
                setWebhookError('Please enter a valid URL');
                return;
            }
        }

        setIsSavingWebhook(true);
        try {
            const response = await api.put('/developer/webhook', {
                webhookUrl: webhookUrl.trim() || null
            });

            if (response.data.success) {
                setWebhookSuccess(response.data.message);
                setIsEditingWebhook(false);
                setTimeout(() => setWebhookSuccess(''), 3000);
            }
        } catch (error: any) {
            console.error('Error saving webhook:', error);
            setWebhookError(error.response?.data?.message || 'Failed to save webhook URL');
        } finally {
            setIsSavingWebhook(false);
        }
    };

    const handleGenerateKey = async () => {
        if (apiKey && !window.confirm('Are you sure you want to regenerate your API key? The old key will stop working immediately.')) {
            return;
        }

        setIsGenerating(true);
        try {
            const response = await api.post('/developer/apikey');
            setApiKey(response.data.data.apiKey);
            setShowKey(true);
        } catch (error) {
            console.error('Error generating API key:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };



    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={40} className="text-green-600 animate-spin" />
                    <p className="text-gray-600 font-medium">Loading developer tools...</p>
                </div>
            </div>
        );
    }

    // If no Zainbox, show initialization UI
    if (!zainbox) {
        return (
            <div className="max-w-2xl mx-auto py-12 animate-fade-in">
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="h-2 bg-green-600"></div>
                    <div className="p-8 text-center">
                        <div className="w-20 h-20 bg-green-50 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Code size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Initialize Developer Account</h2>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            To start using our API and creating virtual accounts, you need to initialize your developer workspace (Zainbox).
                        </p>

                        {userProfile?.kycLevel < 3 ? (
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-left mb-8 flex items-start gap-3">
                                <div className="p-2 bg-amber-100 rounded-full text-amber-600 flex-shrink-0">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-amber-900">KYC Approval Required</h4>
                                    <p className="text-xs text-amber-800 mt-1">
                                        You must have your KYC approved before your developer workspace can be activated.
                                        Please complete your verification in the <Link to="/dashboard/verification" className="font-bold underline">Verification</Link> section.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 mb-8">
                                <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-left flex items-start gap-3">
                                    <div className="p-2 bg-green-100 rounded-full text-green-600 flex-shrink-0">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-green-900">Account Approved</h4>
                                        <p className="text-xs text-green-800 mt-1">
                                            Your account is verified. Our team is currently setting up your developer workspace. This usually happens automatically within a few minutes of approval.
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-left">
                                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Developer Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Full Name</p>
                                            <p className="text-sm font-medium text-gray-900">{userProfile?.firstName} {userProfile?.lastName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Email Address</p>
                                            <p className="text-sm font-medium text-gray-900">{userProfile?.email}</p>
                                        </div>
                                        {userProfile?.businessName && (
                                            <div className="col-span-2">
                                                <p className="text-[10px] text-gray-500 uppercase font-bold">Business Name</p>
                                                <p className="text-sm font-medium text-gray-900">{userProfile?.businessName}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 text-center">
                                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
                                    <h4 className="font-bold text-blue-900">Workspace Setup in Progress</h4>
                                    <p className="text-sm text-blue-700 mt-2">
                                        We are finalizing your API keys and dedicated Zainbox. Please check back in a moment or refresh the page.
                                    </p>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="mt-4 px-4 py-2 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-bold transition-all"
                                    >
                                        Refresh Status
                                    </button>
                                </div>
                            </div>
                        )}

                        <p className="text-xs text-gray-400 mt-6">
                            Developer access is subject to our <Link to="/terms" className="text-green-600 hover:underline">Terms of Service</Link>.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-[1400px] animate-fade-in p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Developer Tools</h1>
                    <p className="text-sm text-gray-500 mt-1">Integrate VTPay into your applications with our robust API</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/api-docs"
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 text-sm font-bold shadow-sm"
                    >
                        <BookOpen className="w-4 h-4" />
                        API Documentation
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* API Key Section */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
                                    <Terminal className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">API Keys</h3>
                                    <p className="text-xs text-gray-500">Your secret keys for authenticating requests</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Secret Key</label>
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${apiKey?.startsWith('sk_live_') ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {apiKey?.startsWith('sk_live_') ? 'Live Mode' : 'Test Mode'}
                                    </span>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-1 relative group">
                                        <input
                                            type={showKey ? "text" : "password"}
                                            value={apiKey || ''}
                                            readOnly
                                            className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                                            placeholder="No API key generated"
                                        />
                                        <button
                                            onClick={() => setShowKey(!showKey)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-all"
                                        >
                                            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => apiKey && copyToClipboard(apiKey)}
                                            disabled={!apiKey}
                                            className="px-4 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition-all"
                                            title="Copy Key"
                                        >
                                            {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                                        </button>
                                        <button
                                            onClick={handleGenerateKey}
                                            disabled={isGenerating}
                                            className="px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold transition-all shadow-lg shadow-gray-200 flex items-center gap-2"
                                        >
                                            <RefreshCw size={18} className={isGenerating ? "animate-spin" : ""} />
                                            {apiKey ? 'Regenerate' : 'Generate Key'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                                <div className="p-1.5 bg-amber-100 rounded-full text-amber-600 flex-shrink-0 mt-0.5">
                                    <AlertTriangle size={16} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-amber-900">Security Warning</h4>
                                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                                        Keep your secret keys safe. Do not share them in public repositories or client-side code. If you suspect a key has been compromised, regenerate it immediately.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Webhook Configuration Section */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-purple-100">
                                    <Webhook className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">Webhook Configuration</h3>
                                    <p className="text-xs text-gray-500">Receive real-time payment notifications</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            {webhookSuccess && (
                                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 animate-fade-in">
                                    <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-green-800 font-medium">{webhookSuccess}</p>
                                </div>
                            )}

                            {webhookError && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-fade-in">
                                    <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-800 font-medium">{webhookError}</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Webhook URL</label>
                                    {!isEditingWebhook && webhookUrl && (
                                        <button
                                            onClick={() => setIsEditingWebhook(true)}
                                            className="text-xs text-purple-600 hover:text-purple-700 font-bold transition-colors"
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-col gap-3">
                                    <input
                                        type="url"
                                        value={webhookUrl}
                                        onChange={(e) => setWebhookUrl(e.target.value)}
                                        disabled={!isEditingWebhook && !!webhookUrl}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                        placeholder="https://your-domain.com/webhooks/vtpay"
                                    />

                                    {(isEditingWebhook || !webhookUrl) && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSaveWebhook}
                                                disabled={isSavingWebhook}
                                                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
                                            >
                                                {isSavingWebhook ? (
                                                    <>
                                                        <Loader2 size={18} className="animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save size={18} />
                                                        Save Webhook
                                                    </>
                                                )}
                                            </button>
                                            {webhookUrl && (
                                                <button
                                                    onClick={() => {
                                                        setIsEditingWebhook(false);
                                                        fetchWebhookUrl();
                                                        setWebhookError('');
                                                    }}
                                                    className="px-6 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold transition-all"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 bg-purple-50 rounded-xl p-4 border border-purple-100">
                                <div className="flex items-start gap-3">
                                    <Code className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-xs text-purple-900 space-y-2">
                                        <p className="font-bold">What are webhooks?</p>
                                        <p className="leading-relaxed text-purple-800">
                                            Webhooks allow VTPay to send real-time notifications to your server when events occur, such as successful payments or virtual account credits. Configure your endpoint URL above to start receiving these notifications.
                                        </p>
                                        <p className="font-medium text-purple-800">
                                            Events sent: <span className="font-mono bg-purple-100 px-1 rounded text-purple-700">payment.successful</span>, <span className="font-mono bg-purple-100 px-1 rounded text-purple-700">payment.failed</span>, <span className="font-mono bg-purple-100 px-1 rounded text-purple-700">account.credited</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Start Card */}
                    <div className="bg-gray-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl shadow-gray-200">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <Zap size={120} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                                <Zap className="text-yellow-400" size={20} />
                                Quick Start
                            </h3>
                            <div className="space-y-5">
                                <div className="flex gap-3">
                                    <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                                    <p className="text-xs text-gray-300 leading-relaxed">Generate your API keys from the configuration panel.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                                    <p className="text-xs text-gray-300 leading-relaxed">Use the Secret Key in your Authorization header: <code className="bg-black/30 px-1.5 py-0.5 rounded font-mono text-yellow-400">Bearer sk_...</code></p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                                    <p className="text-xs text-gray-300 leading-relaxed">Start creating virtual accounts and receiving payments.</p>
                                </div>
                            </div>
                            <Link
                                to="/api-docs"
                                className="mt-8 w-full py-3 bg-white text-gray-900 text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-all"
                            >
                                Read Full Documentation
                                <ExternalLink size={14} />
                            </Link>
                        </div>
                    </div>

                    {/* Security Badge */}
                    <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                        <div className="flex items-start gap-3">
                            <ShieldCheck className="w-6 h-6 text-blue-600 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-blue-900">Enterprise Security</h4>
                                <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                                    Our API uses industry-standard AES-256 encryption. All requests are monitored for suspicious activity.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payout Modal */}

        </div>
    );
};
