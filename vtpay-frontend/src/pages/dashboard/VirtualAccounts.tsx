import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Plus, Copy, AlertCircle, CreditCard, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const VirtualAccounts: React.FC = () => {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newAccountData, setNewAccountData] = useState({
        bankType: 'gtBank',
        bvn: '',
        accountName: '',
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const response = await api.get('/virtual-accounts');
            setAccounts(response.data.data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        setCreateError('');

        try {
            await api.post('/virtual-accounts', newAccountData);
            await fetchAccounts();
            setShowCreateModal(false);
            setNewAccountData({ bankType: 'gtBank', bvn: '', accountName: '' });
        } catch (err: any) {
            console.error('Create account error:', err);
            setCreateError(err.response?.data?.message || 'Failed to create account');
        } finally {
            setIsCreating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
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
                    <h1 className="page-title">Virtual Accounts</h1>
                    <p className="page-subtitle">Create and manage your virtual bank accounts</p>
                </div>
                <div className="va-header-actions">
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        leftIcon={<Plus size={18} />}
                        disabled={(user?.kycLevel ?? 0) < 3}
                    >
                        Create New Account
                    </Button>
                    {(user?.kycLevel ?? 0) < 3 && (
                        <span className="va-verification-note">Verification required</span>
                    )}
                </div>
            </div>

            {/* Account List */}
            <div className="va-accounts-grid">
                {accounts.length === 0 ? (
                    <div className="va-empty-state">
                        <div className="va-empty-icon">
                            <CreditCard size={32} />
                        </div>
                        <h3>No Accounts Yet</h3>
                        <p>Create a virtual account to start receiving payments instantly. You can have multiple accounts for different purposes.</p>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            disabled={(user?.kycLevel ?? 0) < 3}
                        >
                            Create First Account
                        </Button>
                        {(user?.kycLevel ?? 0) < 3 && (
                            <span className="va-verification-badge">Verification required</span>
                        )}
                    </div>
                ) : (
                    accounts.map((account) => (
                        <div key={account.id} className="va-account-card">
                            <div className="va-account-status">
                                <span className={`va-status-badge ${account.status}`}>
                                    {account.status}
                                </span>
                            </div>

                            <div className="va-account-header">
                                <div className="va-bank-icon">
                                    {account.bankName.charAt(0)}
                                </div>
                                <div className="va-account-info">
                                    <h3>{account.alias || account.accountName}</h3>
                                    <p>{account.bankName}</p>
                                </div>
                            </div>

                            <div className="va-account-number-box">
                                <span className="va-account-label">Account Number</span>
                                <div className="va-account-number-row">
                                    <span className="va-account-number">{account.accountNumber}</span>
                                    <button
                                        onClick={() => copyToClipboard(account.accountNumber)}
                                        className="va-copy-btn"
                                        title="Copy Account Number"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <div>
                                <h2>Create Virtual Account</h2>
                                <p>Enter details to generate a new account number.</p>
                            </div>
                            <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            {createError && (
                                <div className="alert alert-error">
                                    <div className="alert-icon">
                                        <AlertCircle size={16} />
                                    </div>
                                    <div className="alert-content">
                                        <p>{createError}</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleCreateAccount} className="modal-form">
                                <div className="form-group">
                                    <label className="form-label">Account Name (Alias)</label>
                                    <input
                                        type="text"
                                        value={newAccountData.accountName}
                                        onChange={(e) => setNewAccountData({ ...newAccountData, accountName: e.target.value })}
                                        placeholder="e.g. My Savings, Business Account"
                                        className="form-input"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Bank Type</label>
                                    <div className="select-wrapper">
                                        <select
                                            value={newAccountData.bankType}
                                            onChange={(e) => setNewAccountData({ ...newAccountData, bankType: e.target.value })}
                                            className="form-select"
                                        >
                                            <option value="gtBank">GTBank</option>
                                            <option value="fidelity">Fidelity Bank</option>
                                            <option value="fcmb">FCMB</option>
                                        </select>
                                        <ChevronDown className="select-arrow" size={16} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">BVN (Optional)</label>
                                    <input
                                        type="text"
                                        value={newAccountData.bvn}
                                        onChange={(e) => setNewAccountData({ ...newAccountData, bvn: e.target.value })}
                                        placeholder="Enter BVN if required"
                                        className="form-input"
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => setShowCreateModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <Button type="submit" isLoading={isCreating}>
                                        Create Account
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
