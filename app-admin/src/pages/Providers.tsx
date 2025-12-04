import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { createProvider, deleteProvider, getProviderEnv, getProviders, testProviderConnection, updateProvider, updateProviderEnv } from '../api/adminApi';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const ALL_SERVICES = ['airtime', 'data', 'cable', 'electricity', 'exampin'];

const Providers: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [filters, setFilters] = useState<{ active: string | '' }>({ active: '' });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [envItem, setEnvItem] = useState<any | null>(null);
  const [envMap, setEnvMap] = useState<Record<string, string>>({});
  const [envLoading, setEnvLoading] = useState(false);
  const [envError, setEnvError] = useState('');
  const [testItem, setTestItem] = useState<any | null>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  const queryClient = useQueryClient();

  const { data, status } = useQuery({
    queryKey: ['providers', filters.active],
    queryFn: () => getProviders(filters.active === '' ? undefined : { active: filters.active === 'true' }).then((r: any) => r.data?.data),
  });
  const providers = data?.providers || [];
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

  const saveEnvMutation = useMutation({
    mutationFn: async ({ id, env }: { id: string; env: Record<string, string> }) => {
      return updateProviderEnv(id, env).then((r: any) => r.data);
    },
    onSuccess: () => {
      setEnvItem(null);
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

  const openEnvModal = async (p: any) => {
    setEnvItem(p);
    setEnvError('');
    setEnvLoading(true);
    try {
      const res: any = await getProviderEnv(p._id);
      setEnvMap(res.data?.data?.env || {});
    } catch (e: any) {
      setEnvError('Failed to load environment variables');
      setEnvMap({});
    } finally {
      setEnvLoading(false);
    }
  };

  const setEnvKey = (k: string, v: string) => {
    setEnvMap((m) => ({ ...m, [k]: v }));
  };

  const removeEnvKey = (k: string) => {
    setEnvMap((m) => {
      const n = { ...m } as any;
      delete n[k];
      return n;
    });
  };

  const addEmptyEnv = () => {
    let base = 'NEW_KEY';
    let idx = 1;
    let key = base;
    while (envMap.hasOwnProperty(key)) {
      key = `${base}_${idx++}`;
    }
    setEnvMap((m) => ({ ...m, [key]: '' }));
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
                  <p className="text-3xl font-bold text-blue-600">{total}</p>
                  <p className="text-sm text-slate-600">Total Providers</p>
                </div>
              </div>

              <div className="flex gap-3 mb-6">
                <button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg font-medium">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Provider
                </button>

                <select value={filters.active} onChange={(e) => setFilters({ active: e.target.value })} className="px-4 py-2.5 border border-slate-300 rounded-lg bg-white">
                  <option value="">All</option>
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
                              <button onClick={() => setEditItem(p)} className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-900 font-medium">
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
                              <button onClick={() => openEnvModal(p)} className="inline-flex items-center gap-1.5 text-purple-600 hover:text-purple-900 font-medium">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zm0 10a8 8 0 100-16 8 8 0 000 16z" /></svg>
                                Manage Env
                              </button>
                              <button onClick={() => testConnection(p)} className="inline-flex items-center gap-1.5 text-green-600 hover:text-green-900 font-medium">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Test
                              </button>
                              <button onClick={() => deleteMutation.mutate(p._id)} className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-900 font-medium">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0l1-3h6l1 3" /></svg>
                                Delete
                              </button>
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
                      <input value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: '' }); }} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'}`} placeholder="Topupmate" />
                      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Code</label>
                      <input value={form.code} onChange={(e) => { setForm({ ...form, code: e.target.value }); if (errors.code) setErrors({ ...errors, code: '' }); }} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.code ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'}`} placeholder="topupmate | vtpass | smeplug" />
                      {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Base URL</label>
                        <input value={form.base_url} onChange={(e) => setForm({ ...form, base_url: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-blue-500" placeholder="https://api.example.com" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">API Key</label>
                        <input value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-blue-500" placeholder="sk_..." />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Secret Key</label>
                        <input value={form.secret_key} onChange={(e) => setForm({ ...form, secret_key: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-blue-500" placeholder="secret..." />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                        <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-blue-500" placeholder="optional" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                        <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-blue-500" placeholder="optional" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
                        <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value || 1) })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Active</label>
                        <select value={String(form.active)} onChange={(e) => setForm({ ...form, active: e.target.value === 'true' })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-blue-500">
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Supported Services</label>
                        <div className="flex flex-wrap gap-2">
                          {ALL_SERVICES.map(s => (
                            <label key={s} className={`px-3 py-1 rounded border cursor-pointer text-sm ${form.supported_services.includes(s) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'}`}>
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
                      <button type="submit" disabled={!canSubmit || createMutation.status === 'pending'} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50">{createMutation.status === 'pending' ? 'Saving...' : 'Save'}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {envItem && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[85vh] overflow-y-auto">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Environment Backup</h2>
                  <p className="text-slate-600 mb-4 text-sm">Provider: <span className="font-semibold">{envItem.name}</span></p>
                  {envLoading ? (
                    <div className="p-6 text-center text-gray-500">Loading env...</div>
                  ) : (
                    <>
                      {envError && <div className="mb-3 text-red-600 text-sm">{envError}</div>}
                      <div className="border border-slate-200 rounded-lg divide-y">
                        {Object.keys(envMap).length === 0 && (
                          <div className="p-4 text-sm text-slate-600">No keys yet. Add one below.</div>
                        )}
                        {Object.entries(envMap).map(([k, v]) => (
                          <div key={k} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 items-center">
                            <input value={k} onChange={(e) => {
                              const newKey = e.target.value;
                              setEnvMap((m) => {
                                const n: any = { ...m };
                                if (newKey && newKey !== k) {
                                  n[newKey] = n[k];
                                  delete n[k];
                                }
                                return n;
                              });
                            }} className="md:col-span-4 px-3 py-2 border rounded-lg text-sm" />
                            <input value={v as string} onChange={(e) => setEnvKey(k, e.target.value)} className="md:col-span-7 px-3 py-2 border rounded-lg text-sm" />
                            <button onClick={() => removeEnvKey(k)} className="md:col-span-1 text-red-600 hover:text-red-800 text-sm">Remove</button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button type="button" onClick={addEmptyEnv} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm">Add Key</button>
                        <button type="button" onClick={() => setEnvItem(null)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm">Cancel</button>
                        <button type="button" disabled={saveEnvMutation.status === 'pending'} onClick={() => saveEnvMutation.mutate({ id: envItem._id, env: envMap })} className="ml-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition disabled:opacity-50 text-sm">{saveEnvMutation.status === 'pending' ? 'Saving...' : 'Save Env'}</button>
                      </div>
                    </>
                  )}
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
                      <input value={editItem.name || ''} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Code</label>
                      <input value={editItem.code || ''} onChange={(e) => setEditItem({ ...editItem, code: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-blue-500" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Base URL</label>
                        <input value={editItem.base_url || ''} onChange={(e) => setEditItem({ ...editItem, base_url: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">API Key</label>
                        <input value={editItem.api_key || ''} onChange={(e) => setEditItem({ ...editItem, api_key: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Secret Key</label>
                        <input value={editItem.secret_key || ''} onChange={(e) => setEditItem({ ...editItem, secret_key: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                        <input value={editItem.username || ''} onChange={(e) => setEditItem({ ...editItem, username: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                        <input value={editItem.password || ''} onChange={(e) => setEditItem({ ...editItem, password: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
                        <input type="number" value={editItem.priority || 1} onChange={(e) => setEditItem({ ...editItem, priority: Number(e.target.value || 1) })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Active</label>
                        <select value={String(editItem.active)} onChange={(e) => setEditItem({ ...editItem, active: e.target.value === 'true' })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-slate-300 focus:ring-blue-500">
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Supported Services</label>
                        <div className="flex flex-wrap gap-2">
                          {ALL_SERVICES.map(s => (
                            <label key={s} className={`px-3 py-1 rounded border cursor-pointer text-sm ${(editItem.supported_services || []).includes(s) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'}`}>
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
                      <button type="submit" disabled={updateMutation.status === 'pending'} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50">{updateMutation.status === 'pending' ? 'Saving...' : 'Save'}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {testItem && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 max-h-[85vh] overflow-y-auto">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Test Connection</h2>
                  <p className="text-slate-600 mb-4 text-sm">Provider: <span className="font-semibold">{testItem.name}</span> ({testItem.code})</p>

                  {testLoading ? (
                    <div className="p-6 text-center text-gray-500">Testing connection...</div>
                  ) : testResults ? (
                    <>
                      {testResults.error ? (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-800 font-semibold">❌ Connection Failed</p>
                          <p className="text-red-600 text-sm mt-1">{testResults.error}</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Balance */}
                          {testResults.balanceStatus && (
                            <div className={`p-4 rounded-lg border ${testResults.balanceStatus === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-slate-900">Wallet Balance</h3>
                                <span className={`text-xs px-2 py-1 rounded ${testResults.balanceStatus === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                  {testResults.balanceStatus === 'success' ? '✓ Success' : '✗ Failed'}
                                </span>
                              </div>
                              {testResults.balanceStatus === 'success' ? (
                                <div className="text-sm">
                                  <pre className="bg-white p-3 rounded border overflow-auto max-h-32">{JSON.stringify(testResults.balance, null, 2)}</pre>
                                </div>
                              ) : (
                                <p className="text-red-600 text-sm">{testResults.balanceError}</p>
                              )}
                            </div>
                          )}

                          {/* Networks */}
                          {testResults.networksStatus && (
                            <div className={`p-4 rounded-lg border ${testResults.networksStatus === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-slate-900">Networks</h3>
                                <span className={`text-xs px-2 py-1 rounded ${testResults.networksStatus === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                  {testResults.networksStatus === 'success' ? '✓ Success' : '✗ Failed'}
                                </span>
                              </div>
                              {testResults.networksStatus === 'success' ? (
                                <div className="text-sm">
                                  <pre className="bg-white p-3 rounded border overflow-auto max-h-32">{JSON.stringify(testResults.networks, null, 2)}</pre>
                                </div>
                              ) : (
                                <p className="text-red-600 text-sm">{testResults.networksError}</p>
                              )}
                            </div>
                          )}

                          {!testResults.balanceStatus && !testResults.networksStatus && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-blue-800 text-sm">ℹ️ No tests were performed. This provider may not support balance or network queries.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : null}

                  <div className="flex gap-3 mt-6">
                    <button type="button" onClick={() => setTestItem(null)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-semibold">Close</button>
                    <button type="button" disabled={testLoading} onClick={() => testConnection(testItem)} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50">{testLoading ? 'Testing...' : 'Retest'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Providers;
