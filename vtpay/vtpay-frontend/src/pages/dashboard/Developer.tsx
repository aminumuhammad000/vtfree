import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Copy, RefreshCw, Eye, EyeOff, Code, ExternalLink } from 'lucide-react';

export const Developer: React.FC = () => {
    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<any>(null);
    const [payoutAmount, setPayoutAmount] = useState('');
    const [destinationBank, setDestinationBank] = useState('');
    const [destinationAccount, setDestinationAccount] = useState('');
    const [payoutNarration, setPayoutNarration] = useState('');
    const [isProcessingPayout, setIsProcessingPayout] = useState(false);
    const [availableBalance, setAvailableBalance] = useState<number | null>(null);

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
            setShowKey(true); // Show the new key immediately
        } catch (error) {
            console.error('Error generating API key:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add toast notification here
    };

    const openPayoutModal = async (account: any) => {
        setSelectedAccount(account);
        setIsPayoutModalOpen(true);
        setAvailableBalance(null); // Reset balance

        // Fetch balance for this reference
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
                amount: parseFloat(payoutAmount), // Assuming API handles conversion if needed, or send as is
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

            // Refresh balance
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
            <div className="loading-container">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header-main">
                <h1 className="page-title">Developer Settings</h1>
            </div>

            <div className="grid gap-8">
                {/* API Key Section */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                            <Code size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">API Configuration</h2>
                            <p className="text-sm text-gray-500">Manage your API keys for integration</p>
                        </div>
                    </div>

                    <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Secret Key
                        </label>
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <input
                                    type={showKey ? "text" : "password"}
                                    value={apiKey || ''}
                                    readOnly
                                    className="w-full pl-4 pr-24 py-3 border border-gray-200 rounded-xl bg-white font-mono text-sm text-gray-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                    placeholder="No API key generated"
                                />
                                {apiKey && (
                                    <div className="absolute right-12 top-1/2 -translate-y-1/2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide uppercase ${apiKey.startsWith('sk_live_')
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-orange-100 text-orange-700'
                                            }`}>
                                            {apiKey.startsWith('sk_live_') ? 'LIVE' : 'TEST'}
                                        </span>
                                    </div>
                                )}
                                {apiKey && (
                                    <button
                                        onClick={() => setShowKey(!showKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                    >
                                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                )}
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => apiKey && copyToClipboard(apiKey)}
                                disabled={!apiKey}
                                title="Copy Key"
                                className="bg-white hover:bg-emerald-50 hover:text-emerald-600 border-gray-200"
                            >
                                <Copy size={18} />
                            </Button>
                            <Button
                                onClick={handleGenerateKey}
                                isLoading={isGenerating}
                                leftIcon={<RefreshCw size={18} />}
                                className="shadow-lg shadow-emerald-500/20"
                            >
                                {apiKey ? 'Regenerate' : 'Generate Key'}
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                            Keep this key secret. Do not share it in client-side code or public repositories.
                        </p>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-white rounded-xl text-emerald-600 shadow-sm border border-emerald-100">
                                <ExternalLink size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-emerald-900">API Documentation</h3>
                                <p className="text-sm text-emerald-700/80">Read our guide to integrate VTPay into your application.</p>
                            </div>
                        </div>
                        <Button variant="ghost" className="text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800">
                            View Docs
                        </Button>
                    </div>
                </div>

                {/* Generated Accounts List */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900">Generated Virtual Accounts</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Account Name</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bank</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Account Number</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {accounts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            No virtual accounts generated yet.
                                        </td>
                                    </tr>
                                ) : (
                                    accounts.map((account) => (
                                        <tr key={account.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{account.alias || account.accountName}</div>
                                                {account.alias && <div className="text-xs text-gray-500 mt-0.5">{account.accountName}</div>}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 font-mono bg-gray-50/50 rounded-lg">{account.reference || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{account.bankName}</td>
                                            <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900">{account.accountNumber}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                    ${account.status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                        : 'bg-gray-50 text-gray-600 border border-gray-100'
                                                    }`}>
                                                    {account.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {account.reference && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openPayoutModal(account)}
                                                        className="hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                                                    >
                                                        Payout
                                                    </Button>
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

            {/* Payout Modal */}
            {isPayoutModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">Initiate Payout</h3>
                            <button
                                onClick={() => setIsPayoutModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <span className="sr-only">Close</span>
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-1">Available Balance</p>
                                <p className="text-3xl font-bold text-emerald-900 tracking-tight">
                                    {availableBalance !== null
                                        ? `₦${(availableBalance / 100).toLocaleString()}`
                                        : 'Loading...'}
                                </p>
                                <p className="text-xs text-emerald-600/80 mt-1 font-mono">Ref: {selectedAccount?.reference}</p>
                            </div>

                            <form onSubmit={handlePayout} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (Kobo)</label>
                                    <input
                                        type="number"
                                        required
                                        value={payoutAmount}
                                        onChange={(e) => setPayoutAmount(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                        placeholder="e.g. 5000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Destination Bank Code</label>
                                    <input
                                        type="text"
                                        required
                                        value={destinationBank}
                                        onChange={(e) => setDestinationBank(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                        placeholder="e.g. 058"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Number</label>
                                    <input
                                        type="text"
                                        required
                                        value={destinationAccount}
                                        onChange={(e) => setDestinationAccount(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                        placeholder="e.g. 0123456789"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Narration</label>
                                    <input
                                        type="text"
                                        value={payoutNarration}
                                        onChange={(e) => setPayoutNarration(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                        placeholder="Optional"
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setIsPayoutModalOpen(false)}
                                        className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        isLoading={isProcessingPayout}
                                        className="flex-1 shadow-lg shadow-emerald-500/20"
                                    >
                                        Confirm Payout
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
