import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState, useEffect } from 'react';
import {
  FiPlus,
  FiRefreshCw,
  FiFilter,
  FiX,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiActivity,
  FiSettings,
  FiServer,
  FiGlobe,
  FiLock,
  FiKey,
  FiUser,
  FiLayers,
  FiZap
} from 'react-icons/fi';
import {
  createProvider,
  deleteProvider,
  getProviders,
  testProviderConnection,
  updateProvider,
  testProviderPurchase,
  getProviderData
} from '../api/adminApi';
import Layout from '../components/Layout';
import IBDataSyncModal from '../components/IBDataSyncModal';
import { useToast } from '../hooks/ToastContext';

const ALL_SERVICES = ['airtime', 'data', 'cable', 'electricity', 'exampin'];

const TestPurchaseForm: React.FC<{ providerCode: string }> = ({ providerCode }) => {
  const [type, setType] = useState<'airtime' | 'data'>('airtime');
  const [phone, setPhone] = useState('');
  const [network, setNetwork] = useState('');
  const [plan, setPlan] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);

  useEffect(() => {
    if (type === 'data') {
      fetchPlans();
    }
  }, [type, providerCode]);

  const fetchPlans = async () => {
    setPlansLoading(true);
    try {
      const res: any = await getProviderData(providerCode, 'plans');
      let plansData = res.data?.data?.data || res.data?.data || [];
      if (plansData && typeof plansData === 'object' && !Array.isArray(plansData)) {
        if (Array.isArray(plansData.data)) plansData = plansData.data;
        else if (Array.isArray(plansData.plans)) plansData = plansData.plans;
      }
      setPlans(Array.isArray(plansData) ? plansData : []);
    } catch (e) {
      console.error('Failed to fetch plans', e);
    } finally {
      setPlansLoading(false);
    }
  };

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res: any = await testProviderPurchase(providerCode, {
        type,
        phone,
        network,
        plan: type === 'data' ? plan : undefined,
        amount: type === 'airtime' ? Number(amount) : undefined
      });
      setResult({ success: true, data: res.data?.data?.result });
    } catch (e: any) {
      setResult({ success: false, error: e.response?.data?.message || e.message || 'Test purchase failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleTest} className="space-y-5">
        <div className="flex p-1.5 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setType('airtime')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${type === 'airtime' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Airtime
          </button>
          <button
            type="button"
            onClick={() => setType('data')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${type === 'data' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Data
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Phone Number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08012345678"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Network</label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-bold text-slate-700"
              required
            >
              <option value="">Select Network</option>
              <option value="mtn">MTN</option>
              <option value="airtel">Airtel</option>
              <option value="glo">GLO</option>
              <option value="9mobile">9Mobile</option>
            </select>
          </div>

          {type === 'airtime' ? (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-bold"
                required
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Data Plan</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-bold text-slate-700"
                required
                disabled={plansLoading}
              >
                <option value="">{plansLoading ? 'Loading plans...' : 'Select Plan'}</option>
                {plans.map((p: any) => (
                  <option key={p.id || p._id || p.plan_id} value={p.id || p._id || p.plan_id}>
                    {p.name || p.plan_name || p.allowance} - ₦{p.price || p.amount}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 active:scale-95"
        >
          {loading ? 'Processing...' : `Test ${type === 'airtime' ? 'Airtime' : 'Data'} Purchase`}
        </button>
      </form>

      {result && (
        <div className={`p-4 rounded-2xl border ${result.success ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
          <p className={`text-xs font-bold mb-2 uppercase tracking-wider ${result.success ? 'text-green-700' : 'text-red-700'}`}>
            {result.success ? '✓ Purchase Successful' : '✗ Purchase Failed'}
          </p>
          <pre className="text-[10px] bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-slate-100 overflow-auto max-h-40 font-mono">
            {JSON.stringify(result.data || result.error, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

const Providers: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [filters, setFilters] = useState<{ active: string | '' }>({ active: '' });
  const [testItem, setTestItem] = useState<any | null>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const queryClient = useQueryClient();

  const { data, status, refetch } = useQuery({
    queryKey: ['providers', filters.active],
    queryFn: () => getProviders(filters.active === '' ? undefined : { active: filters.active === 'true' }).then((r: any) => r.data?.data),
  });

  const providers = useMemo(() => {
    const list = data?.providers || [];
    return [...list].sort((a, b) => {
      if (a.code === 'ibdata') return -1;
      if (b.code === 'ibdata') return 1;
      return (a.priority || 0) - (b.priority || 0);
    });
  }, [data]);

  const total = data?.total || 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      showSuccess('Providers list updated');
    } catch (err) {
      showError('Failed to refresh providers');
    } finally {
      setIsRefreshing(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => createProvider(payload).then((r: any) => r.data),
    onSuccess: () => {
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      showSuccess('Provider added successfully');
      resetForm();
    },
    onError: (err: any) => showError(err.response?.data?.message || 'Failed to add provider'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateProvider(id, payload).then((r: any) => r.data),
    onSuccess: () => {
      setEditItem(null);
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      showSuccess('Provider updated successfully');
    },
    onError: (err: any) => showError(err.response?.data?.message || 'Failed to update provider'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProvider(id).then((r: any) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      showSuccess('Provider deleted successfully');
    },
    onError: (err: any) => showError(err.response?.data?.message || 'Failed to delete provider'),
  });

  const [form, setForm] = useState({
    name: '',
    code: '',
    base_url: '',
    api_key: '',
    secret_key: '',
    username: '',
    password: '',
    active: true as boolean,
    priority: 1 as number,
    supported_services: [] as string[],
  });

  const [, setErrors] = useState<Record<string, string>>({});

  const canSubmit = useMemo(() => form.name && form.code, [form]);

  const resetForm = () => {
    setForm({ name: '', code: '', base_url: '', api_key: '', secret_key: '', username: '', password: '', active: true, priority: 1, supported_services: [] });
    setErrors({});
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { setErrors((p) => ({ ...p, name: 'Required' })); return; }
    if (!form.code) { setErrors((p) => ({ ...p, code: 'Required' })); return; }
    createMutation.mutate({ ...form, code: form.code.toLowerCase() });
  };

  const toggleActive = (p: any) => {
    updateMutation.mutate({ id: p._id, payload: { active: !p.active } });
  };

  const testConnection = async (p: any) => {
    setTestItem(p);
    setTestResults(null);
    setTestLoading(true);
    try {
      const res: any = await testProviderConnection(p.code);
      setTestResults(res.data?.data?.test || {});
    } catch (e: any) {
      setTestResults({ error: e.response?.data?.message || e.message || 'Failed to test connection' });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-3 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-2 tracking-tight">Bill Providers</h1>
              <p className="text-sm sm:text-lg text-slate-600 font-medium">Manage external bill payment APIs and connections</p>
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
              <div className="flex-1 sm:flex-none relative bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-md px-4 py-2 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 bg-white/10 rounded-full blur-xl"></div>
                <div className="relative">
                  <p className="text-xs font-bold uppercase tracking-wider text-green-100 opacity-80">Total</p>
                  <p className="text-xl font-black">{total}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action & Filter Bar */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
              <button
                onClick={() => { resetForm(); setIsCreateOpen(true); }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md font-bold active:scale-95"
              >
                <FiPlus className="w-5 h-5" />
                <span>Add Provider</span>
              </button>

              <button
                onClick={() => setIsSyncOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-2.5 rounded-xl hover:bg-slate-50 transition-all shadow-sm font-bold active:scale-95"
              >
                <FiRefreshCw className="w-5 h-5 text-blue-600" />
                <span>Sync IBData Plans</span>
              </button>
            </div>

            <div className="w-full lg:w-48">
              <div className="relative">
                <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={filters.active}
                  onChange={(e) => setFilters({ active: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-bold text-slate-700 appearance-none"
                >
                  <option value="">All Status</option>
                  <option value="true">Active Only</option>
                  <option value="false">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Providers Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">Connected Services</h2>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider">Live Monitoring</span>
              </div>
            </div>

            {status === 'pending' && (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent mb-4"></div>
                <p className="text-slate-500 font-medium">Loading providers...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4">
                  <FiTrash2 className="w-6 h-6" />
                </div>
                <p className="text-red-500 font-medium">Failed to load providers.</p>
              </div>
            )}

            {status === 'success' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Provider</th>
                      <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Services</th>
                      <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell text-center">Priority</th>
                      <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {providers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">No providers found matching your filters.</td>
                      </tr>
                    )}
                    {providers.map((p: any) => (
                      <tr key={p._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center text-slate-600 font-bold text-xs shadow-sm group-hover:scale-110 transition-transform">
                              {p.name.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900">{p.name}</span>
                              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{p.code}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {(p.supported_services || []).map((s: string) => (
                              <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase border border-slate-200">
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 hidden md:table-cell text-center">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black ${p.priority === 1 ? 'bg-green-100 text-green-700' : p.priority === 2 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                            {p.priority}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${p.active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${p.active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            {p.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditItem(p)}
                              className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                              title="Edit Provider"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleActive(p)}
                              className={`p-2 rounded-xl transition-all ${p.active ? 'text-amber-400 hover:text-amber-600 hover:bg-amber-50' : 'text-green-400 hover:text-green-600 hover:bg-green-50'}`}
                              title={p.active ? 'Disable' : 'Enable'}
                            >
                              {p.active ? <FiX className="w-4 h-4" /> : <FiCheckCircle className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => testConnection(p)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                              title="Test Connection"
                            >
                              <FiActivity className="w-4 h-4" />
                            </button>
                            {p.code !== 'ibdata' && (
                              <button
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this provider?')) {
                                    deleteMutation.mutate(p._id);
                                  }
                                }}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                title="Delete Provider"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Modal */}
        {(isCreateOpen || editItem) && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-100">
                    <FiServer className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{editItem ? 'Edit Provider' : 'Add New Provider'}</h3>
                </div>
                <button
                  onClick={() => { setIsCreateOpen(false); setEditItem(null); resetForm(); }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 max-h-[75vh] overflow-y-auto">
                <form onSubmit={editItem ? (e) => { e.preventDefault(); updateMutation.mutate({ id: editItem._id, payload: editItem }); } : onSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <FiLayers className="w-3 h-3" />
                        Basic Configuration
                      </h4>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Provider Name</label>
                        <input
                          value={editItem ? editItem.name : form.name}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            if (editItem) setEditItem({ ...editItem, name: val });
                            else setForm({ ...form, name: val });
                          }}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none font-bold text-slate-700"
                          placeholder="e.g. IBDATA"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Provider Code</label>
                        <select
                          value={editItem ? editItem.code : form.code}
                          onChange={(e) => {
                            const code = e.target.value;
                            const nameMap: Record<string, string> = {
                              ibdata: 'IBDATA',
                              smeplug: 'SME PLUG',
                              topupmate: 'TOPUPMATE'
                            };
                            if (editItem) setEditItem({ ...editItem, code, name: nameMap[code] || editItem.name });
                            else setForm({ ...form, code, name: nameMap[code] || form.name });
                          }}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none font-bold text-slate-700"
                        >
                          <option value="">Select Code</option>
                          <option value="ibdata">IBData</option>
                          <option value="smeplug">SME Plug</option>
                          <option value="topupmate">Topupmate</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Base URL</label>
                        <div className="relative">
                          <FiGlobe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            value={editItem ? editItem.base_url : form.base_url}
                            onChange={(e) => {
                              if (editItem) setEditItem({ ...editItem, base_url: e.target.value });
                              else setForm({ ...form, base_url: e.target.value });
                            }}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none font-medium text-slate-600"
                            placeholder="https://api.provider.com"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Authentication */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <FiLock className="w-3 h-3" />
                        Authentication
                      </h4>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">API Key</label>
                        <div className="relative">
                          <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="password"
                            value={editItem ? editItem.api_key : form.api_key}
                            onChange={(e) => {
                              if (editItem) setEditItem({ ...editItem, api_key: e.target.value });
                              else setForm({ ...form, api_key: e.target.value });
                            }}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none font-mono text-slate-600"
                            placeholder="••••••••••••••••"
                            disabled={(editItem?.code || form.code) === 'ibdata'}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Secret Key / Password</label>
                        <div className="relative">
                          <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="password"
                            value={editItem ? editItem.secret_key : form.secret_key}
                            onChange={(e) => {
                              if (editItem) setEditItem({ ...editItem, secret_key: e.target.value });
                              else setForm({ ...form, secret_key: e.target.value });
                            }}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none font-mono text-slate-600"
                            placeholder="••••••••••••••••"
                            disabled={(editItem?.code || form.code) === 'ibdata'}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Username (Optional)</label>
                        <div className="relative">
                          <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            value={editItem ? editItem.username : form.username}
                            onChange={(e) => {
                              if (editItem) setEditItem({ ...editItem, username: e.target.value });
                              else setForm({ ...form, username: e.target.value });
                            }}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none font-medium text-slate-600"
                            placeholder="admin_user"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <FiSettings className="w-3 h-3" />
                        Operational Settings
                      </h4>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <div>
                          <p className="text-sm font-bold text-slate-700">Provider Priority</p>
                          <p className="text-[10px] text-slate-500">Lower numbers have higher priority</p>
                        </div>
                        <select
                          value={editItem ? editItem.priority : form.priority}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (editItem) setEditItem({ ...editItem, priority: val });
                            else setForm({ ...form, priority: val });
                          }}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-black text-slate-700 outline-none focus:ring-2 focus:ring-green-500/20"
                        >
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                        </select>
                      </div>
                      <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer group">
                        <div>
                          <p className="text-sm font-bold text-slate-700 group-hover:text-green-600 transition-colors">Active Status</p>
                          <p className="text-[10px] text-slate-500">Enable or disable this provider globally</p>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={editItem ? editItem.active : form.active}
                            onChange={(e) => {
                              const val = e.target.checked;
                              if (editItem) setEditItem({ ...editItem, active: val });
                              else setForm({ ...form, active: val });
                            }}
                            className="sr-only"
                          />
                          <div className={`w-10 h-6 rounded-full transition-colors ${(editItem ? editItem.active : form.active) ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${(editItem ? editItem.active : form.active) ? 'translate-x-4' : ''}`}></div>
                        </div>
                      </label>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <FiZap className="w-3 h-3" />
                        Supported Services
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {ALL_SERVICES.map(s => {
                          const isSupported = (editItem ? (editItem.supported_services || []) : form.supported_services).includes(s);
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                if (editItem) {
                                  const services = editItem.supported_services || [];
                                  setEditItem({ ...editItem, supported_services: services.includes(s) ? services.filter((x: string) => x !== s) : [...services, s] });
                                } else {
                                  const services = form.supported_services;
                                  setForm({ ...form, supported_services: services.includes(s) ? services.filter(x => x !== s) : [...services, s] });
                                }
                              }}
                              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${isSupported ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-100' : 'bg-white text-slate-500 border-slate-200 hover:border-green-300 hover:text-green-600'}`}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => { setIsCreateOpen(false); setEditItem(null); resetForm(); }}
                      className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!canSubmit || createMutation.status === 'pending' || updateMutation.status === 'pending'}
                      className="flex-[2] px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 active:scale-95"
                    >
                      {createMutation.status === 'pending' || updateMutation.status === 'pending' ? 'Saving...' : 'Save Provider'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Test Connection Modal */}
        {testItem && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                    <FiActivity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Test Provider: {testItem.name}</h3>
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{testItem.code}</p>
                  </div>
                </div>
                <button
                  onClick={() => setTestItem(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Connection Status */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <FiServer className="text-blue-600" />
                        Connection Status
                      </h3>
                      <button
                        disabled={testLoading}
                        onClick={() => testConnection(testItem)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg transition-all"
                      >
                        <FiRefreshCw className={`w-3.5 h-3.5 ${testLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                    </div>

                    {testLoading ? (
                      <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mb-4"></div>
                        <p className="text-slate-500 font-bold">Pinging provider API...</p>
                      </div>
                    ) : testResults ? (
                      <div className="space-y-4">
                        {testResults.error ? (
                          <div className="p-5 bg-red-50 border border-red-200 rounded-2xl">
                            <div className="flex items-center gap-2 text-red-800 font-black mb-2">
                              <FiX className="w-5 h-5" />
                              Connection Failed
                            </div>
                            <p className="text-red-600 text-sm font-medium leading-relaxed">{testResults.error}</p>
                          </div>
                        ) : (
                          <>
                            {/* Balance Card */}
                            <div className={`p-5 rounded-2xl border-2 transition-all ${testResults.balanceStatus === 'success' ? 'border-green-100 bg-green-50/30' : 'border-red-100 bg-red-50/30'}`}>
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Wallet Balance</span>
                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${testResults.balanceStatus === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                  {testResults.balanceStatus === 'success' ? 'Online' : 'Offline'}
                                </span>
                              </div>
                              {testResults.balanceStatus === 'success' ? (
                                <div className="flex items-baseline gap-2">
                                  <span className="text-3xl font-black text-slate-900">
                                    ₦{Number(typeof testResults.balance === 'object' ? (testResults.balance.balance || testResults.balance.wallet_balance || '0') : testResults.balance).toLocaleString()}
                                  </span>
                                  <span className="text-xs font-bold text-slate-400 uppercase">Available</span>
                                </div>
                              ) : (
                                <p className="text-red-600 text-xs font-bold leading-relaxed">{testResults.balanceError}</p>
                              )}
                            </div>

                            {/* Networks Card */}
                            <div className={`p-5 rounded-2xl border-2 transition-all ${testResults.networksStatus === 'success' ? 'border-blue-100 bg-blue-50/30' : 'border-red-100 bg-red-50/30'}`}>
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Network Services</span>
                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${testResults.networksStatus === 'success' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}`}>
                                  {testResults.networksStatus === 'success' ? 'Available' : 'Error'}
                                </span>
                              </div>
                              {testResults.networksStatus === 'success' ? (
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                    <FiLayers className="w-5 h-5" />
                                  </div>
                                  <p className="text-slate-700 text-sm font-bold">
                                    {Array.isArray(testResults.networks) ? `${testResults.networks.length} networks configured` : 'Network data retrieved successfully'}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-red-600 text-xs font-bold leading-relaxed">{testResults.networksError}</p>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <FiActivity className="w-10 h-10 text-slate-300 mb-4" />
                        <p className="text-slate-500 font-bold">Click refresh to start connection test</p>
                      </div>
                    )}
                  </div>

                  {/* Test Purchase */}
                  <div className="space-y-6 lg:border-l lg:pl-8 border-slate-100">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <FiZap className="text-green-600" />
                      Live Purchase Test
                    </h3>
                    <TestPurchaseForm providerCode={testItem.code} />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setTestItem(null)}
                  className="px-10 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95"
                >
                  Close Test Panel
                </button>
              </div>
            </div>
          </div>
        )}

        {isSyncOpen && <IBDataSyncModal onClose={() => setIsSyncOpen(false)} />}
      </div>
    </Layout>
  );
};

export default Providers;
