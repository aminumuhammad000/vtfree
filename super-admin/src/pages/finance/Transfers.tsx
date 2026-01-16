import React, { useState, useEffect } from 'react';
import { getTransactions } from 'api/superAdminApi';

const Transfers: React.FC = () => {
    const [transfers, setTransfers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransfers();
    }, []);

    const fetchTransfers = async () => {
        setLoading(true);
        try {
            const response = await getTransactions();
            if (response.data.success) {
                // Filter for transfer-like transactions if possible, or just show all for now
                const mapped = response.data.data.transactions
                    .filter((t: any) => t.type === 'transfer' || t.type === 'debit')
                    .map((t: any) => ({
                        id: t.transaction_id,
                        recipient: t.customer_phone || 'N/A',
                        amount: t.amount,
                        status: t.status,
                        date: new Date(t.created_at).toLocaleString(),
                        reference: t.reference
                    }));
                setTransfers(mapped);
            }
        } catch (error) {
            console.error('Failed to fetch transfers:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Transfers</h1>
                <p className="text-slate-500 mt-1">Monitor and manage all platform transfers</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Reference</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Recipient</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Loading transfers...</td></tr>
                            ) : transfers.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No transfers found</td></tr>
                            ) : (
                                transfers.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-sm text-slate-900">{t.reference}</td>
                                        <td className="px-6 py-4 text-slate-900">{t.recipient}</td>
                                        <td className="px-6 py-4 font-bold text-slate-900">₦{t.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${t.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{t.date}</td>
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

export default Transfers;
