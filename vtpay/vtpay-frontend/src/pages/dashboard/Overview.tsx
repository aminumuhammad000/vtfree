import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Eye, EyeOff, Plus, Send, ArrowUpRight, ArrowDownLeft, Wallet as WalletIcon, CreditCard, History as HistoryIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Overview: React.FC = () => {
    const { user } = useAuth();
    const [wallet, setWallet] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showBalance, setShowBalance] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [walletRes, txnsRes] = await Promise.all([
                    api.get('/wallet'),
                    api.get('/wallet/transactions?limit=5')
                ]);
                setWallet(walletRes.data.data);
                setTransactions(txnsRes.data.data.transactions);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
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
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Welcome back, {user?.firstName}</p>
                </div>
                <div className="page-header-actions" style={{ display: 'flex', gap: '12px' }}>
                    <Link to="/dashboard/wallet">
                        <Button variant="outline" leftIcon={<Plus size={18} />}>
                            Fund Wallet
                        </Button>
                    </Link>
                    <Link to="/dashboard/wallet">
                        <Button leftIcon={<Send size={18} />} className="btn-primary shadow-lg">
                            Transfer
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="overview-grid">
                <div className="overview-main-column">
                    {/* Premium Balance Card */}
                    <div className="premium-balance-card">
                        <div className="balance-card-content">
                            <div className="balance-header">
                                <div>
                                    <p className="balance-title">Total Balance</p>
                                    <div className="balance-amount-wrapper">
                                        <h2 className="balance-amount">
                                            {showBalance ? formatCurrency(wallet?.balanceNaira || 0) : '••••••••'}
                                        </h2>
                                        <button
                                            onClick={() => setShowBalance(!showBalance)}
                                            className="balance-toggle-btn"
                                        >
                                            {showBalance ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="balance-icon-wrapper">
                                    <WalletIcon size={24} />
                                </div>
                            </div>

                            <div className="balance-details-grid">
                                <div>
                                    <p className="balance-detail-label">Available</p>
                                    <p className="balance-detail-value">
                                        {showBalance ? formatCurrency(wallet?.availableBalanceNaira || 0) : '••••••'}
                                    </p>
                                </div>
                                <div>
                                    <p className="balance-detail-label">Locked</p>
                                    <p className="balance-detail-value">
                                        {showBalance ? formatCurrency(wallet?.lockedBalanceNaira || 0) : '••••••'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overview-side-column">
                    {/* Quick Actions */}
                    <div className="quick-actions-card">
                        <h3 className="quick-actions-title">Quick Actions</h3>
                        <div className="quick-actions-list">
                            <Link to="/dashboard/virtual-accounts" className="quick-action-item">
                                <div className="quick-action-icon blue">
                                    <CreditCard size={24} />
                                </div>
                                <div className="quick-action-text">
                                    <h4>Virtual Accounts</h4>
                                    <p>Create & manage accounts</p>
                                </div>
                            </Link>
                            <Link to="/dashboard/transactions" className="quick-action-item">
                                <div className="quick-action-icon purple">
                                    <HistoryIcon size={24} />
                                </div>
                                <div className="quick-action-text">
                                    <h4>Transaction History</h4>
                                    <p>View recent activity</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="recent-transactions-card">
                <div className="recent-transactions-header">
                    <h2 className="recent-transactions-title">Recent Transactions</h2>
                    <Link to="/dashboard/transactions" className="view-all-link">
                        View All
                    </Link>
                </div>
                <div className="transactions-table-container">
                    <table className="transactions-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Reference</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                                        No recent transactions found
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((txn) => (
                                    <tr key={txn.id}>
                                        <td>
                                            <div className="txn-type-wrapper">
                                                <div className={`txn-icon ${txn.type === 'credit' ? 'credit' : 'debit'}`}>
                                                    {txn.type === 'credit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                                </div>
                                                <span className="txn-type-text">{txn.type}</span>
                                            </div>
                                        </td>
                                        <td className={`txn-amount ${txn.type === 'credit' ? 'credit' : 'debit'}`}>
                                            {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amountNaira)}
                                        </td>
                                        <td className="txn-reference">
                                            {txn.reference}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${txn.status === 'success' ? 'status-badge-success' :
                                                txn.status === 'pending' ? 'status-badge-pending' :
                                                    'status-badge-error'
                                                }`}>
                                                {txn.status}
                                            </span>
                                        </td>
                                        <td className="txn-date">
                                            {new Date(txn.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
