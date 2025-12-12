import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Copy, RefreshCw, Eye, EyeOff, Code, ExternalLink, X } from 'lucide-react';

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
            <div className="loading-container">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header-main">
                <div>
                    <h1 className="page-title">Developer Settings</h1>
                    <p className="page-subtitle">Manage your API keys and integrations</p>
                </div>
            </div>

            <div className="dev-grid">
                {/* API Key Section */}
                <div className="dev-card">
                    <div className="dev-card-header">
                        <div className="dev-card-icon">
                            <Code size={24} />
                        </div>
                        <div className="dev-card-title">
                            <h2>API Configuration</h2>
                            <p>Manage your API keys for integration</p>
                        </div>
                    </div>

                    <div className="api-key-section">
                        <label className="api-key-label">Secret Key</label>
                        <div className="api-key-input-row">
                            <div className="api-key-input-wrapper">
                                <input
                                    type={showKey ? "text" : "password"}
                                    value={apiKey || ''}
                                    readOnly
                                    className="api-key-input"
                                    placeholder="No API key generated"
                                />
                                {apiKey && (
                                    <span className={`api-key-mode-badge ${apiKey.startsWith('sk_live_') ? 'live' : 'test'}`}>
                                        {apiKey.startsWith('sk_live_') ? 'LIVE' : 'TEST'}
                                    </span>
                                )}
                                {apiKey && (
                                    <button
                                        onClick={() => setShowKey(!showKey)}
                                        className="api-key-toggle-btn"
                                    >
                                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => apiKey && copyToClipboard(apiKey)}
                                disabled={!apiKey}
                                className="btn btn-outline icon-btn"
                                title="Copy Key"
                            >
                                <Copy size={18} />
                            </button>
                            <Button
                                onClick={handleGenerateKey}
                                isLoading={isGenerating}
                                leftIcon={<RefreshCw size={18} />}
                            >
                                {apiKey ? 'Regenerate' : 'Generate Key'}
                            </Button>
                        </div>
                        <p className="api-key-warning">
                            <span className="warning-dot"></span>
                            Keep this key secret. Do not share it in client-side code or public repositories.
                        </p>
                    </div>

                    <div className="dev-docs-link">
                        <div className="dev-docs-icon">
                            <ExternalLink size={20} />
                        </div>
                        <div className="dev-docs-text">
                            <h3>API Documentation</h3>
                            <p>Read our guide to integrate VTPay into your application.</p>
                        </div>
                        <Link to="/api-docs" className="btn btn-ghost">View Docs</Link>
                    </div>
                </div>

                {/* Generated Accounts List */}
                <div className="dev-card">
                    <div className="dev-card-header-simple">
                        <h2>Generated Virtual Accounts</h2>
                    </div>
                    <div className="dev-table-wrapper">
                        <table className="dev-table">
                            <thead>
                                <tr>
                                    <th>Account Name</th>
                                    <th>Reference</th>
                                    <th>Bank</th>
                                    <th>Account Number</th>
                                    <th>Status</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="dev-table-empty">
                                            No virtual accounts generated yet.
                                        </td>
                                    </tr>
                                ) : (
                                    accounts.map((account) => (
                                        <tr key={account.id}>
                                            <td>
                                                <div className="dev-account-name">
                                                    {account.alias || account.accountName}
                                                </div>
                                                {account.alias && (
                                                    <div className="dev-account-subname">{account.accountName}</div>
                                                )}
                                            </td>
                                            <td>
                                                <span className="dev-ref">{account.reference || '-'}</span>
                                            </td>
                                            <td>{account.bankName}</td>
                                            <td className="dev-account-number">{account.accountNumber}</td>
                                            <td>
                                                <span className={`dev-status-badge ${account.status}`}>
                                                    {account.status}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                {account.reference && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openPayoutModal(account)}
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
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Initiate Payout</h3>
                            <button
                                onClick={() => setIsPayoutModalOpen(false)}
                                className="modal-close-btn"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="payout-balance-card">
                                <span className="payout-balance-label">Available Balance</span>
                                <span className="payout-balance-amount">
                                    {availableBalance !== null
                                        ? `₦${(availableBalance / 100).toLocaleString()}`
                                        : 'Loading...'}
                                </span>
                                <span className="payout-balance-ref">Ref: {selectedAccount?.reference}</span>
                            </div>

                            <form onSubmit={handlePayout} className="modal-form">
                                <div className="form-group">
                                    <label className="form-label">Amount (Kobo)</label>
                                    <input
                                        type="number"
                                        required
                                        value={payoutAmount}
                                        onChange={(e) => setPayoutAmount(e.target.value)}
                                        className="form-input"
                                        placeholder="e.g. 5000"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Destination Bank Code</label>
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
                                    <label className="form-label">Account Number</label>
                                    <input
                                        type="text"
                                        required
                                        value={destinationAccount}
                                        onChange={(e) => setDestinationAccount(e.target.value)}
                                        className="form-input"
                                        placeholder="e.g. 0123456789"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Narration</label>
                                    <input
                                        type="text"
                                        value={payoutNarration}
                                        onChange={(e) => setPayoutNarration(e.target.value)}
                                        className="form-input"
                                        placeholder="Optional"
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => setIsPayoutModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <Button
                                        type="submit"
                                        isLoading={isProcessingPayout}
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
