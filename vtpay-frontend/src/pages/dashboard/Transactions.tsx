import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { ArrowUpRight, ArrowDownLeft, Search, ChevronDown } from 'lucide-react';

export const Transactions: React.FC = () => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        type: '',
        startDate: '',
        endDate: '',
    });

    useEffect(() => {
        fetchTransactions();
    }, [filters]);

    const fetchTransactions = async () => {
        setIsLoading(true);
        try {
            let query = '/transactions?limit=50';
            if (filters.type) query += `&type=${filters.type}`;
            if (filters.startDate) query += `&startDate=${filters.startDate}`;
            if (filters.endDate) query += `&endDate=${filters.endDate}`;

            const response = await api.get(query);
            setTransactions(response.data.data.transactions);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

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
                    <h1 className="page-title">Transactions</h1>
                    <p className="page-subtitle">View and filter your transaction history</p>
                </div>
            </div>

            <div className="txn-card">
                {/* Filters */}
                <div className="txn-filters">
                    <div className="txn-search-wrapper">
                        <Search className="txn-search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Search by reference..."
                            className="txn-search-input"
                        />
                    </div>
                    <div className="txn-filter-group">
                        <div className="select-wrapper">
                            <select
                                name="type"
                                value={filters.type}
                                onChange={handleFilterChange}
                                className="form-select txn-filter-select"
                            >
                                <option value="">All Types</option>
                                <option value="credit">Credit</option>
                                <option value="debit">Debit</option>
                            </select>
                            <ChevronDown className="select-arrow" size={16} />
                        </div>
                        <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="txn-date-input"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="txn-table-wrapper">
                    <table className="txn-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Reference</th>
                                <th>Narration</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="txn-loading">
                                        <div className="loading-spinner"></div>
                                    </td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="txn-empty">
                                        No transactions found matching your criteria
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((txn) => (
                                    <tr key={txn.id}>
                                        <td>
                                            <div className="txn-type-cell">
                                                <div className={`txn-type-icon ${txn.type}`}>
                                                    {txn.type === 'credit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                                </div>
                                                <span className="txn-type-label">{txn.type}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`txn-amount-cell ${txn.type}`}>
                                                {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amountNaira)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="txn-reference-cell">{txn.reference}</span>
                                        </td>
                                        <td>
                                            <span className="txn-narration-cell" title={txn.narration}>
                                                {txn.narration || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`txn-status-badge ${txn.status}`}>
                                                {txn.status}
                                            </span>
                                        </td>
                                        <td className="txn-date-cell">
                                            {new Date(txn.createdAt).toLocaleString()}
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
