import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  FiPlus,
  FiUpload,
  FiRefreshCw,
  FiFilter,
  FiX,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiSearch,
} from 'react-icons/fi';
import { bulkImportPricingPlans, deletePricingPlan, deleteAllPricingPlans, getPricingPlans, updatePricingPlan, createPricingPlan } from '../api/adminApi';
import Layout from '../components/Layout';
import PricingBulkImportModal from '../components/PricingBulkImportModal';
import PricingDeleteModal from '../components/PricingDeleteModal';
import PricingEditModal from '../components/PricingEditModal';
import PricingViewModal from '../components/PricingViewModal';
import { useToast } from '../hooks/ToastContext';

const NETWORK_PROVIDERS = [
  { id: 1, name: 'MTN' },
  { id: 2, name: 'Airtel' },
  { id: 3, name: 'Glo' },
  { id: 4, name: '9mobile' },
];

const SOURCE_PROVIDER_LABELS: Record<string, string> = {
  smeplug: 'SMEPlug',
  topupmate: 'TopupMate',
  ibdata: 'VTPLUG',
  manual: 'Manual',
};

const SOURCE_PROVIDER_COLORS: Record<string, string> = {
  smeplug: 'bg-blue-100 text-blue-700',
  topupmate: 'bg-purple-100 text-purple-700',
  ibdata: 'bg-green-100 text-green-700',
  manual: 'bg-slate-100 text-slate-600',
};

const TYPES = ['AIRTIME', 'DATA'];

