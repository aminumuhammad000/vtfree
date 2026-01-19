import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiPlus,
  FiUpload,
  FiRefreshCw,
  FiFilter,
  FiX,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiSearch,
  FiSettings,
  FiArrowRight
} from 'react-icons/fi';
import {
  bulkImportPricingPlans,
  createPricingPlan,
  deletePricingPlan,
  getPricingPlans,
  updatePricingPlan,
  getProviderData,
  getProviders,
} from '../api/adminApi';
import Layout from '../components/Layout';
import PricingBulkImportModal from '../components/PricingBulkImportModal';
import PricingDeleteModal from '../components/PricingDeleteModal';
import PricingEditModal from '../components/PricingEditModal';
import PricingViewModal from '../components/PricingViewModal';
import IBDataSyncModal from '../components/IBDataSyncModal';
import { useToast } from '../hooks/ToastContext';

const PROVIDERS = [
  { id: 1, name: 'MTN' },
  { id: 2, name: 'Airtel' },
  { id: 3, name: 'Glo' },
  { id: 4, name: '9mobile' },
];

const TYPES = ['AIRTIME', 'DATA'];

const PricingPlans: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [page, setPage] = useState(1);
  const [providerId, setProviderId] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const limit = 10;

  const queryClient = useQueryClient();

  const [viewPlan, setViewPlan] = useState<any | null>(null);
  const [editPlan, setEditPlan] = useState<any | null>(null);
  const [deletePlan, setDeletePlan] = useState<any | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showIBDataSync, setShowIBDataSync] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('my-plans');

  // Fetch active providers for dynamic tabs
  const { data: providersData } = useQuery({
    queryKey: ['active-providers'],
    queryFn: () => getProviders({ active: true }).then((res: any) => res.data?.data?.providers || []),
  });

  const activeProviders = useMemo(() => {
    const providers = providersData || [];
    const hasIbdata = providers.find((p: any) => p.code.toLowerCase() === 'ibdata');
    if (!hasIbdata) {
      return [{ code: 'ibdata', name: 'IBData' }, ...providers];
    }
    return providers;
  }, [providersData]);

  const params = {
    page,
    limit,
    ...(providerId && { providerId: parseInt(providerId) }),
    ...(type && { type }),
  };

  const { data, status, refetch } = useQuery({
    queryKey: ['pricing-plans', page, providerId, type],
    queryFn: () => getPricingPlans(params).then((res: any) => res.data?.data),
    enabled: activeTab === 'my-plans',
  });

  const plans = data?.plans || [];
  const total = data?.total || 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      showSuccess('Pricing plans updated');
    } catch (err) {
      showError('Failed to refresh plans');
    } finally {
      setIsRefreshing(false);
    }
  };

  const editMutation = useMutation({
    mutationFn: (formData: any) =>
      updatePricingPlan(editPlan.id || editPlan._id, formData).then((res: any) => res.data),
    onSuccess: () => {
      setEditPlan(null);
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      showSuccess('Plan updated successfully');
    },
    onError: (err: any) => showError(err.response?.data?.message || 'Failed to update plan'),
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      deletePricingPlan(deletePlan.id || deletePlan._id).then((res: any) => res.data),
    onSuccess: () => {
      setDeletePlan(null);
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      showSuccess('Plan deleted successfully');
    },
    onError: (err: any) => showError(err.response?.data?.message || 'Failed to delete plan'),
  });

  const createMutation = useMutation({
    mutationFn: (formData: any) => createPricingPlan(formData).then((res: any) => res.data),
    onSuccess: () => {
      setShowCreateModal(false);
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      showSuccess('Plan created successfully');
    },
    onError: (err: any) => showError(err.response?.data?.message || 'Failed to create plan'),
  });

  const bulkImportMutation = useMutation({
    mutationFn: (plansData: any[]) =>
      bulkImportPricingPlans(plansData).then((res: any) => res.data),
    onSuccess: () => {
      setShowBulkImport(false);
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      showSuccess('Plans imported successfully');
    },
    onError: (err: any) => showError(err.response?.data?.message || 'Failed to import plans'),
  });

  return (
    <Layout>
      <div className="p-3 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-2 tracking-tight">Pricing Plans</h1>
              <p className="text-sm sm:text-lg text-slate-600 font-medium">Manage service pricing across all providers</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50 group"
              >
                <FiRefreshCw className={`w-4 h-4 text-green-600 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <div className="flex-1 sm:flex-none relative bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-md px-4 py-2 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 bg-white/10 rounded-full blur-xl"></div>
                <div className="relative">
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-100 opacity-80">{activeTab === 'my-plans' ? 'Total Plans' : 'API Feed'}</p>
                  <p className="text-xl font-black">{activeTab === 'my-plans' ? total.toLocaleString() : 'LIVE'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar scroll-smooth">
            <button
              onClick={() => setActiveTab('my-plans')}
              className={`px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === 'my-plans' ? 'border-green-600 text-green-600 bg-green-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              My Pricing Plans
            </button>
            {activeProviders.map((p: any) => (
              <button
                key={p.code}
                onClick={() => setActiveTab(p.code)}
                className={`px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap uppercase flex items-center gap-2 ${activeTab === p.code ? 'border-green-600 text-green-600 bg-green-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                {p.name} Direct
              </button>
            ))}
          </div>

          {activeTab === 'my-plans' && (
            <div className="space-y-6">
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md font-bold active:scale-95"
                >
                  <FiPlus className="w-5 h-5" />
                  <span>Add New Plan</span>
                </button>
                <button
                  onClick={() => setShowBulkImport(true)}
                  className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-2.5 rounded-xl hover:bg-slate-50 transition-all shadow-sm font-bold active:scale-95"
                >
                  <FiUpload className="w-5 h-5 text-blue-600" />
                  <span>Bulk Import</span>
                </button>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <FiFilter className="text-slate-400" />
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Filter Plans</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Provider</label>
                    <select
                      value={providerId}
                      onChange={(e) => {
                        setProviderId(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-bold text-slate-700"
                    >
                      <option value="">All Providers</option>
                      {PROVIDERS.map((p) => (
                        <option key={p.id} value={p.id.toString()}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Service Type</label>
                    <select
                      value={type}
                      onChange={(e) => {
                        setType(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-bold text-slate-700"
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
                      className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-3 rounded-xl transition-all font-bold"
                    >
                      <FiX />
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Plans Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">Configured Plans</h2>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider">Active Database</span>
                  </div>
                </div>

                {status === 'pending' && (
                  <div className="p-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent mb-4"></div>
                    <p className="text-slate-500 font-medium">Loading plans...</p>
                  </div>
                )}

                {status === 'error' && (
                  <div className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4">
                      <FiTrash2 className="w-6 h-6" />
                    </div>
                    <p className="text-red-500 font-medium">Failed to load plans.</p>
                  </div>
                )}

                {status === 'success' && (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Plan Name</th>
                            <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Provider</th>
                            <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Type</th>
                            <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Price</th>
                            <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Discount</th>
                            <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {plans.length === 0 && (
                            <tr>
                              <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic">No pricing plans found.</td>
                            </tr>
                          )}
                          {plans.map((plan: any) => (
                            <tr key={plan._id || plan.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-4 sm:px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-slate-900">{plan.name}</span>
                                  <span className="sm:hidden text-[10px] font-medium text-slate-500 uppercase">{plan.providerName} • {plan.type}</span>
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                                <span className="text-xs font-bold text-slate-600 uppercase bg-slate-100 px-2 py-1 rounded">{plan.providerName}</span>
                              </td>
                              <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                                <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${plan.type === 'AIRTIME' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>
                                  {plan.type}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-4">
                                <span className="text-sm sm:text-base font-black text-slate-900">₦{plan.price?.toLocaleString()}</span>
                              </td>
                              <td className="px-4 sm:px-6 py-4 hidden lg:table-cell">
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{plan.discount || 0}% Off</span>
                              </td>
                              <td className="px-4 sm:px-6 py-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${plan.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {plan.active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => setViewPlan(plan)}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                    title="View Details"
                                  >
                                    <FiEye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setEditPlan(plan)}
                                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                                    title="Edit Plan"
                                  >
                                    <FiEdit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeletePlan(plan)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                    title="Delete Plan"
                                  >
                                    <FiTrash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Section */}
                    <div className="p-4 sm:p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-xs sm:text-sm font-bold text-slate-500">
                        Showing <span className="text-slate-900">{plans.length}</span> of <span className="text-slate-900">{total}</span> plans
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
                        >
                          Previous
                        </button>
                        <div className="flex items-center gap-1 px-2">
                          <span className="text-xs font-bold text-slate-900">{page}</span>
                          <span className="text-xs font-bold text-slate-400">/</span>
                          <span className="text-xs font-bold text-slate-400">{Math.ceil(total / limit) || 1}</span>
                        </div>
                        <button
                          onClick={() => setPage((p) => p + 1)}
                          disabled={plans.length < limit}
                          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab !== 'my-plans' && (
            <DirectPlansView providerCode={activeTab} />
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
      </div>
    </Layout>
  );
};

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

  const [searchTerm, setSearchTerm] = useState('');
  const [networkFilter, setNetworkFilter] = useState('');
  const queryClient = useQueryClient();

  const fetchPlans = async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await getProviderData(providerCode, 'plans');
      let plansData = res.data?.data?.data || res.data?.data || [];
      if (plansData && typeof plansData === 'object' && !Array.isArray(plansData)) {
        if (Array.isArray(plansData.data)) plansData = plansData.data;
        else if (Array.isArray(plansData.plans)) plansData = plansData.plans;
      }
      setPlans(Array.isArray(plansData) ? plansData : []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || `Failed to fetch ${providerCode} plans`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    setCustomProfits({}); // Reset custom profits when provider changes
  }, [providerCode]);

  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      const matchesSearch = (p.plan_name || p.name || p.plan_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesNetwork = networkFilter === '' || String(p.network) === networkFilter;
      return matchesSearch && matchesNetwork;
    });
  }, [plans, searchTerm, networkFilter]);

  const importMutation = useMutation({
    mutationFn: (plansData: any[]) => bulkImportPricingPlans(plansData).then((res: any) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
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

  const getNetworkName = (id: string) => {
    const map: Record<string, string> = { '1': 'MTN', '2': 'AIRTEL', '3': 'GLO', '4': '9MOBILE' };
    return map[id] || 'UNKNOWN';
  };

  if (loading) return (
    <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mb-4"></div>
      <p className="text-slate-500 font-bold">Fetching live plans from {providerCode.toUpperCase()}...</p>
    </div>
  );

  if (error) return (
    <div className="p-12 text-center bg-red-50 rounded-2xl border border-red-100">
      <FiTrash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <p className="text-red-700 font-bold mb-4">{error}</p>
      <button onClick={fetchPlans} className="bg-red-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-red-700 transition-all shadow-sm">Retry Connection</button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Profit Settings Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <FiSettings className="text-green-600 w-5 h-5" />
          <h2 className="text-lg font-bold text-slate-900">Profit Configuration</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Profit Type</label>
            <select
              value={profitType}
              onChange={(e) => setProfitType(e.target.value as any)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none font-bold text-slate-700"
            >
              <option value="percent">Percentage (%)</option>
              <option value="flat">Flat Fee (₦)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Global Profit Value</label>
            <input
              type="number"
              value={globalProfit}
              onChange={(e) => {
                setGlobalProfit(Number(e.target.value));
                setCustomProfits({});
              }}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none font-bold text-slate-700"
            />
          </div>
          <button
            onClick={handleBulkSync}
            disabled={importMutation.status === 'pending' || filteredPlans.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {importMutation.status === 'pending' ? <FiRefreshCw className="animate-spin" /> : <FiCheckCircle />}
            <span>{importMutation.status === 'pending' ? 'Syncing...' : `Sync ${filteredPlans.length} Plans`}</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search live plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none font-medium"
            />
          </div>
          <div className="sm:w-64">
            <select
              value={networkFilter}
              onChange={(e) => setNetworkFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none font-bold text-slate-700"
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

      {/* Live Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Network</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Plan Details</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cost</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-32">Profit</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Selling</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">No plans match your filters.</td>
                </tr>
              ) : (
                filteredPlans.map((p: any) => {
                  const planId = p.plan_id || p.id;
                  const profit = getPlanProfit(planId);
                  const costPrice = Number(p.price || p.amount || 0);
                  const sellingPrice = calculateSellingPrice(costPrice, profit);

                  return (
                    <tr key={planId} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-600 uppercase bg-slate-100 px-2 py-1 rounded">{getNetworkName(p.network)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{p.plan_name || p.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {planId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">₦{costPrice}</td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">{profitType === 'percent' ? '%' : '₦'}</span>
                          <input
                            type="number"
                            value={profit}
                            onChange={(e) => setCustomProfits(prev => ({ ...prev, [planId]: Number(e.target.value) }))}
                            className="w-20 pl-6 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-xs font-bold"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-green-600">₦{Math.ceil(sellingPrice).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleSingleSync(p)}
                          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
                        >
                          <FiArrowRight />
                          Sync
                        </button>
                      </td>
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
