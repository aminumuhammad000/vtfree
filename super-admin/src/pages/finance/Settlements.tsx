import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getPayments } from 'api/superAdminApi';

const Settlements: React.FC = () => {
    const [settlements, setSettlements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettlements();
    }, []);

    const fetchSettlements = async () => {
        setLoading(true);
        try {
            const response = await getPayments();
            if (response.data.success) {
                const mapped = response.data.data.payments.map((p: any) => ({
                    id: p._id,
                    owner: p.user_id ? `${p.user_id.first_name} ${p.user_id.last_name}` : 'N/A',
                    email: p.user_id?.email || 'N/A',
                    amount: p.amount,
                    status: p.status,
                    date: new Date(p.created_at).toLocaleString(),
                    reference: p.reference
                }));
                setSettlements(mapped);
            }
        } catch (error) {
            console.error('Failed to fetch settlements:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Settlements</h1>
                <p className="text-slate-500 mt-1">Track and manage payouts to application owners</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Reference</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Owner</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Loading settlements...</td></tr>
                            ) : settlements.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No settlements found</td></tr>
                            ) : (
                                settlements.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-sm text-slate-900">{s.reference}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{s.owner}</span>
                                                <span className="text-xs text-slate-500">{s.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900">₦{s.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${s.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{s.date}</td>
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

export default Settlements;
