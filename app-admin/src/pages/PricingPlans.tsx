import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  bulkImportPricingPlans,
  createPricingPlan,
  deletePricingPlan,
  getPricingPlans,
  updatePricingPlan,
  getProviderData,
<<<<<<< HEAD
  getProviders,
=======
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf
} from '../api/adminApi';
import PricingBulkImportModal from '../components/PricingBulkImportModal';
import PricingDeleteModal from '../components/PricingDeleteModal';
import PricingEditModal from '../components/PricingEditModal';
import PricingViewModal from '../components/PricingViewModal';
import IBDataSyncModal from '../components/IBDataSyncModal';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const PROVIDERS = [
  { id: 1, name: 'MTN' },
  { id: 2, name: 'Airtel' },
  { id: 3, name: 'Glo' },
  { id: 4, name: '9mobile' },
];

const TYPES = ['AIRTIME', 'DATA'];

const PricingPlans: React.FC = () => {
  const [page, setPage] = useState(1);
  const [providerId, setProviderId] = useState<string>('');
  const [type, setType] = useState<string>('');
  const limit = 10;

  const queryClient = useQueryClient();

  const [viewPlan, setViewPlan] = useState<any | null>(null);
  const [editPlan, setEditPlan] = useState<any | null>(null);
  const [deletePlan, setDeletePlan] = useState<any | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showIBDataSync, setShowIBDataSync] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
<<<<<<< HEAD
  const [activeTab, setActiveTab] = useState<string>('my-plans');

  // Fetch active providers for dynamic tabs
  const { data: providersData } = useQuery({
    queryKey: ['active-providers'],
    queryFn: () => getProviders({ active: true }).then((res: any) => res.data?.data?.providers || []),
  });

  const activeProviders = useMemo(() => {
    const providers = providersData || [];
    // Filter out IBData if it's in the list because we'll handle it explicitly as default if needed,
    // or just let it be in the list. The user said "ibdata is default".
    // Let's just use the list, but ensure IBData is always an option if it's the fallback.
    // For now, we'll trust the active list, but if IBData isn't there, we might want to add it?
    // User: "ibdata is defoult". We'll assume it should always be available.
    const hasIbdata = providers.find((p: any) => p.code.toLowerCase() === 'ibdata');
    if (!hasIbdata) {
      return [{ code: 'ibdata', name: 'IBData' }, ...providers];
    }
    return providers;
  }, [providersData]);