const PricingPlans: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [page, setPage] = useState(1);
  const [providerId, setProviderId] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const limit = 15;

  const queryClient = useQueryClient();

  const [viewPlan, setViewPlan] = useState<any | null>(null);
  const [editPlan, setEditPlan] = useState<any | null>(null);
  const [deletePlan, setDeletePlan] = useState<any | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const params = {
    page,
    limit,
    ...(providerId && { providerId: parseInt(providerId) }),
    ...(type && { type }),
  };

  const { data, status, refetch } = useQuery({
    queryKey: ['pricing-plans', page, providerId, type],
    queryFn: () => getPricingPlans(params).then((res: any) => res.data?.data),
  });

  const plans = (data?.plans || []).filter((p: any) =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase())
  );
  const total = data?.total || 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      showSuccess('Plans refreshed');
    } catch {
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
    mutationFn: (id: string) => deletePricingPlan(id).then((res: any) => res.data),
    onSuccess: () => {
      setDeletePlan(null);
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      showSuccess('Plan deleted');
    },
    onError: (err: any) => showError(err.response?.data?.message || 'Failed to delete plan'),
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => deleteAllPricingPlans().then((res: any) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      showSuccess('All plans cleared');
    },
    onError: (err: any) => showError(err.response?.data?.message || 'Failed to clear plans'),
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

  const activeFiltersCount = [providerId, type].filter(Boolean).length;

  return (
    <Layout>
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-5">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Pricing Plans</h1>
              <p className="text-xs text-slate-500 mt-0.5">Manage your service pricing across all networks</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold text-green-700">{total.toLocaleString()} Plans</span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                <FiRefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95"
            >
              <FiPlus className="w-3.5 h-3.5" />
              Add Plan
            </button>
            <button
              onClick={() => setShowBulkImport(true)}
              className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
            >
              <FiUpload className="w-3.5 h-3.5 text-blue-500" />
              Bulk Import
            </button>
            <button
              onClick={() => {
                if (window.confirm('Delete ALL plans? This cannot be undone.')) {
                  deleteAllMutation.mutate();
                }
              }}
              disabled={deleteAllMutation.status === 'pending' || total === 0}
              className="flex items-center gap-1.5 bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-50 transition-all shadow-sm disabled:opacity-40"
            >
              <FiTrash2 className="w-3.5 h-3.5" />
              {deleteAllMutation.status === 'pending' ? 'Clearing...' : 'Clear All'}
            </button>
          </div>

          {/* Filters + Search */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Search */}
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search plans by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>

              {/* Network filter */}
              <div className="flex items-center gap-2">
                <FiFilter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={providerId}
                  onChange={(e) => { setProviderId(e.target.value); setPage(1); }}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                >
                  <option value="">All Networks</option>
                  {NETWORK_PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id.toString()}>{p.name}</option>
                  ))}
                </select>

                {/* Type filter */}
                <select
                  value={type}
                  onChange={(e) => { setType(e.target.value); setPage(1); }}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                >
                  <option value="">All Types</option>
                  {TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => { setProviderId(''); setType(''); setPage(1); setSearch(''); }}
                    className="flex items-center gap-1 px-2.5 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-all"
                  >
                    <FiX className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">My Plans</h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {plans.length} shown
              </span>
            </div>

            {status === 'pending' && (
              <div className="py-16 text-center">
                <div className="inline-block animate-spin rounded-full h-7 w-7 border-[3px] border-green-500 border-t-transparent mb-3" />
                <p className="text-xs text-slate-400 font-medium">Loading plans...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="py-12 text-center">
                <p className="text-sm text-red-500 font-medium">Failed to load plans.</p>
              </div>
            )}

            {status === 'success' && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100">
                        <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Plan</th>
                        <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Network</th>
                        <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Source</th>
                        <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Type</th>
                        <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cost</th>
                        <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Price</th>
                        <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {plans.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-14 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                                <FiPlus className="w-6 h-6 text-slate-400" />
                              </div>
                              <p className="text-sm font-bold text-slate-500">No plans found</p>
                              <p className="text-xs text-slate-400">Add your first plan or adjust your filters</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        plans.map((plan: any) => {
                          const sourceLabel = plan.source_provider
                            ? (SOURCE_PROVIDER_LABELS[plan.source_provider] || plan.source_provider)
                            : 'Global';
                          const sourceColor = plan.source_provider
                            ? (SOURCE_PROVIDER_COLORS[plan.source_provider] || 'bg-slate-100 text-slate-600')
                            : 'bg-slate-100 text-slate-500';
                          const costPrice = plan.meta?.original_price || plan.meta?.price || 0;
                          const profit = plan.price && costPrice ? plan.price - costPrice : null;

                          return (
                            <tr key={plan._id || plan.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-slate-800">{plan.name}</span>
                                  {!plan.app_id && (
                                    <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase">System</span>
                                  )}
                                </div>
                                <span className="sm:hidden text-[10px] text-slate-400">{plan.providerName}</span>
                              </td>
                              <td className="px-4 py-3 hidden sm:table-cell">
                                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                  {plan.providerName || '—'}
                                </span>
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${sourceColor}`}>
                                  {sourceLabel}
                                </span>
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                  plan.type === 'DATA' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                                }`}>
                                  {plan.type}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs font-medium text-slate-500">
                                  {costPrice ? `₦${costPrice.toLocaleString()}` : '—'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div>
                                  <span className="text-sm font-black text-green-600">₦{plan.price?.toLocaleString()}</span>
                                  {profit !== null && profit > 0 && (
                                    <div className="text-[9px] font-bold text-blue-500">+₦{profit.toLocaleString()}</div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                  plan.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                                }`}>
                                  {plan.active ? 'Active' : 'Off'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-0.5">
                                  <button
                                    onClick={() => setViewPlan(plan)}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                    title="View"
                                  >
                                    <FiEye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditPlan(plan)}
                                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                    title="Edit"
                                  >
                                    <FiEdit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setDeletePlan(plan)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Delete"
                                  >
                                    <FiTrash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-slate-500">
                    <span className="font-bold text-slate-800">{plans.length}</span> of <span className="font-bold text-slate-800">{total}</span> plans
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-bold text-slate-600 px-2">
                      {page} / {Math.ceil(total / limit) || 1}
                    </span>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={plans.length < limit}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Modals */}
        {viewPlan && <PricingViewModal plan={viewPlan} onClose={() => setViewPlan(null)} />}
        {editPlan && (
          <PricingEditModal
            plan={editPlan}
            onClose={() => setEditPlan(null)}
            onSave={(formData) => {
              if (!editPlan.app_id) {
                createMutation.mutate(formData);
              } else {
                editMutation.mutate(formData);
              }
            }}
            isSaving={editMutation.status === 'pending' || createMutation.status === 'pending'}
          />
        )}
        {deletePlan && (
          <PricingDeleteModal
            plan={deletePlan}
            onClose={() => setDeletePlan(null)}
            onDelete={() => deleteMutation.mutate(deletePlan._id || deletePlan.id)}
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
      </div>
    </Layout>
  );
};

export default PricingPlans;
