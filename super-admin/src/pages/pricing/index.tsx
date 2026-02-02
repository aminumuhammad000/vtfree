import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { PricingService, IBDataPlan, AppFeature } from 'services/pricing.service';

type PricingSection = 'ibdata' | 'app-features';

const PricingPlans = () => {
    const [activeSection, setActiveSection] = useState<PricingSection>('ibdata');
    const [editingPlan, setEditingPlan] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [ibdataPlans, setIbdataPlans] = useState<IBDataPlan[]>([]);
    const [ibdataBalance, setIbdataBalance] = useState<number | null>(null);
    const [loadingBalance, setLoadingBalance] = useState(false);
    const [features, setFeatures] = useState<AppFeature[]>([]);

    useEffect(() => {
        if (activeSection === 'ibdata') {
            fetchPlans();
            fetchBalance();
        } else if (activeSection === 'app-features') {
            fetchFeatures();
        }
    }, [activeSection]);

    const fetchBalance = async () => {
        setLoadingBalance(true);
        try {
            const balance = await PricingService.getIBDataBalance();
            setIbdataBalance(balance);
        } catch (error) {
            console.error('Error fetching balance:', error);
        } finally {
            setLoadingBalance(false);
        }
    };

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const plans = await PricingService.getIBDataPlans();
            setIbdataPlans(plans);
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFeatures = async () => {
        setLoading(true);
        try {
            const data = await PricingService.getFeatures();
            setFeatures(data);
        } catch (error) {
            console.error('Error fetching features:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const msg = await PricingService.syncIBDataPlans();
            alert(msg);
            fetchPlans();
        } catch (error) {
            console.error('Error syncing plans:', error);
        } finally {
            setSyncing(false);
        }
    };



    const getTypeColor = (type: string) => {
        switch (type) {
            case 'data': return 'bg-blue-100 text-blue-700';
            case 'airtime': return 'bg-green-100 text-green-700';
            case 'cable': return 'bg-purple-100 text-purple-700';
            case 'utility': return 'bg-amber-100 text-amber-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getBillingCycleColor = (cycle: string) => {
        switch (cycle) {
            case 'monthly': return 'bg-emerald-100 text-emerald-700';
            case 'yearly': return 'bg-blue-100 text-blue-700';
            case 'one-time': return 'bg-purple-100 text-purple-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const updateProfitPercentage = (planId: string, newPercentage: number) => {
        if (isNaN(newPercentage)) return;

        setIbdataPlans(plans =>
            plans.map(p =>
                p.id === planId
                    ? {
                        ...p,
                        profit_percentage: newPercentage,
                        selling_price: Math.round(p.base_price * (1 + newPercentage / 100))
                    }
                    : p
            )
        );
    };

    const saveProfitUpdate = async (plan: IBDataPlan) => {
        setLoading(true);
        try {
            await PricingService.updatePlanProfit({
                planId: plan.id,
                profitPercentage: plan.profit_percentage,
                type: plan.type,
                name: plan.plan_name,
                basePrice: plan.base_price,
                network: plan.network
            });
            setEditingPlan(null);
        } catch (error: any) {
            console.error('Error updating profit:', error);
            alert(error.response?.data?.message || 'Failed to update profit');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Pricing & Plans Management</h1>
                    <p className="text-slate-500 mt-1">Manage IBData service pricing and app feature subscriptions</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* IBData Balance Display */}
                    <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <Icon icon="solar:wallet-money-bold" width="24" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">IBData Balance</p>
                            <p className="text-lg font-bold text-slate-900">
                                {loadingBalance ? (
                                    <span className="animate-pulse bg-slate-200 h-6 w-20 rounded block"></span>
                                ) : (
                                    `₦${(ibdataBalance || 0).toLocaleString()}`
                                )}
                            </p>
                        </div>
                    </div>

                    {activeSection === 'ibdata' ? (
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <Icon icon={syncing ? "solar:refresh-bold" : "solar:add-circle-bold"} className={syncing ? "animate-spin" : ""} width="20" />
                            <span>{syncing ? 'Syncing...' : 'Sync IBData Plans'}</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => alert('Add Feature modal coming soon!')}
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                        >
                            <Icon icon="solar:add-circle-bold" width="20" />
                            <span>Add New Feature</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Section Tabs */}
            <div className="border-b border-slate-200">
                <div className="flex gap-2 overflow-x-auto">
                    <button
                        onClick={() => setActiveSection('ibdata')}
                        className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all duration-300 border-b-2 whitespace-nowrap ${activeSection === 'ibdata'
                            ? 'border-emerald-600 text-emerald-600'
                            : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                            }`}
                    >
                        <Icon icon="solar:database-bold" width="20" />
                        <span>IBData Plans</span>
                        <span className="ml-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                            {ibdataPlans.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveSection('app-features')}
                        className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all duration-300 border-b-2 whitespace-nowrap ${activeSection === 'app-features'
                            ? 'border-emerald-600 text-emerald-600'
                            : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                            }`}
                    >
                        <Icon icon="solar:widget-5-bold" width="20" />
                        <span>App Features</span>
                        <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                            {features.length}
                        </span>
                    </button>
                </div>
            </div>

            {/* IBData Plans Section */}
            {activeSection === 'ibdata' && (
                <div className="space-y-6">
                    {/* Info Banner */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <Icon icon="solar:info-circle-bold" className="text-blue-600 flex-shrink-0 mt-0.5" width="24" />
                            <div>
                                <h3 className="font-bold text-blue-900 mb-1">Percentage-Based Profit System</h3>
                                <p className="text-sm text-blue-700">
                                    Set your profit percentage on each IBData plan. The <strong>selling price</strong> (base price + profit %) becomes the price that App-Admin users will see and charge their customers.
                                    <span className="block mt-1">Formula: Selling Price = Base Price × (1 + Profit% / 100)</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* IBData Plans Table */}
                    <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                            <h2 className="text-xl font-bold text-slate-900">IBData Service Plans</h2>
                            <p className="text-sm text-slate-600 mt-1">Manage profit percentage for data, airtime, cable TV, and utility services</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Network/Provider</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Plan Name</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Base Price</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Profit %</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Selling Price</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-10 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Icon icon="solar:refresh-bold" className="animate-spin text-emerald-600" width="32" />
                                                    <span className="text-slate-500 font-medium">Fetching plans from IBData...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : ibdataPlans.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-10 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Icon icon="solar:box-minimalistic-bold" className="text-slate-300" width="48" />
                                                    <span className="text-slate-500 font-medium">No plans found. Click Sync to fetch from IBData.</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        ibdataPlans.map((plan) => (
                                            <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-slate-900">{plan.network}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getTypeColor(plan.type)}`}>
                                                        {plan.type.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-medium text-slate-900">{plan.plan_name}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-mono font-semibold text-slate-700">₦{plan.base_price.toLocaleString()}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {editingPlan === plan.id ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={plan.profit_percentage}
                                                                onChange={(e) => updateProfitPercentage(plan.id, Number(e.target.value))}
                                                                onKeyDown={(e) => e.key === 'Enter' && saveProfitUpdate(plan)}
                                                                className="w-20 px-2 py-1 border-2 border-emerald-300 rounded-lg text-right font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                                autoFocus
                                                            />
                                                            <span className="text-sm text-emerald-600 font-bold">%</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <span className="font-mono font-semibold text-emerald-600">{plan.profit_percentage}%</span>
                                                            <button
                                                                onClick={() => setEditingPlan(plan.id)}
                                                                className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                                                            >
                                                                <Icon icon="solar:pen-bold" width="16" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-mono font-bold text-lg text-slate-900">₦{plan.selling_price.toLocaleString()}</span>
                                                        <span className="text-xs text-emerald-600 font-semibold">
                                                            +₦{(plan.selling_price - plan.base_price).toLocaleString()} profit
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${plan.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                            {plan.status.toUpperCase()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {editingPlan === plan.id ? (
                                                            <button
                                                                onClick={() => saveProfitUpdate(plan)}
                                                                className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"
                                                                title="Save"
                                                            >
                                                                <Icon icon="solar:check-circle-bold" width="18" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => setEditingPlan(plan.id)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                                title="Edit Profit %"
                                                            >
                                                                <Icon icon="solar:pen-bold" width="18" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* App Features Section */}
            {activeSection === 'app-features' && (
                <div className="space-y-6">
                    {/* Info Banner */}
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <Icon icon="solar:widget-5-bold" className="text-purple-600 flex-shrink-0 mt-0.5" width="24" />
                            <div>
                                <h3 className="font-bold text-purple-900 mb-1">VTFree App Features</h3>
                                <p className="text-sm text-purple-700">
                                    Manage platform features and their pricing. These features are available to App-Admin users who build their custom VTU applications.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Features Table */}
                    <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                            <h2 className="text-xl font-bold text-slate-900">App Features & Services</h2>
                            <p className="text-sm text-slate-600 mt-1">Configure app feature pricing and availability</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-16"></th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Feature</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Description</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Billing</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-10 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Icon icon="solar:refresh-bold" className="animate-spin text-emerald-600" width="32" />
                                                    <span className="text-slate-500 font-medium">Loading features...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : features.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-10 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Icon icon="solar:box-minimalistic-bold" className="text-slate-300" width="48" />
                                                    <span className="text-slate-500 font-medium">No features found.</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        features.map((feature) => (
                                            <tr key={feature._id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white">
                                                        <Icon icon={feature.icon || 'solar:widget-5-bold'} width="20" />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-slate-900">{feature.name}</span>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{feature.category}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-slate-600">{feature.description}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {feature.price === 0 ? (
                                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">
                                                            FREE
                                                        </span>
                                                    ) : (
                                                        <span className="font-mono font-bold text-lg text-slate-900">₦{feature.price.toLocaleString()}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getBillingCycleColor(feature.billing_cycle)}`}>
                                                            {feature.billing_cycle === 'one-time' ? 'One-time' : feature.billing_cycle.charAt(0).toUpperCase() + feature.billing_cycle.slice(1)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${feature.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                            {feature.status.toUpperCase()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit">
                                                            <Icon icon="solar:pen-bold" width="18" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm('Are you sure you want to delete this feature?')) {
                                                                    PricingService.deleteFeature(feature._id).then(() => fetchFeatures());
                                                                }
                                                            }}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Delete"
                                                        >
                                                            <Icon icon="solar:trash-bin-trash-bold" width="18" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PricingPlans;
