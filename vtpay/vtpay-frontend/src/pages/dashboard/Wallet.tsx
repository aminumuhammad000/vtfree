import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import '../../styles/pages/wallet.css';
import { Input } from '../../components/Input';
import { Wallet as WalletIcon, Send, CheckCircle, Plus, AlertCircle, ChevronDown, ArrowRight } from 'lucide-react';

export const Wallet: React.FC = () => {
    const [wallet, setWallet] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [transferData, setTransferData] = useState({
        accountNumber: '',
        bankCode: '',
        amount: '',
        narration: '',
    });
    const [banks, setBanks] = useState<any[]>([]);
    const [isTransferLoading, setIsTransferLoading] = useState(false);
    const [transferSuccess, setTransferSuccess] = useState('');
    const [transferError, setTransferError] = useState('');

    useEffect(() => {
        fetchWallet();
        fetchBanks();
    }, []);

    const fetchWallet = async () => {
        try {
            const response = await api.get('/wallet');
            setWallet(response.data.data);
        } catch (error) {
            console.error('Error fetching wallet:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBanks = async () => {
        try {
            const response = await api.get('/banks');
            setBanks(response.data.data || []);
        } catch (error) {
            console.error('Error fetching banks:', error);
        }
    };

    const handleTransferChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setTransferData({ ...transferData, [e.target.name]: e.target.value });
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsTransferLoading(true);
        setTransferError('');
        setTransferSuccess('');

        try {
            const amountInKobo = Math.round(parseFloat(transferData.amount) * 100);

            await api.post('/transactions/transfer', {
                destinationAccountNumber: transferData.accountNumber,
                destinationBankCode: transferData.bankCode,
                amount: amountInKobo.toString(),
                narration: transferData.narration,
            });

            setTransferSuccess('Transfer initiated successfully!');
            setTransferData({ accountNumber: '', bankCode: '', amount: '', narration: '' });
            fetchWallet(); // Refresh balance
        } catch (err: any) {
            console.error('Transfer error:', err);
            setTransferError(err.response?.data?.message || 'Transfer failed');
        } finally {
            setIsTransferLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    return (
        <div className="page-container">
            <div className="page-header-main">
                <div>
                    <h1 className="page-title">Wallet</h1>
                    <p className="page-subtitle">Manage your funds and transfers</p>
                </div>
            </div>

            <div className="wallet-grid">
                <div className="wallet-left-column">
                    {/* Premium Balance Card */}
                    <div className="wallet-balance-card">
                        <div className="wallet-balance-content">
                            <div className="wallet-balance-header">
                                <div className="wallet-icon-box">
                                    <WalletIcon size={24} />
                                </div>
                                <div className="wallet-info">
                                    <p className="wallet-label">Wallet ID</p>
                                    <p className="wallet-name">{wallet?.accountName || 'Loading...'}</p>
                                </div>
                            </div>

                            <div className="wallet-main-balance">
                                <p className="wallet-label">Total Balance</p>
                                <h2 className="wallet-amount">
                                    {formatCurrency(wallet?.balanceNaira || 0)}
                                </h2>
                            </div>

                            <div className="wallet-stats-grid">
                                <div>
                                    <p className="wallet-stat-label">Available</p>
                                    <p className="wallet-stat-value">
                                        {formatCurrency(wallet?.availableBalanceNaira || 0)}
                                    </p>
                                </div>
                                <div>
                                    <p className="wallet-stat-label">Locked</p>
                                    <p className="wallet-stat-value">
                                        {formatCurrency(wallet?.lockedBalanceNaira || 0)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fund Wallet Section */}
                    <div className="fund-wallet-card">
                        <div className="fund-wallet-content">
                            <div className="fund-icon-wrapper">
                                <Plus size={24} />
                            </div>
                            <div className="fund-text-content">
                                <h3 className="fund-title">Fund Your Wallet</h3>
                                <p className="fund-description">
                                    Add money to your wallet via bank transfer or card payment.
                                </p>
                                <button
                                    className="fund-action-btn"
                                    onClick={() => window.location.href = '/dashboard/virtual-accounts'}
                                >
                                    View Funding Options
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transfer Form */}
                <div className="transfer-card">
                    <div className="transfer-header">
                        <h2 className="transfer-title">Transfer Funds</h2>
                        <p className="transfer-subtitle">Send money to any bank account</p>
                    </div>

                    {transferSuccess && (
                        <div className="transfer-alert success">
                            <CheckCircle size={20} />
                            <span>{transferSuccess}</span>
                        </div>
                    )}

                    {transferError && (
                        <div className="transfer-alert error">
                            <AlertCircle size={20} />
                            <span>{transferError}</span>
                        </div>
                    )}

                    <form onSubmit={handleTransfer} className="transfer-form">
                        <div className="form-group">
                            <label className="form-label">Select Bank</label>
                            <div className="select-wrapper">
                                <select
                                    className="form-select"
                                    name="bankCode"
                                    value={transferData.bankCode}
                                    onChange={handleTransferChange}
                                    required
                                >
                                    <option value="">Select a bank</option>
                                    {banks.map((bank) => (
                                        <option key={bank.code} value={bank.code}>
                                            {bank.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="select-arrow" size={16} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Account Number</label>
                            <Input
                                placeholder="0123456789"
                                name="accountNumber"
                                value={transferData.accountNumber}
                                onChange={handleTransferChange}
                                maxLength={10}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Amount</label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                name="amount"
                                value={transferData.amount}
                                onChange={handleTransferChange}
                                min="100"
                                required
                                leftIcon={<span style={{ color: 'var(--color-text-muted)' }}>₦</span>}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description (Optional)</label>
                            <Input
                                placeholder="Payment for..."
                                name="narration"
                                value={transferData.narration}
                                onChange={handleTransferChange}
                            />
                        </div>

                        <Button
                            type="submit"
                            isLoading={isTransferLoading}
                            className="btn-primary submit-btn"
                            rightIcon={<ArrowRight size={18} />}
                        >
                            Transfer Funds
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};
