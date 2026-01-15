import React, { useState, useEffect } from 'react';
import { getProviderData, bulkImportPricingPlans } from '../api/adminApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface IBDataSyncModalProps {
    onClose: () => void;
}

const IBDataSyncModal: React.FC<IBDataSyncModalProps> = ({ onClose }) => {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [markup, setMarkup] = useState<number>(10); // Default 10% markup
    const [markupType, setMarkupType] = useState<'percent' | 'flat'>('percent');
    const queryClient = useQueryClient();

    const fetchPlans = async () => {
        setLoading(true);
        setError('');
        try {
            const res: any = await getProviderData('ibdata', 'plans');
            setPlans(res.data?.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to fetch IBData plans');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const importMutation = useMutation({
        mutationFn: (plansData: any[]) => bulkImportPricingPlans(plansData).then((res: any) => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
            onClose();
        },
    });

    const handleSync = () => {
        const formattedPlans = plans.map((p: any) => {
            let finalPrice = Number(p.price);
            if (markupType === 'percent') {
                finalPrice = finalPrice + (finalPrice * (markup / 100));
            } else {
                finalPrice = finalPrice + markup;
            }

            return {
                providerId: Number(p.network), // In IBData response, network is the ID (1=MTN, etc.)
                providerName: getNetworkName(p.network),
                externalPlanId: p.plan_id,
                code: `IBDATA_${p.plan_id}`,
                name: p.plan_name,
                price: Math.ceil(finalPrice),
                type: p.plan_type === 'DATA' ? 'DATA' : 'AIRTIME',
                discount: 0,
                active: true,
                metadata: {
                    validity: p.validity,
                    data_value: p.data_value,
                    original_price: p.price
                }
            };
        });

        importMutation.mutate(formattedPlans);
    };

    const getNetworkName = (id: string) => {
        const map: Record<string, string> = {
            '1': 'MTN',
            '2': 'AIRTEL',
            '3': 'GLO',
            '4': '9MOBILE'
        };
        return map[id] || 'UNKNOWN';
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8 max-h-[85vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Sync IBData Plans</h2>
                        <p className="text-slate-600 text-sm">Fetch latest prices from IBData and apply your markup</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                ) : error ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 max-w-md">
                            <p className="font-semibold">Error</p>
                            <p className="text-sm">{error}</p>
                        </div>
                        <button onClick={fetchPlans} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">Retry</button>
                    </div>
                ) : (
                    <>
                        <div className="bg-slate-50 p-4 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end border border-slate-200">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Markup Type</label>
                                <select value={markupType} onChange={(e) => setMarkupType(e.target.value as any)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none">
                                    <option value="percent">Percentage (%)</option>
                                    <option value="flat">Flat Amount (₦)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Markup Value</label>
                                <input type="number" value={markup} onChange={(e) => setMarkup(Number(e.target.value))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                            </div>
                            <div className="text-sm text-slate-500 pb-2">
                                Example: ₦100 + {markup}{markupType === 'percent' ? '%' : '₦'} = ₦{markupType === 'percent' ? 100 + (100 * markup / 100) : 100 + markup}
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto border border-slate-200 rounded-xl mb-6">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-sm font-semibold text-slate-700">Network</th>
                                        <th className="px-4 py-3 text-sm font-semibold text-slate-700">Plan Name</th>
                                        <th className="px-4 py-3 text-sm font-semibold text-slate-700">API Price</th>
                                        <th className="px-4 py-3 text-sm font-semibold text-slate-700">Your Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {plans.map((p: any) => {
                                        const yourPrice = markupType === 'percent'
                                            ? p.price + (p.price * markup / 100)
                                            : p.price + markup;
                                        return (
                                            <tr key={p.plan_id} className="hover:bg-slate-50 transition">
                                                <td className="px-4 py-3 text-sm text-slate-600">{getNetworkName(p.network)}</td>
                                                <td className="px-4 py-3 text-sm text-slate-900 font-medium">{p.plan_name}</td>
                                                <td className="px-4 py-3 text-sm text-slate-600">₦{p.price}</td>
                                                <td className="px-4 py-3 text-sm text-green-600 font-bold">₦{Math.ceil(yourPrice)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={onClose} className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition font-semibold">Cancel</button>
                            <button onClick={handleSync} disabled={importMutation.status === 'pending' || plans.length === 0} className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-semibold disabled:opacity-50">
                                {importMutation.status === 'pending' ? 'Syncing...' : `Sync ${plans.length} Plans`}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default IBDataSyncModal;
