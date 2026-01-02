import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Copy, RefreshCw, Eye, EyeOff, Code, ExternalLink, X, Check } from 'lucide-react';

export const Developer: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [showKey, setShowKey] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);
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
        fetchApiKey();
        fetchAccounts();
    }, []);

    const fetchApiKey = async () => {
        try {
            const response = await api.get('/developer/apikey');
            setApiKey(response.data.data.apiKey);
        } catch (error) {
            console.error('Error fetching API key:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAccounts = async () => {
        try {
            const response = await api.get('/virtual-accounts');
            setAccounts(response.data.data);
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
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Developer Settings</h1>
                <p className="text-slate-500">Manage your API keys and integrations</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* API Key Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Code size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">API Configuration</h2>
                                <p className="text-sm text-slate-500">Manage your API keys for integration</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-slate-700">Secret Key</label>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 relative">
                                    <input
                                        type={showKey ? "text" : "password"}
                                        value={apiKey || ''}
                                        readOnly
                                        className="w-full pl-4 pr-24 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 font-mono text-sm focus:outline-none"
                                        placeholder="No API key generated"
                                    />
                                    {apiKey && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${apiKey.startsWith('sk_live_') ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {apiKey.startsWith('sk_live_') ? 'LIVE' : 'TEST'}
                                            </span>
                                            <button
                                                onClick={() => setShowKey(!showKey)}
                                                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => apiKey && copyToClipboard(apiKey)}
                                        disabled={!apiKey}
                                        className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50"
                                        title="Copy Key"
                                    >
                                        {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                                    </button>
                                    <button
                                        onClick={handleGenerateKey}
                                        disabled={isGenerating}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm font-medium disabled:opacity-50"
                                    >
                                        <RefreshCw size={18} className={isGenerating ? "animate-spin" : ""} />
                                        {apiKey ? 'Regenerate' : 'Generate Key'}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                                <span className="mt-0.5 block w-2 h-2 bg-yellow-400 rounded-full"></span>
                                <p>Keep this key secret. Do not share it in client-side code or public repositories.</p>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                                    <ExternalLink size={18} />
                                </div>
                                <div>
                                    <h3 className="font-medium text-slate-900">API Documentation</h3>
                                    <p className="text-sm text-slate-500">Read our guide to integrate VTPay.</p>
                                </div>
                            </div>
                            <Link to="/api-docs" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
                                View Docs
                            </Link>
                        </div>
                    </div>

                    {/* Generated Accounts List */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                            <h2 className="font-semibold text-slate-900">Generated Virtual Accounts</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3">Account Name</th>
                                        <th className="px-6 py-3">Reference</th>
                                        <th className="px-6 py-3">Bank</th>
                                        <th className="px-6 py-3">Account Number</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {accounts.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                                No virtual accounts generated yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        accounts.map((account) => (
                                            <tr key={account.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-900">{account.alias || account.accountName}</div>
                                                    {account.alias && (
                                                        <div className="text-xs text-slate-500">{account.accountName}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                                    {account.reference || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">{account.bankName}</td>
                                                <td className="px-6 py-4 font-mono font-medium text-slate-900">{account.accountNumber}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {account.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {account.reference && (
                                                        <button
                                                            onClick={() => openPayoutModal(account)}
                                                            className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                                        >
                                                            Payout
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar / Info */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white shadow-lg">
                        <h3 className="font-bold text-lg mb-2">Integration Guide</h3>
                        <p className="text-slate-300 text-sm mb-4">Follow these steps to integrate VTPay into your application:</p>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
                            <li>Generate your API keys</li>
                            <li>Install our SDK or use REST API</li>
                            <li>Authenticate your requests</li>
                            <li>Create virtual accounts</li>
                            <li>Listen for webhooks</li>
                        </ol>
                    </div>
                </div>
            </div>

            {/* Payout Modal */}
            {isPayoutModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-slate-900">Initiate Payout</h3>
                            <button
                                onClick={() => setIsPayoutModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-6 bg-slate-50 rounded-lg p-4 border border-slate-200 flex justify-between items-center">
                                <span className="text-sm text-slate-500 font-medium">Available Balance</span>
                                <div className="text-right">
                                    <span className="block text-lg font-bold text-slate-900">
                                        {availableBalance !== null
                                            ? `₦${(availableBalance / 100).toLocaleString()}`
                                            : 'Loading...'}
                                    </span>
                                    <span className="text-xs text-slate-400 font-mono">Ref: {selectedAccount?.reference}</span>
                                </div>
                            </div>

                            <form onSubmit={handlePayout} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount (Kobo)</label>
                                    <input
                                        type="number"
                                        required
                                        value={payoutAmount}
                                        onChange={(e) => setPayoutAmount(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                        placeholder="e.g. 5000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Destination Bank Code</label>
                                    <input
                                        type="text"
                                        required
                                        value={destinationBank}
                                        onChange={(e) => setDestinationBank(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                        placeholder="e.g. 058"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
                                    <input
                                        type="text"
                                        required
                                        value={destinationAccount}
                                        onChange={(e) => setDestinationAccount(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                        placeholder="e.g. 0123456789"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Narration</label>
                                    <input
                                        type="text"
                                        value={payoutNarration}
                                        onChange={(e) => setPayoutNarration(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Optional"
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                                        onClick={() => setIsPayoutModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isProcessingPayout}
                                        className="flex-1 px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isProcessingPayout ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Processing...
                                            </>
                                        ) : 'Confirm Payout'}
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
