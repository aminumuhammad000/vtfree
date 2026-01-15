import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState, useEffect } from 'react';
import { createProvider, deleteProvider, getProviders, testProviderConnection, updateProvider, testProviderPurchase, getProviderData } from '../api/adminApi';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import IBDataSyncModal from '../components/IBDataSyncModal';

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
      // Handle nested data structures from different providers
      let plansData = res.data?.data?.data || res.data?.data || [];
      if (plansData && typeof plansData === 'object' && !Array.isArray(plansData)) {
        // If it's an object with a data property (like Topupmate or SMEPlug sometimes)
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
    <div className="space-y-4">
      <form onSubmit={handleTest} className="space-y-4">
        <div className="flex p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setType('airtime')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${type === 'airtime' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Airtime
          </button>
          <button
            type="button"
            onClick={() => setType('data')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${type === 'data' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Data
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08012345678"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Network</label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm"
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
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Data Plan</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm"
                required
                disabled={plansLoading}
              >
                <option value="">{plansLoading ? 'Loading plans...' : 'Select Plan'}</option>
                {plans.map((p: any) => (
                  <option key={p.id || p._id || p.plan_id} value={p.id || p._id || p.plan_id}>
                    {p.name || p.plan_name || p.allowance} - {p.price || p.amount}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-100 disabled:opacity-50"
        >
          {loading ? 'Processing...' : `Test ${type === 'airtime' ? 'Airtime' : 'Data'} Purchase`}
        </button>
      </form>

      {result && (
        <div className={`p-4 rounded-xl border-2 ${result.success ? 'border-green-100 bg-green-50/30' : 'border-red-100 bg-red-50/30'}`}>
          <p className={`text-sm font-bold mb-2 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
            {result.success ? '✓ Purchase Successful' : '✗ Purchase Failed'}
          </p>
          <pre className="text-[10px] bg-white p-3 rounded-lg border overflow-auto max-h-40">
            {JSON.stringify(result.data || result.error, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

const Providers: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [filters, setFilters] = useState<{ active: string | '' }>({ active: '' });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [testItem, setTestItem] = useState<any | null>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data, status } = useQuery({
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

  const createMutation = useMutation({
    mutationFn: (payload: any) => createProvider(payload).then((r: any) => r.data),
    onSuccess: () => {
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateProvider(id, payload).then((r: any) => r.data),
    onSuccess: () => {
      setEditItem(null);
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProvider(id).then((r: any) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    }
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

  const [errors, setErrors] = useState<Record<string, string>>({});

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
    <div className="flex h-screen bg-slate-50">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onMenuClick={() => setIsMobileOpen(true)} />
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-2">Bill Providers</h1>
                  <p className="text-slate-600">Manage external bill payment APIs (Topupmate, VTpass, SME Plug, etc.)</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-600">{total}</p>
                  <p className="text-sm text-slate-600">Total Providers</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                <button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg font-medium">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Provider
                </button>

                <button onClick={() => setIsSyncOpen(true)} className="flex items-center gap-2 bg-white border border-green-600 text-green-600 hover:bg-green-50 px-6 py-2.5 rounded-lg transition-all font-medium">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Sync IBData Plans
                </button>

                <select value={filters.active} onChange={(e) => setFilters({ active: e.target.value })} className="px-4 py-2.5 border border-slate-300 rounded-lg bg-white">
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {status === 'pending' && <div className="p-6 text-center text-gray-500">Loading providers...</div>}
              {status === 'error' && <div className="p-6 text-center text-red-500">Failed to load providers.</div>}
              {status === 'success' && (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Code</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Services</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Priority</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {providers.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No providers found.</td>
                          </tr>
                        )}
                        {providers.map((p: any) => (
                          <tr key={p._id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 text-sm text-gray-900">{p.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 uppercase">{p.code}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{(p.supported_services || []).join(', ')}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{p.priority}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${p.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{p.active ? 'Active' : 'Inactive'}</span>
                            </td>
                            <td className="px-6 py-4 text-sm space-x-3">
                              <button onClick={() => setEditItem(p)} className="inline-flex items-center gap-1.5 text-green-600 hover:text-green-900 font-medium">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                Edit
                              </button>
                              <button onClick={() => toggleActive(p)} className="inline-flex items-center gap-1.5 text-amber-600 hover:text-amber-900 font-medium">
                                {p.active ? (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    Disable
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Enable
                                  </>
                                )}
                              </button>
                              <button onClick={() => testConnection(p)} className="inline-flex items-center gap-1.5 text-green-600 hover:text-green-900 font-medium">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Test
                              </button>
                              {p.code !== 'ibdata' && (
                                <button onClick={() => deleteMutation.mutate(p._id)} className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-900 font-medium">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0l1-3h6l1 3" /></svg>
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {isCreateOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 max-h-[85vh] overflow-y-auto">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Add Provider</h2>
                  <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
                      <input value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value.toUpperCase() }); if (errors.name) setErrors({ ...errors, name: '' }); }} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-green-500'}`} placeholder="IBDATA" />
                      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Code</label>
                      <select
                        value={form.code}
                        onChange={(e) => {
                          const code = e.target.value;
                          const nameMap: Record<string, string> = {
                            ibdata: 'IBDATA',
                            smeplug: 'SME PLUG',
                            topupmate: 'TOPUPMATE'
                          };
                          setForm({
                            ...form,
                            code,
                            name: nameMap[code] || form.name
                          });
                          if (errors.code) setErrors({ ...errors, code: '' });
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.code ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-green-500'}`}
                      >
                        <option value="">Select Provider Code</option>
                        <option value="ibdata">IBData</option>
                        <option value="smeplug">SME Plug</option>
                        <option value="topupmate">Topupmate</option>
                      </select>
                      {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Base URL</label>
                        <input value={form.base_url} onChange={(e) => setForm({ ...form, base_url: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-green-500" placeholder="https://api.example.com" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">API Key</label>
                        <input value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-green-500" placeholder="sk_..." disabled={form.code === 'ibdata'} type={form.code === 'ibdata' ? 'password' : 'text'} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Secret Key</label>
                        <input value={form.secret_key} onChange={(e) => setForm({ ...form, secret_key: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-green-500" placeholder="secret..." disabled={form.code === 'ibdata'} type={form.code === 'ibdata' ? 'password' : 'text'} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
                        <select
                          value={form.priority}
                          onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-green-500"
                        >
                          <option value={1}>1 (High)</option>
                          <option value={2}>2 (Medium)</option>
                          <option value={3}>3 (Low)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Active</label>
                        <select value={String(form.active)} onChange={(e) => setForm({ ...form, active: e.target.value === 'true' })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-green-500">
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Supported Services</label>
                        <div className="flex flex-wrap gap-2">
                          {ALL_SERVICES.map(s => (
                            <label key={s} className={`px-3 py-1 rounded border cursor-pointer text-sm ${form.supported_services.includes(s) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-700 border-slate-300'}`}>
                              <input type="checkbox" className="hidden" checked={form.supported_services.includes(s)} onChange={() => {
                                setForm(f => ({ ...f, supported_services: f.supported_services.includes(s) ? f.supported_services.filter(x => x !== s) : [...f.supported_services, s] }));
                              }} />
                              {s}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => { setIsCreateOpen(false); resetForm(); }} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-semibold">Cancel</button>
                      <button type="submit" disabled={!canSubmit || createMutation.status === 'pending'} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50">{createMutation.status === 'pending' ? 'Saving...' : 'Save'}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}


            {editItem && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 max-h-[85vh] overflow-y-auto">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Edit Provider</h2>
                  <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate({ id: editItem._id, payload: editItem }); }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
                      <input value={editItem.name || ''} onChange={(e) => setEditItem({ ...editItem, name: e.target.value.toUpperCase() })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-green-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Code</label>
                      <select
                        value={editItem.code || ''}
                        onChange={(e) => {
                          const code = e.target.value;
                          const nameMap: Record<string, string> = {
                            ibdata: 'IBDATA',
                            smeplug: 'SME PLUG',
                            topupmate: 'TOPUPMATE'
                          };
                          setEditItem({
                            ...editItem,
                            code,
                            name: nameMap[code] || editItem.name
                          });
                        }}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-green-500"
                      >
                        <option value="">Select Provider Code</option>
                        <option value="ibdata">IBData</option>
                        <option value="smeplug">SME Plug</option>
                        <option value="topupmate">Topupmate</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Base URL</label>
                        <input value={editItem.base_url || ''} onChange={(e) => setEditItem({ ...editItem, base_url: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">API Key</label>
                        <input value={editItem.api_key || ''} onChange={(e) => setEditItem({ ...editItem, api_key: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-green-500" disabled={editItem.code === 'ibdata'} type={editItem.code === 'ibdata' ? 'password' : 'text'} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Secret Key</label>
                        <input value={editItem.secret_key || ''} onChange={(e) => setEditItem({ ...editItem, secret_key: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-green-500" disabled={editItem.code === 'ibdata'} type={editItem.code === 'ibdata' ? 'password' : 'text'} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
                        <select
                          value={editItem.priority || 1}
                          onChange={(e) => setEditItem({ ...editItem, priority: Number(e.target.value) })}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-green-500"
                        >
                          <option value={1}>1 (High)</option>
                          <option value={2}>2 (Medium)</option>
                          <option value={3}>3 (Low)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Active</label>
                        <select value={String(editItem.active)} onChange={(e) => setEditItem({ ...editItem, active: e.target.value === 'true' })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-green-500">
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Supported Services</label>
                        <div className="flex flex-wrap gap-2">
                          {ALL_SERVICES.map(s => (
                            <label key={s} className={`px-3 py-1 rounded border cursor-pointer text-sm ${(editItem.supported_services || []).includes(s) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-700 border-slate-300'}`}>
                              <input type="checkbox" className="hidden" checked={(editItem.supported_services || []).includes(s)} onChange={() => {
                                setEditItem((f: any) => ({ ...f, supported_services: (f.supported_services || []).includes(s) ? f.supported_services.filter((x: string) => x !== s) : [...(f.supported_services || []), s] }));
                              }} />
                              {s}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setEditItem(null)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-semibold">Cancel</button>
                      <button type="submit" disabled={updateMutation.status === 'pending'} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50">{updateMutation.status === 'pending' ? 'Saving...' : 'Save'}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {testItem && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 max-h-[85vh] overflow-y-auto">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-1">Test Provider: {testItem.name}</h2>
                      <p className="text-slate-600 text-sm uppercase tracking-wider font-semibold">{testItem.code}</p>
                    </div>
                    <button onClick={() => setTestItem(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                      <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Connection Status */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900">Connection Status</h3>
                        <button
                          disabled={testLoading}
                          onClick={() => testConnection(testItem)}
                          className="text-sm text-green-600 hover:text-green-700 font-semibold flex items-center gap-1"
                        >
                          <svg className={`w-4 h-4 ${testLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                          Refresh
                        </button>
                      </div>

                      {testLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mb-4"></div>
                          <p className="text-slate-500 font-medium">Testing connection...</p>
                        </div>
                      ) : testResults ? (
                        <div className="space-y-4">
                          {testResults.error ? (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                              <div className="flex items-center gap-2 text-red-800 font-bold mb-1">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                Connection Failed
                              </div>
                              <p className="text-red-600 text-sm">{testResults.error}</p>
                            </div>
                          ) : (
                            <>
                              {/* Balance Card */}
                              <div className={`p-4 rounded-xl border-2 transition-all ${testResults.balanceStatus === 'success' ? 'border-green-100 bg-green-50/30' : 'border-red-100 bg-red-50/30'}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Wallet Balance</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${testResults.balanceStatus === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                    {testResults.balanceStatus === 'success' ? 'Online' : 'Offline'}
                                  </span>
                                </div>
                                {testResults.balanceStatus === 'success' ? (
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-slate-900">
                                      {testItem.code === 'ibdata' ? '***.**' : (typeof testResults.balance === 'object' ? (testResults.balance.balance || testResults.balance.wallet_balance || '0') : testResults.balance)}
                                    </span>
                                    <span className="text-xs font-bold text-slate-500 uppercase">NGN</span>
                                  </div>
                                ) : (
                                  <p className="text-red-600 text-xs font-medium">{testResults.balanceError}</p>
                                )}
                              </div>

                              {/* Networks Card */}
                              <div className={`p-4 rounded-xl border-2 transition-all ${testResults.networksStatus === 'success' ? 'border-blue-100 bg-blue-50/30' : 'border-red-100 bg-red-50/30'}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Networks</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${testResults.networksStatus === 'success' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}`}>
                                    {testResults.networksStatus === 'success' ? 'Available' : 'Error'}
                                  </span>
                                </div>
                                {testResults.networksStatus === 'success' ? (
                                  <p className="text-slate-600 text-sm font-medium">
                                    {Array.isArray(testResults.networks) ? `${testResults.networks.length} networks found` : 'Networks data retrieved'}
                                  </p>
                                ) : (
                                  <p className="text-red-600 text-xs font-medium">{testResults.networksError}</p>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                          <p className="text-slate-500 font-medium">Click refresh to test connection</p>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Test Purchase */}
                    <div className="space-y-6 lg:border-l lg:pl-8 border-slate-200">
                      <h3 className="text-lg font-bold text-slate-900">Test Purchase</h3>
                      <TestPurchaseForm providerCode={testItem.code} />
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => setTestItem(null)}
                      className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-lg shadow-slate-200"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}
            {isSyncOpen && <IBDataSyncModal onClose={() => setIsSyncOpen(false)} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Providers;