=======
  const [activeTab, setActiveTab] = useState<'my-plans' | 'ibdata-plans'>('my-plans');
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf

  const params = {
    page,
    limit,
    ...(providerId && { providerId: parseInt(providerId) }),
    ...(type && { type }),
  };

  const { data, status } = useQuery({
    queryKey: ['pricing-plans', page, providerId, type],
    queryFn: () => getPricingPlans(params).then((res: any) => res.data?.data),
    enabled: activeTab === 'my-plans',
  });

  const plans = data?.plans || [];
  const total = data?.total || 0;

  const editMutation = useMutation({
    mutationFn: (formData: any) =>
      updatePricingPlan(editPlan.id || editPlan._id, formData).then((res: any) => res.data),
    onSuccess: () => {
      setEditPlan(null);
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      deletePricingPlan(deletePlan.id || deletePlan._id).then((res: any) => res.data),
    onSuccess: () => {
      setDeletePlan(null);
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (formData: any) => createPricingPlan(formData).then((res: any) => res.data),
    onSuccess: () => {
      setShowCreateModal(false);
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: (plansData: any[]) =>
      bulkImportPricingPlans(plansData).then((res: any) => res.data),
    onSuccess: () => {
      setShowBulkImport(false);
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
    },
  });

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onMenuClick={() => setIsMobileOpen(true)} />
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-2">Pricing Plans</h1>
                  <p className="text-slate-600">Manage pricing for all providers and service types</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-purple-600">{activeTab === 'my-plans' ? total : 'API'}</p>
                  <p className="text-sm text-slate-600">{activeTab === 'my-plans' ? 'Total Plans' : 'Direct Feed'}</p>
                </div>
              </div>

              {/* Navigation Tabs */}
<<<<<<< HEAD
              <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('my-plans')}
                  className={`px-6 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === 'my-plans' ? 'border-green-600 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  My Pricing Plans
=======
              <div className="flex border-b border-slate-200 mb-8">
                <button
                  onClick={() => setActiveTab('my-plans')}
                  className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'my-plans' ? 'border-green-600 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  My Pricing Plans
                </button>
                <button
                  onClick={() => setActiveTab('ibdata-plans')}
                  className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'ibdata-plans' ? 'border-green-600 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  IBData Direct Plans
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf
                </button>
                {activeProviders.map((p: any) => (
                  <button
                    key={p.code}
                    onClick={() => setActiveTab(p.code)}
                    className={`px-6 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap uppercase ${activeTab === p.code ? 'border-green-600 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                    {p.name} Direct Plans
                  </button>
                ))}
              </div>

              {activeTab === 'my-plans' && (
                <div className="mb-8">
                  {/* Action Buttons */}
                  <div className="flex gap-3 mb-6">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Plan
                    </button>
                    <button
                      onClick={() => setShowBulkImport(true)}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                        />
                      </svg>
                      Bulk Import
                    </button>
                  </div>

                  {/* Filters */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Provider</label>
                        <select
                          value={providerId}
                          onChange={(e) => {
                            setProviderId(e.target.value);
                            setPage(1);
                          }}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-slate-900 font-medium"
                        >
                          <option value="">All Providers</option>
                          {PROVIDERS.map((p) => (
                            <option key={p.id} value={p.id.toString()}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
                        <select
                          value={type}
                          onChange={(e) => {
                            setType(e.target.value);
                            setPage(1);
                          }}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-slate-900 font-medium"
                        >
                          <option value="">All Types</option>
                          {TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => {
                            setProviderId('');
                            setType('');
                            setPage(1);
                          }}
                          className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2.5 rounded-lg transition font-medium"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Plans Table */}
            {activeTab === 'my-plans' ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {status === 'pending' && (
                  <div className="p-6 text-center text-gray-500">Loading plans...</div>
                )}
                {status === 'error' && (
                  <div className="p-6 text-center text-red-500">Failed to load plans.</div>
                )}
                {status === 'success' && (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Plan Name</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Provider</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Price (₦)</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Discount (%)</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {plans.length === 0 && (
                            <tr>
                              <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                No plans found.
                              </td>
                            </tr>
                          )}
                          {plans.map((plan: any) => (
                            <tr key={plan._id || plan.id} className="hover:bg-gray-50 transition">
                              <td className="px-6 py-4 text-sm text-gray-900">{plan.name}</td>
                              <td className="px-6 py-4 text-sm text-gray-900">{plan.providerName}</td>
                              <td className="px-6 py-4 text-sm">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-semibold ${plan.type === 'AIRTIME'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-purple-100 text-purple-800'
                                    }`}
                                >
                                  {plan.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                ₦{plan.price?.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">{plan.discount || 0}%</td>
                              <td className="px-6 py-4 text-sm">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-semibold ${plan.active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}
                                >
                                  {plan.active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm space-x-3">
                                <button
                                  onClick={() => setViewPlan(plan)}
                                  className="inline-flex items-center gap-1.5 text-green-600 hover:text-green-900 font-medium"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                  View
                                </button>
                                <button
                                  onClick={() => setEditPlan(plan)}
                                  className="inline-flex items-center gap-1.5 text-green-600 hover:text-green-900 font-medium"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                  Edit
                                </button>
                                <button
                                  onClick={() => setDeletePlan(plan)}
                                  className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-900 font-medium"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0l1-3h6l1 3" /></svg>
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center text-sm text-gray-600">
                      <span>Showing {plans.length} of {total} plans</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-1">Page {page}</span>
                        <button
                          onClick={() => setPage((p) => p + 1)}
                          disabled={plans.length < limit}
                          className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
<<<<<<< HEAD
              <DirectPlansView providerCode={activeTab} />
=======
              <IBDataPlansView />
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf
            )}
          </div>

          {/* Modals */}
          {viewPlan && <PricingViewModal plan={viewPlan} onClose={() => setViewPlan(null)} />}
          {editPlan && (
            <PricingEditModal
              plan={editPlan}
              onClose={() => setEditPlan(null)}
              onSave={editMutation.mutate}
              isSaving={editMutation.status === 'pending'}
            />
          )}
          {deletePlan && (
            <PricingDeleteModal
              plan={deletePlan}
              onClose={() => setDeletePlan(null)}
              onDelete={deleteMutation.mutate}
              isDeleting={deleteMutation.status === 'pending'}
            />
          )}
          {showCreateModal && (
            <PricingEditModal
              plan={null}
              onClose={() => setShowCreateModal(false)}
              onSave={createMutation.mutate}
              isSaving={createMutation.status === 'pending'}
              isCreate
            />
          )}
          {showBulkImport && (
            <PricingBulkImportModal
              onClose={() => setShowBulkImport(false)}
              onImport={bulkImportMutation.mutate}
              isImporting={bulkImportMutation.status === 'pending'}
            />
          )}
          {showIBDataSync && (
            <IBDataSyncModal onClose={() => setShowIBDataSync(false)} />
          )}
        </main>
      </div>
    </div>
  );
};

<<<<<<< HEAD
interface DirectPlansViewProps {
  providerCode: string;
}

const DirectPlansView: React.FC<DirectPlansViewProps> = ({ providerCode }) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Global Profit Settings
  const [globalProfit, setGlobalProfit] = useState<number>(10);
  const [profitType, setProfitType] = useState<'percent' | 'flat'>('percent');

  // Individual Profit Overrides
  const [customProfits, setCustomProfits] = useState<Record<string, number>>({});

=======
const IBDataPlansView: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profit, setProfit] = useState<number>(10);
  const [profitType, setProfitType] = useState<'percent' | 'flat'>('percent');
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf
  const [searchTerm, setSearchTerm] = useState('');
  const [networkFilter, setNetworkFilter] = useState('');
  const queryClient = useQueryClient();

  const fetchPlans = async () => {
    setLoading(true);
    setError('');
    try {
<<<<<<< HEAD
      const res: any = await getProviderData(providerCode, 'plans');
=======
      const res: any = await getProviderData('ibdata', 'plans');
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf
      let plansData = res.data?.data?.data || res.data?.data || [];
      if (plansData && typeof plansData === 'object' && !Array.isArray(plansData)) {
        if (Array.isArray(plansData.data)) plansData = plansData.data;
        else if (Array.isArray(plansData.plans)) plansData = plansData.plans;
      }
      setPlans(Array.isArray(plansData) ? plansData : []);
    } catch (err: any) {
<<<<<<< HEAD
      setError(err.response?.data?.message || err.message || `Failed to fetch ${providerCode} plans`);
=======
      setError(err.response?.data?.message || err.message || 'Failed to fetch IBData plans');
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  useEffect(() => {
    fetchPlans();
    setCustomProfits({}); // Reset custom profits when provider changes
  }, [providerCode]);

  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      const matchesSearch = (p.plan_name || p.name || '').toLowerCase().includes(searchTerm.toLowerCase());
=======
  React.useEffect(() => {
    fetchPlans();
  }, []);

  const filteredPlans = React.useMemo(() => {
    return plans.filter(p => {
      const matchesSearch = p.plan_name.toLowerCase().includes(searchTerm.toLowerCase());
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf
      const matchesNetwork = networkFilter === '' || String(p.network) === networkFilter;
      return matchesSearch && matchesNetwork;
    });
  }, [plans, searchTerm, networkFilter]);

  const importMutation = useMutation({
    mutationFn: (plansData: any[]) => bulkImportPricingPlans(plansData).then((res: any) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
<<<<<<< HEAD
      toast.success('Plans synced successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to sync plans');
    }
  });

  const getPlanProfit = (planId: string) => {
    return customProfits[planId] !== undefined ? customProfits[planId] : globalProfit;
  };

  const calculateSellingPrice = (price: number, profit: number) => {
    if (profitType === 'percent') {
      return price + (price * (profit / 100));
    }
    return price + profit;
  };

  const formatPlanForSync = (p: any) => {
    const profit = getPlanProfit(p.plan_id || p.id);
    const costPrice = Number(p.price || p.amount || 0);
    const finalPrice = calculateSellingPrice(costPrice, profit);

    return {
      providerId: Number(p.network),
      providerName: getNetworkName(p.network),
      externalPlanId: p.plan_id || p.id,
      code: `${providerCode.toUpperCase()}_${p.plan_id || p.id}`,
      name: p.plan_name || p.name,
      price: Math.ceil(finalPrice),
      type: (p.plan_type || p.type) === 'DATA' ? 'DATA' : 'AIRTIME',
      discount: 0,
      active: true,
      metadata: {
        validity: p.validity,
        data_value: p.data_value,
        original_price: costPrice,
        source_provider: providerCode
      }
    };
  };

  const handleBulkSync = () => {
    const formattedPlans = filteredPlans.map(formatPlanForSync);
    importMutation.mutate(formattedPlans);
  };

  const handleSingleSync = (p: any) => {
    importMutation.mutate([formatPlanForSync(p)]);
  };

=======
      alert('Plans synced successfully!');
    },
  });

  const handleSync = () => {
    const formattedPlans = filteredPlans.map((p: any) => {
      let finalPrice = Number(p.price);
      if (profitType === 'percent') {
        finalPrice = finalPrice + (finalPrice * (profit / 100));
      } else {
        finalPrice = finalPrice + profit;
      }

      return {
        providerId: Number(p.network),
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

>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf
  const getNetworkName = (id: string) => {
    const map: Record<string, string> = { '1': 'MTN', '2': 'AIRTEL', '3': 'GLO', '4': '9MOBILE' };
    return map[id] || 'UNKNOWN';
  };

<<<<<<< HEAD
  if (loading) return <div className="p-12 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div><p className="mt-4 text-slate-500">Fetching plans...</p></div>;
=======
  if (loading) return <div className="p-12 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div><p className="mt-4 text-slate-500">Fetching IBData plans...</p></div>;
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf
  if (error) return <div className="p-12 text-center text-red-500"><p>{error}</p><button onClick={fetchPlans} className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg">Retry</button></div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-wrap gap-6 items-end">
          <div className="flex-1 min-w-[200px]">
<<<<<<< HEAD
            <label className="block text-sm font-bold text-slate-700 mb-2">Global Profit Type</label>
=======
            <label className="block text-sm font-bold text-slate-700 mb-2">Profit Type</label>
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf
            <select value={profitType} onChange={(e) => setProfitType(e.target.value as any)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white">
              <option value="percent">Percentage Profit (%)</option>
              <option value="flat">Flat Profit (₦)</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
<<<<<<< HEAD
            <label className="block text-sm font-bold text-slate-700 mb-2">Global Profit Value</label>
            <input
              type="number"
              value={globalProfit}
              onChange={(e) => {
                setGlobalProfit(Number(e.target.value));
                setCustomProfits({}); // Reset custom profits when global changes to apply to all
              }}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <button onClick={handleBulkSync} disabled={importMutation.status === 'pending' || filteredPlans.length === 0} className="bg-green-600 hover:bg-green-700 text-white px-8 py-2.5 rounded-lg font-bold transition shadow-lg shadow-green-100 disabled:opacity-50">
            {importMutation.status === 'pending' ? 'Syncing...' : `Sync ${filteredPlans.length} Plans`}
=======
            <label className="block text-sm font-bold text-slate-700 mb-2">Profit Value</label>
            <input type="number" value={profit} onChange={(e) => setProfit(Number(e.target.value))} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
          </div>
          <button onClick={handleSync} disabled={importMutation.status === 'pending' || filteredPlans.length === 0} className="bg-green-600 hover:bg-green-700 text-white px-8 py-2.5 rounded-lg font-bold transition shadow-lg shadow-green-100 disabled:opacity-50">
            {importMutation.status === 'pending' ? 'Syncing...' : `Sync ${filteredPlans.length} Plans to My Store`}
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf
          </button>
        </div>

        <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
          <div className="flex-1 min-w-[250px]">
            <input
              type="text"
              placeholder="Search plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <div className="w-48">
            <select
              value={networkFilter}
              onChange={(e) => setNetworkFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
            >
              <option value="">All Networks</option>
              <option value="1">MTN</option>
              <option value="2">Airtel</option>
              <option value="3">Glo</option>
              <option value="4">9Mobile</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-slate-700">Network</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-700">Plan Name</th>
<<<<<<< HEAD
                <th className="px-6 py-4 text-sm font-bold text-slate-700">Cost Price</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-700 w-32">Profit ({profitType === 'percent' ? '%' : '₦'})</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-700">Selling Price</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-700">Actions</th>
=======
                <th className="px-6 py-4 text-sm font-bold text-slate-700">Cost Price (API)</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-700">Selling Price (With Profit)</th>
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlans.length === 0 ? (
                <tr>
<<<<<<< HEAD
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">No plans match your filters.</td>
                </tr>
              ) : (
                filteredPlans.map((p: any) => {
                  const planId = p.plan_id || p.id;
                  const profit = getPlanProfit(planId);
                  const costPrice = Number(p.price || p.amount || 0);
                  const sellingPrice = calculateSellingPrice(costPrice, profit);

                  return (
                    <tr key={planId} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">{getNetworkName(p.network)}</td>
                      <td className="px-6 py-4 text-sm text-slate-900 font-bold">{p.plan_name || p.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">₦{costPrice}</td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={profit}
                          onChange={(e) => setCustomProfits(prev => ({ ...prev, [planId]: Number(e.target.value) }))}
                          className="w-24 px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-green-500 outline-none text-sm"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-green-600 font-black">₦{Math.ceil(sellingPrice)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleSingleSync(p)}
                          className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-xs font-bold transition"
                        >
                          Sync
                        </button>
                      </td>
=======
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">No plans match your filters.</td>
                </tr>
              ) : (
                filteredPlans.map((p: any) => {
                  const sellingPrice = profitType === 'percent' ? p.price + (p.price * profit / 100) : p.price + profit;
                  return (
                    <tr key={p.plan_id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">{getNetworkName(p.network)}</td>
                      <td className="px-6 py-4 text-sm text-slate-900 font-bold">{p.plan_name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">₦{p.price}</td>
                      <td className="px-6 py-4 text-sm text-green-600 font-black">₦{Math.ceil(sellingPrice)}</td>
>>>>>>> 405d039a6eb8513f04dd65c9ddf2219984df5baf
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PricingPlans;
