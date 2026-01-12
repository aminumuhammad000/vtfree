import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
    ArrowUpRight,
    ArrowDownLeft,
    Search,
    Filter,
    Download,
    ChevronLeft,
    ChevronRight,
    Calendar,
    MoreHorizontal,
    CheckCircle2,
    Clock,
    XCircle,
    RefreshCw
} from 'lucide-react';

export const Transactions: React.FC = () => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        type: '',
        startDate: '',
        endDate: '',
        search: '',
    });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchTransactions();
    }, [filters, page]);

    const fetchTransactions = async () => {
        setIsLoading(true);
        try {
            let query = `/transactions?limit=15&page=${page}`;
            if (filters.type) query += `&type=${filters.type}`;
            if (filters.startDate) query += `&startDate=${filters.startDate}`;
            if (filters.endDate) query += `&endDate=${filters.endDate}`;
            if (filters.search) query += `&search=${filters.search}`;

            const response = await api.get(query);
            setTransactions(response.data.data.transactions || []);
            setTotalPages(response.data.data.totalPages || 1);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setPage(1); // Reset to first page on filter change
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusStyles = (status: string) => {
        switch (status.toLowerCase()) {
            case 'success':
                return {
                    className: 'status-pill success',
                    icon: <CheckCircle2 size={12} />
                };
            case 'pending':
                return {
                    className: 'status-pill pending',
                    icon: <Clock size={12} />
                };
            case 'failed':
                return {
                    className: 'status-pill failed',
                    icon: <XCircle size={12} />
                };
            default:
                return {
                    className: 'status-pill',
                    icon: <Clock size={12} />
                };
        }
    };

    return (
        <div className="space-y-6 max-w-[1400px] animate-fade-in">
            {/* Header */}
            <div className="transactions-header">
                <div>
                    <h1 className="text-heading">Transactions</h1>
                    <p className="text-body mt-1">Monitor and manage all your financial activities</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchTransactions}
                        className="btn btn-secondary p-2"
                        title="Refresh"
                    >
                        <RefreshCw size={18} />
                    </button>
                    <button className="btn btn-secondary">
                        <Download size={18} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="filter-bar">
                <div className="search-input-wrapper">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        name="search"
                        value={filters.search}
                        onChange={handleFilterChange}
                        placeholder="Search by reference or narration..."
                        className="search-input"
                    />
                </div>

                <div className="filter-group">
                    <div className="select-wrapper">
                        <select
                            name="type"
                            value={filters.type}
                            onChange={handleFilterChange}
                            className="filter-select"
                        >
                            <option value="">All Types</option>
                            <option value="credit">Credit</option>
                            <option value="debit">Debit</option>
                        </select>
                        <Filter className="filter-icon" size={16} />
                    </div>

                    <div className="date-range-picker">
                        <Calendar size={16} className="text-muted" />
                        <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="date-input"
                        />
                        <span className="text-muted text-xs">to</span>
                        <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="date-input"
                        />
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="transactions-table-container">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="table-header">
                                <th className="table-th">Transaction</th>
                                <th className="table-th">Amount</th>
                                <th className="table-th">Reference</th>
                                <th className="table-th">Status</th>
                                <th className="table-th">Date</th>
                                <th className="table-th"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="p-6">
                                            <div className="h-10 bg-gray-100 rounded-lg w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="empty-state">
                                        <div className="empty-state-icon">
                                            <Search size={32} className="text-gray-300" />
                                        </div>
                                        <h3 className="empty-state-title">No transactions found</h3>
                                        <p className="empty-state-description">Try adjusting your filters or search terms</p>
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((txn) => {
                                    const status = getStatusStyles(txn.status);
                                    return (
                                        <tr key={txn.id} className="group transition-colors">
                                            <td className="table-td">
                                                <div className="flex items-center gap-4">
                                                    <div className={`transaction-type-icon ${txn.type === 'credit' ? 'credit' : 'debit'}`}>
                                                        {txn.type === 'credit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-heading capitalize">{txn.type}</p>
                                                        <p className="text-xs text-muted mt-0.5 max-w-[200px] truncate" title={txn.narration}>
                                                            {txn.narration || 'No description'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="table-td">
                                                <p className={`text-sm font-bold ${txn.type === 'credit' ? 'text-success' : 'text-heading'}`}>
                                                    {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amountNaira)}
                                                </p>
                                            </td>
                                            <td className="table-td">
                                                <span className="text-xs font-mono text-muted bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                                    {txn.reference}
                                                </span>
                                            </td>
                                            <td className="table-td">
                                                <div className={status.className}>
                                                    {status.icon}
                                                    {txn.status}
                                                </div>
                                            </td>
                                            <td className="table-td">
                                                <p className="text-xs text-muted">
                                                    {new Date(txn.createdAt).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">
                                                    {new Date(txn.createdAt).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </td>
                                            <td className="table-td text-right">
                                                <button className="p-2 text-muted hover:text-heading hover:bg-gray-100 rounded-lg transition-all">
                                                    <MoreHorizontal size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="pagination-container">
                    <p className="pagination-info">
                        Showing page {page} of {totalPages}
                    </p>
                    <div className="pagination-controls">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1 || isLoading}
                            className="pagination-button"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages || isLoading}
                            className="pagination-button"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
