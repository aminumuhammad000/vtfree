import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { PricingService, IBDataPlan, AppFeature } from 'services/pricing.service';

type PricingSection = 'ibdata' | 'app-features' | 'build-pricing';

const PricingPlans = () => {
    const [activeSection, setActiveSection] = useState<PricingSection>('ibdata');
    const [editingPlan, setEditingPlan] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [ibdataPlans, setIbdataPlans] = useState<IBDataPlan[]>([]);
    const [ibdataBalance, setIbdataBalance] = useState<number | null>(null);
    const [loadingBalance, setLoadingBalance] = useState(false);
    const [features, setFeatures] = useState<AppFeature[]>([]);
    const [showAddFeatureModal, setShowAddFeatureModal] = useState(false);
    const [newFeature, setNewFeature] = useState({
        feature_id: '',
        name: '',
        slug: '',
        description: '',
        icon_name: 'solar:widget-5-bold',
        base_price: 0,
        category: 'utility' as 'billpayment' | 'finance' | 'utility' | 'communication',
        is_active: true
    });
    const [buildPrices, setBuildPrices] = useState<Record<string, number>>({});
    const [editingBuildPrice, setEditingBuildPrice] = useState<string | null>(null);

    useEffect(() => {
        if (activeSection === 'ibdata') {
            fetchPlans();
            fetchBalance();
        } else if (activeSection === 'app-features') {
            fetchFeatures();
        } else if (activeSection === 'build-pricing') {
            fetchBuildPrices();
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

    const handleCreateFeature = async () => {
        try {
            // Validation
            if (!newFeature.feature_id || !newFeature.name || !newFeature.slug) {
                alert('Please fill in all required fields (Feature ID, Name, and Slug)');
                return;
            }

            setLoading(true);
            await PricingService.createFeature(newFeature);
            alert('Feature created successfully!');
            setShowAddFeatureModal(false);
            setNewFeature({
                feature_id: '',
                name: '',
                slug: '',
                description: '',
                icon_name: 'solar:widget-5-bold',
                base_price: 0,
                category: 'utility',
                is_active: true
            });
            fetchFeatures();
        } catch (error: any) {
            console.error('Error creating feature:', error);
            alert(error.response?.data?.message || 'Failed to create feature');
        } finally {
            setLoading(false);
        }
    };

    const fetchBuildPrices = async () => {
        setLoading(true);
        try {
            const prices = await PricingService.getBuildPrices();
            setBuildPrices(prices);
        } catch (error) {
            console.error('Error fetching build prices:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateBuildPriceValue = async (key: string, value: number) => {
        try {
            await PricingService.updateBuildPrice(key, value);
            alert('Price updated successfully!');
            setEditingBuildPrice(null);
            fetchBuildPrices();
        } catch (error: any) {
            console.error('Error updating build price:', error);
            alert(error.response?.data?.message || 'Failed to update price');
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
                            onClick={() => setShowAddFeatureModal(true)}
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
                    <button
                        onClick={() => setActiveSection('build-pricing')}
                        className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all duration-300 border-b-2 whitespace-nowrap ${activeSection === 'build-pricing'
                            ? 'border-emerald-600 text-emerald-600'
                            : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                            }`}
                    >
                        <Icon icon="solar:settings-bold" width="20" />
                        <span>Build Options</span>
                        <span className="ml-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                            4
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
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-10 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Icon icon="solar:refresh-bold" className="animate-spin text-emerald-600" width="32" />
                                                    <span className="text-slate-500 font-medium">Loading features...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : features.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-10 text-center">
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
                                                        <Icon icon={feature.icon_name || 'solar:widget-5-bold'} width="20" />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-slate-900">{feature.name}</span>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{feature.category}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-slate-600">{feature.description || '-'}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {feature.base_price === 0 ? (
                                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">
                                                            FREE
                                                        </span>
                                                    ) : (
                                                        <span className="font-mono font-bold text-lg text-slate-900">₦{feature.base_price.toLocaleString()}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${feature.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                            {feature.is_active ? 'ACTIVE' : 'INACTIVE'}
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

            {/* Build Options Pricing Section */}
            {activeSection === 'build-pricing' && (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white">
                                <Icon icon="solar:settings-bold" width="24" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Build Options Pricing</h2>
                                <p className="text-sm text-slate-600">Manage pricing for platforms and publishing services</p>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <Icon icon="solar:refresh-bold" className="animate-spin text-purple-600 mx-auto mb-4" width="48" />
                            <p className="text-slate-600 font-medium">Loading build prices...</p>
                        </div>
                    ) : (
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Platform Android */}
                                <BuildPriceCard
                                    icon="solar:phone-bold"
                                    title="Android Platform"
                                    description="Base price for Android app generation"
                                    priceKey="PLATFORM_ANDROID"
                                    price={buildPrices.PLATFORM_ANDROID || 0}
                                    color="from-green-600 to-emerald-600"
                                    isEditing={editingBuildPrice === 'PLATFORM_ANDROID'}
                                    onEdit={() => setEditingBuildPrice('PLATFORM_ANDROID')}
                                    onSave={(value) => updateBuildPriceValue('PLATFORM_ANDROID', value)}
                                    onCancel={() => setEditingBuildPrice(null)}
                                />

                                {/* Platform Web */}
                                <BuildPriceCard
                                    icon="solar:global-bold"
                                    title="Web Platform"
                                    description="Base price for web app generation"
                                    priceKey="PLATFORM_WEB"
                                    price={buildPrices.PLATFORM_WEB || 0}
                                    color="from-blue-600 to-cyan-600"
                                    isEditing={editingBuildPrice === 'PLATFORM_WEB'}
                                    onEdit={() => setEditingBuildPrice('PLATFORM_WEB')}
                                    onSave={(value) => updateBuildPriceValue('PLATFORM_WEB', value)}
                                    onCancel={() => setEditingBuildPrice(null)}
                                />

                                {/* Publish Play Store */}
                                <BuildPriceCard
                                    icon="solar:cloud-upload-bold"
                                    title="Google Play Store Publishing"
                                    description="Publishing service to Google Play Store"
                                    priceKey="PUBLISH_PRICE_PLAY_STORE"
                                    price={buildPrices.PUBLISH_PRICE_PLAY_STORE || 0}
                                    color="from-orange-600 to-red-600"
                                    isEditing={editingBuildPrice === 'PUBLISH_PRICE_PLAY_STORE'}
                                    onEdit={() => setEditingBuildPrice('PUBLISH_PRICE_PLAY_STORE')}
                                    onSave={(value) => updateBuildPriceValue('PUBLISH_PRICE_PLAY_STORE', value)}
                                    onCancel={() => setEditingBuildPrice(null)}
                                />

                                {/* Publish Web */}
                                <BuildPriceCard
                                    icon="solar:server-bold"
                                    title="Web App Publishing"
                                    description="Deploy web app to production hosting"
                                    priceKey="PUBLISH_WEB"
                                    price={buildPrices.PUBLISH_WEB || 0}
                                    color="from-purple-600 to-pink-600"
                                    isEditing={editingBuildPrice === 'PUBLISH_WEB'}
                                    onEdit={() => setEditingBuildPrice('PUBLISH_WEB')}
                                    onSave={(value) => updateBuildPriceValue('PUBLISH_WEB', value)}
                                    onCancel={() => setEditingBuildPrice(null)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Add Feature Modal */}
            {showAddFeatureModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">Add New Feature</h2>
                                    <p className="text-blue-100 mt-1">Create a new app feature for VTFree platform</p>
                                </div>
                                <button
                                    onClick={() => setShowAddFeatureModal(false)}
                                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                                >
                                    <Icon icon="solar:close-circle-bold" width="24" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Feature ID */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Feature ID <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={newFeature.feature_id}
                                    onChange={(e) => setNewFeature({ ...newFeature, feature_id: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">-- Select Feature ID --</option>
                                    <option value="bills">bills</option>
                                    <option value="giftcard">giftcard</option>
                                    <option value="crypto">crypto</option>
                                    <option value="wallet">wallet</option>
                                    <option value="transfers">transfers</option>
                                    <option value="loans">loans</option>
                                    <option value="forex">forex</option>
                                    <option value="savings">savings</option>
                                    <option value="investments">investments</option>
                                    <option value="insurance">insurance</option>
                                    <option value="pos">pos</option>
                                    <option value="agency">agency</option>
                                </select>
                                <p className="text-xs text-slate-500 mt-1">Select a unique identifier for this feature</p>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Feature Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newFeature.name}
                                    onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
                                    placeholder="e.g., Digital Wallet, Fund Transfers"
                                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Slug */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Slug <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newFeature.slug}
                                    onChange={(e) => setNewFeature({ ...newFeature, slug: e.target.value })}
                                    placeholder="e.g., digital-wallet, fund-transfers"
                                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={newFeature.description}
                                    onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                                    placeholder="Brief description of this feature..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={newFeature.category}
                                    onChange={(e) => setNewFeature({ ...newFeature, category: e.target.value as any })}
                                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="billpayment">Bill Payment</option>
                                    <option value="finance">Finance</option>
                                    <option value="utility">Utility</option>
                                    <option value="communication">Communication</option>
                                </select>
                            </div>

                            {/* Icon */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Icon Name
                                </label>
                                <input
                                    type="text"
                                    value={newFeature.icon_name}
                                    onChange={(e) => setNewFeature({ ...newFeature, icon_name: e.target.value })}
                                    placeholder="e.g., solar:wallet-bold"
                                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <p className="text-xs text-slate-500 mt-1">Use Iconify icon names from Solar icon pack</p>
                            </div>

                            {/* Price */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Base Price (₦)
                                </label>
                                <input
                                    type="number"
                                    value={newFeature.base_price}
                                    onChange={(e) => setNewFeature({ ...newFeature, base_price: Number(e.target.value) || 0 })}
                                    placeholder="0"
                                    min="0"
                                    step="1000"
                                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <p className="text-xs text-slate-500 mt-1">Set to 0 to make this feature free</p>
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={newFeature.is_active}
                                    onChange={(e) => setNewFeature({ ...newFeature, is_active: e.target.checked })}
                                    className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                                    Active (Users can select this feature)
                                </label>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-slate-50 px-6 py-4 rounded-b-2xl border-t border-slate-200 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setShowAddFeatureModal(false)}
                                className="px-5 py-2.5 bg-white border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateFeature}
                                disabled={loading}
                                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Icon icon="solar:refresh-bold" className="animate-spin" width="20" />
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Icon icon="solar:add-circle-bold" width="20" />
                                        <span>Create Feature</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Build Price Card Component
interface BuildPriceCardProps {
    icon: string;
    title: string;
    description: string;
    priceKey: string;
    price: number;
    color: string;
    isEditing: boolean;
    onEdit: () => void;
    onSave: (value: number) => void;
    onCancel: () => void;
}

const BuildPriceCard = ({ icon, title, description, price, color, isEditing, onEdit, onSave, onCancel }: BuildPriceCardProps) => {
    const [editValue, setEditValue] = useState(price);

    useEffect(() => {
        setEditValue(price);
    }, [price]);

    const handleSave = () => {
        if (editValue >= 0) {
            onSave(editValue);
        }
    };

    return (
        <div className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white`}>
                    <Icon icon={icon} width="24" />
                </div>
                {!isEditing && (
                    <button
                        onClick={onEdit}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                    >
                        <Icon icon="solar:pen-bold" width="14" />
                        Edit
                    </button>
                )}
            </div>

            <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
            <p className="text-xs text-slate-500 mb-4">{description}</p>

            {isEditing ? (
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Price (₦)</label>
                        <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(Number(e.target.value))}
                            className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none font-mono text-lg"
                            min="0"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            className={`flex-1 px-4 py-2 bg-gradient-to-r ${color} text-white rounded-lg font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2`}
                        >
                            <Icon icon="solar:check-circle-bold" width="18" />
                            Save
                        </button>
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-3xl font-bold text-slate-900">
                    ₦{price.toLocaleString()}
                </div>
            )}
        </div>
    );
};

export default PricingPlans;
