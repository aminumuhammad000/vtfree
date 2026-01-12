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
    X,
    Check,
    Terminal,
    ShieldCheck,
    BookOpen,
    Zap,
    ArrowRight,
    AlertTriangle,
    Wallet,
    Banknote
} from 'lucide-react';

export const Developer: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [showKey, setShowKey] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [zainbox, setZainbox] = useState<any>(null);
    const [isInitializing, setIsInitializing] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);

    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<any>(null);
    const [payoutAmount, setPayoutAmount] = useState('');
    const [destinationBank, setDestinationBank] = useState('');
    const [destinationAccount, setDestinationAccount] = useState('');
    const [payoutNarration, setPayoutNarration] = useState('');
    const [isProcessingPayout, setIsProcessingPayout] = useState(false);
    const [availableBalance, setAvailableBalance] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            await Promise.all([
                fetchUserProfile(),
                fetchZainbox(),
                fetchApiKey(),
                fetchAccounts()
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

    const fetchAccounts = async () => {
        try {
            const response = await api.get('/virtual-accounts');
            setAccounts(response.data.data || []);
        } catch (error) {
            console.error('Error fetching accounts:', error);
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

    const openPayoutModal = async (account: any) => {
        setSelectedAccount(account);
        setIsPayoutModalOpen(true);
        setAvailableBalance(null);

        if (account.reference) {
            try {
                const response = await api.get(`/payout/balance/${account.reference}`);
                setAvailableBalance(response.data.data.balance);
            } catch (error) {
                console.error('Error fetching balance:', error);
            }
        }
    };

    const handlePayout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAccount || !payoutAmount || !destinationBank || !destinationAccount) return;

        setIsProcessingPayout(true);
        try {
            await api.post('/payout', {
                amount: parseFloat(payoutAmount),
                reference: selectedAccount.reference,
                destinationBankCode: destinationBank,
                destinationAccountNumber: destinationAccount,
                narration: payoutNarration
            });

            alert('Payout initiated successfully!');
            setIsPayoutModalOpen(false);
            setPayoutAmount('');
            setDestinationBank('');
            setDestinationAccount('');
            setPayoutNarration('');

            if (selectedAccount.reference) {
                const response = await api.get(`/payout/balance/${selectedAccount.reference}`);
                setAvailableBalance(response.data.data.balance);
            }
        } catch (error: any) {
            console.error('Payout error:', error);
            alert(error.response?.data?.message || 'Failed to initiate payout');
        } finally {
            setIsProcessingPayout(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="spinner"></div>
                    <p className="text-body font-medium">Loading developer tools...</p>
                </div>
            </div>
        );
    }

    // If no Zainbox, show initialization UI
    if (!zainbox) {
        return (
            <div className="max-w-2xl mx-auto py-12 animate-fade-in">
                <div className="dev-card overflow-hidden">
                    <div className="h-2 bg-primary"></div>
                    <div className="p-8 text-center">
                        <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Code size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-heading mb-3">Initialize Developer Account</h2>
                        <p className="text-body mb-8 max-w-md mx-auto">
                            To start using our API and creating virtual accounts, you need to initialize your developer workspace (Zainbox).
                        </p>

                        {userProfile?.kycLevel < 3 ? (
                            <div className="alert alert-warning text-left mb-8">
                                <div className="alert-icon">
                                    <AlertTriangle size={20} />
                                </div>
                                <div className="alert-content">
                                    <h4 className="font-bold">KYC Approval Required</h4>
                                    <p className="text-xs">
                                        You must have your KYC approved before your developer workspace can be activated.
                                        Please complete your verification in the <Link to="/dashboard/verification" className="font-bold underline">Verification</Link> section.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 mb-8">
                                <div className="alert alert-success text-left">
                                    <div className="alert-icon">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div className="alert-content">
                                        <h4 className="font-bold">Account Approved</h4>
                                        <p className="text-xs">
                                            Your account is verified. Our team is currently setting up your developer workspace. This usually happens automatically within a few minutes of approval.
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-left">
                                    <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Developer Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold">Full Name</p>
                                            <p className="text-sm font-medium text-slate-900">{userProfile?.firstName} {userProfile?.lastName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold">Email Address</p>
                                            <p className="text-sm font-medium text-slate-900">{userProfile?.email}</p>
                                        </div>
                                        {userProfile?.businessName && (
                                            <div className="col-span-2">
                                                <p className="text-[10px] text-slate-500 uppercase font-bold">Business Name</p>
                                                <p className="text-sm font-medium text-slate-900">{userProfile?.businessName}</p>
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
                                        className="mt-4 btn btn-outline btn-sm border-blue-200 text-blue-700 hover:bg-blue-100"
                                    >
                                        Refresh Status
                                    </button>
                                </div>
                            </div>
                        )}

                        <p className="text-caption mt-6">
                            Developer access is subject to our <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-[1400px] animate-fade-in">
            {/* Header */}
            <div className="dev-header">
                <div>
                    <h1 className="text-heading">Developer Tools</h1>
                    <p className="text-body mt-1">Integrate VTPay into your applications with our robust API</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/api-docs"
                        className="btn btn-secondary"
                    >
                        <BookOpen className="w-4 h-4" />
                        API Documentation
                    </Link>
                </div>
            </div>

            <div className="dev-grid">
                <div className="dev-main-col">
                    {/* API Key Section */}
                    <div className="dev-card">
                        <div className="dev-card-header">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
                                    <Terminal className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-subheading">API Keys</h3>
                                    <p className="text-xs text-muted">Your secret keys for authenticating requests</p>
                                </div>
                            </div>
                        </div>

                        <div className="dev-card-body">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="form-label text-xs uppercase tracking-wider text-muted">Secret Key</label>
                                    <span className={`badge ${apiKey?.startsWith('sk_live_') ? 'badge-success' : 'badge-warning'}`}>
                                        {apiKey?.startsWith('sk_live_') ? 'Live Mode' : 'Test Mode'}
                                    </span>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-1 relative group">
                                        <input
                                            type={showKey ? "text" : "password"}
                                            value={apiKey || ''}
                                            readOnly
                                            className="form-input pr-12 font-mono text-gray-600"
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
                                            className="btn btn-outline px-4"
                                            title="Copy Key"
                                        >
                                            {copied ? <Check size={18} className="text-success" /> : <Copy size={18} />}
                                        </button>
                                        <button
                                            onClick={handleGenerateKey}
                                            disabled={isGenerating}
                                            className="btn btn-primary bg-gray-900 hover:bg-gray-800 shadow-gray-200"
                                        >
                                            <RefreshCw size={18} className={isGenerating ? "animate-spin" : ""} />
                                            {apiKey ? 'Regenerate' : 'Generate Key'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="alert alert-warning">
                                <div className="alert-icon">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div className="alert-content">
                                    <h4>Security Warning</h4>
                                    <p>
                                        Keep your secret keys safe. Do not share them in public repositories or client-side code. If you suspect a key has been compromised, regenerate it immediately.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>


                </div>

                {/* Sidebar */}
                <div className="dev-sidebar">
                    {/* Quick Start Card */}
                    <div className="quick-start-card">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Zap size={80} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Zap className="text-yellow-400" size={20} />
                                Quick Start
                            </h3>
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                                    <p className="text-xs text-gray-300 leading-relaxed">Generate your API keys from the configuration panel.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                                    <p className="text-xs text-gray-300 leading-relaxed">Use the Secret Key in your Authorization header: <code className="bg-black/30 px-1 rounded">Bearer sk_...</code></p>
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
                    <div className="security-badge">
                        <ShieldCheck className="w-6 h-6 text-blue-600 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-blue-900">Enterprise Security</h4>
                            <p className="text-[11px] text-blue-800 mt-1 leading-relaxed">
                                Our API uses industry-standard AES-256 encryption. All requests are monitored for suspicious activity.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payout Modal */}
            {isPayoutModalOpen && (
                <div className="dev-modal-overlay animate-fade-in">
                    <div className="dev-modal-content animate-scale-up">
                        <div className="dev-modal-header">
                            <div>
                                <h3 className="text-lg font-bold text-heading">Initiate Payout</h3>
                                <p className="text-xs text-muted mt-0.5">Transfer funds from virtual account</p>
                            </div>
                            <button
                                onClick={() => setIsPayoutModalOpen(false)}
                                className="text-muted hover:text-heading transition-all p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="dev-modal-body">
                            <div className="mb-6 bg-green-50 border border-green-100 rounded-2xl p-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-green-600 shadow-sm">
                                        <Wallet size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-green-700 font-bold uppercase tracking-wider">Available Balance</p>
                                        <p className="text-2xl font-bold text-green-900">
                                            {availableBalance !== null
                                                ? `₦${(availableBalance / 100).toLocaleString()}`
                                                : '---'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handlePayout} className="space-y-5">
                                <div className="form-group">
                                    <label className="form-label text-xs uppercase tracking-wider text-muted">Amount (Kobo)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">K</span>
                                        <input
                                            type="number"
                                            required
                                            value={payoutAmount}
                                            onChange={(e) => setPayoutAmount(e.target.value)}
                                            className="form-input pl-9 font-bold"
                                            placeholder="e.g. 500000"
                                        />
                                    </div>
                                    <p className="text-caption mt-1.5">Note: 100 Kobo = 1 Naira</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label text-xs uppercase tracking-wider text-muted">Bank Code</label>
                                        <input
                                            type="text"
                                            required
                                            value={destinationBank}
                                            onChange={(e) => setDestinationBank(e.target.value)}
                                            className="form-input"
                                            placeholder="e.g. 058"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label text-xs uppercase tracking-wider text-muted">Account Number</label>
                                        <input
                                            type="text"
                                            required
                                            value={destinationAccount}
                                            onChange={(e) => setDestinationAccount(e.target.value)}
                                            className="form-input"
                                            placeholder="0123456789"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label text-xs uppercase tracking-wider text-muted">Narration</label>
                                    <input
                                        type="text"
                                        value={payoutNarration}
                                        onChange={(e) => setPayoutNarration(e.target.value)}
                                        className="form-input"
                                        placeholder="Optional description"
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        className="btn btn-outline flex-1"
                                        onClick={() => setIsPayoutModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isProcessingPayout}
                                        className="btn btn-primary flex-1 justify-center shadow-lg shadow-green-100"
                                    >
                                        {isProcessingPayout ? (
                                            <>
                                                <div className="spinner"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Confirm Payout
                                                <Banknote size={18} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
