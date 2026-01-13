import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getPlans, getFeatures, createPlan, deletePlan, createFeature, deleteFeature } from 'api/superAdminApi';

interface Plan {
    _id: string;
    name: string;
    price: number;
    billing: 'monthly' | 'annual' | 'one-time';
    features: string[];
    status: 'active' | 'inactive';
}

interface AppFeature {
    _id: string;
    name: string;
    description: string;
    price: number;
    category: 'Publishing' | 'Add-on' | 'Service';
}

const PricingPlans = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [features, setFeatures] = useState<AppFeature[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [plansRes, featuresRes] = await Promise.all([
                getPlans(),
                getFeatures()
            ]);

            if (plansRes.data.success) setPlans(plansRes.data.data.plans);
            if (featuresRes.data.success) setFeatures(featuresRes.data.data.features);
        } catch (error) {
            console.error('Failed to fetch pricing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePlan = async (id: string) => {
        if (!confirm('Are you sure you want to delete this plan?')) return;
        try {
            await deletePlan(id);
            fetchData();
        } catch (error) {
            alert('Failed to delete plan');
        }
    };

    const handleDeleteFeature = async (id: string) => {
        if (!confirm('Are you sure you want to delete this feature?')) return;
        try {
            await deleteFeature(id);
            fetchData();
        } catch (error) {
            alert('Failed to delete feature');
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Pricing & Plans</h1>
                    <p className="text-slate-500 mt-1">Manage subscription plans and individual feature pricing</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
                    <Icon icon="solar:add-circle-bold" width="20" height="20" />
                    <span>Create New Plan</span>
                </button>
            </div>

            {/* Subscription Plans Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <Icon icon="solar:card-bold-duotone" className="text-emerald-600" width="20" />
                        Subscription Plans
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Plan Details</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Billing</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Loading plans...</td></tr>
                            ) : plans.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No plans found</td></tr>
                            ) : (
                                plans.map((plan) => (
                                    <tr key={plan._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{plan.name}</span>
                                                <span className="text-xs text-slate-500 mt-1">{plan.features.join(' • ')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-slate-900">₦{plan.price.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-600 capitalize">{plan.billing}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${plan.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                {plan.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                                                    <Icon icon="solar:pen-bold" width="18" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePlan(plan._id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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

            {/* App Features Pricing Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <Icon icon="solar:smartphone-bold-duotone" className="text-blue-600" width="20" />
                        App Features & Publishing
                    </h2>
                    <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        <Icon icon="solar:add-circle-linear" width="18" />
                        Add Feature
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Feature</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">Loading features...</td></tr>
                            ) : features.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No features found</td></tr>
                            ) : (
                                features.map((feature) => (
                                    <tr key={feature._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{feature.name}</span>
                                                <span className="text-xs text-slate-500 mt-0.5">{feature.description}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${feature.category === 'Publishing' ? 'bg-blue-50 text-blue-700' :
                                                feature.category === 'Add-on' ? 'bg-purple-50 text-purple-700' :
                                                    'bg-amber-50 text-amber-700'
                                                }`}>
                                                {feature.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-slate-900">₦{feature.price.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                                    <Icon icon="solar:pen-bold" width="18" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteFeature(feature._id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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

            {/* Info Card */}
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                    <Icon icon="solar:info-circle-bold-duotone" width="24" />
                </div>
                <div>
                    <h3 className="font-bold text-blue-900">Management Note</h3>
                    <p className="text-sm text-blue-700 mt-1">
                        Changes to pricing plans will only affect new subscriptions. Existing subscribers will continue on their current plan until renewal or manual update. Feature pricing is applied at the time of purchase.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PricingPlans;
