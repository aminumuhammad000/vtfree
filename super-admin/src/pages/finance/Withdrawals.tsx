import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getWithdrawals, updateWithdrawalStatus } from 'api/superAdminApi';

interface Withdrawal {
    _id: string;
    user_id: {
        first_name: string;
        last_name: string;
        email: string;
    };
    amount: number;
    bank_name: string;
    account_number: string;
    account_name: string;
    status: 'pending' | 'approved' | 'rejected' | 'processed';
    reference: string;
    created_at: string;
}

const Withdrawals = () => {
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const fetchWithdrawals = async () => {
        setLoading(true);
        try {
            const response = await getWithdrawals();
            if (response.data.success) {
                setWithdrawals(response.data.data.withdrawals);
            }
        } catch (error) {
            console.error('Failed to fetch withdrawals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        setProcessingId(id);
        try {
            const response = await updateWithdrawalStatus(id, newStatus);
            if (response.data.success) {
                setWithdrawals(prev => prev.map(w => w._id === id ? { ...w, status: newStatus as any } : w));
            }
        } catch (error) {
            console.error('Failed to update withdrawal status:', error);
            alert('Failed to update status');
        } finally {
            setProcessingId(null);
        }
    };

    const filteredWithdrawals = withdrawals.filter(w =>
        w.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.user_id?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.account_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'processed': return 'bg-emerald-100 text-emerald-700';
            case 'approved': return 'bg-blue-100 text-blue-700';
            case 'pending': return 'bg-amber-100 text-amber-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Withdrawal Requests</h1>
                    <p className="text-slate-500 mt-1">Manage and process user withdrawal requests</p>
                </div>
                <div className="relative w-full md:w-96">
                    <Icon icon="solar:magnifer-linear" width="20" height="20" className="absolute left-3 top-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by reference, email, or name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Withdrawals Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Reference</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Bank Details</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                                            <p className="text-slate-500 font-medium">Loading withdrawals...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredWithdrawals.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Icon icon="solar:empty-wallet-bold-duotone" width="48" className="text-slate-200" />
                                            <p className="text-slate-500 font-medium">No withdrawal requests found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredWithdrawals.map((w) => (
                                    <tr key={w._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-mono text-sm font-bold text-slate-900">{w.reference}</p>
                                            <p className="text-[10px] text-slate-400 uppercase mt-1">
                                                {new Date(w.created_at).toLocaleDateString()}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-slate-900">
                                                {w.user_id?.first_name} {w.user_id?.last_name}
                                            </p>
                                            <p className="text-xs text-slate-500">{w.user_id?.email}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-slate-900">{w.bank_name}</p>
                                            <p className="text-xs text-slate-500">{w.account_number} • {w.account_name}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-900">₦{w.amount.toLocaleString()}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(w.status)}`}>
                                                {w.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {w.status === 'pending' && (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleStatusUpdate(w._id, 'approved')}
                                                        disabled={processingId === w._id}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Approve"
                                                    >
                                                        <Icon icon="solar:check-read-bold" width="20" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(w._id, 'rejected')}
                                                        disabled={processingId === w._id}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Reject"
                                                    >
                                                        <Icon icon="solar:close-circle-bold" width="20" />
                                                    </button>
                                                </div>
                                            )}
                                            {w.status === 'approved' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(w._id, 'processed')}
                                                    disabled={processingId === w._id}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                                                >
                                                    <Icon icon="solar:card-send-bold" width="16" />
                                                    <span>Mark Processed</span>
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
    );
};

export default Withdrawals;
