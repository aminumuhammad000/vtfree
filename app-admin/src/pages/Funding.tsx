import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFundingAccount, deleteFundingAccount, getFundingAccounts, getFundingInfo, getProviderBalances, updateFundingAccount } from '../api/adminApi';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const Funding: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { data: balancesRes, status: balancesStatus } = useQuery({
    queryKey: ['provider-balances'],
    queryFn: async () => {
      const res = await getProviderBalances();
      return res.data?.data as { providers: Array<{ code: string; name: string; balance: number | null; currency: string | null; status: string }>; total: number };
    }
  });

  const { data: fundingInfoRes, status: fundingStatus } = useQuery({
    queryKey: ['funding-info'],
    queryFn: async () => {
      const res = await getFundingInfo();
      return res.data?.data as { funding: { bankName: string; accountName: string; accountNumber: string; instructions?: string } };
    }
  });

  const providers = balancesRes?.providers || [];
  const total = balancesRes?.total || 0;
  const funding = fundingInfoRes?.funding;

  // Accounts list
  const queryClient = useQueryClient();
  const { data: accountsRes, status: accountsStatus, error: accountsError } = useQuery({
    queryKey: ['funding-accounts'],
    queryFn: async () => {
      const res = await getFundingAccounts();
      return res.data?.data as { accounts: Array<{ _id: string; bankName: string; accountName: string; accountNumber: string; instructions?: string; active: boolean }>; total: number };
    }
  });
  const accounts = accountsRes?.accounts || [];

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ bankName: '', accountName: '', accountNumber: '', instructions: '', active: true });

  const openCreate = () => { setEditing(null); setForm({ bankName: '', accountName: '', accountNumber: '', instructions: '', active: true }); setShowForm(true); };
  const openEdit = (acc: any) => { setEditing(acc); setForm({ bankName: acc.bankName, accountName: acc.accountName, accountNumber: acc.accountNumber, instructions: acc.instructions || '', active: !!acc.active }); setShowForm(true); };

  const createMut = useMutation({
    mutationFn: () => createFundingAccount(form).then(r => r.data),
    onSuccess: () => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ['funding-accounts'] }); queryClient.invalidateQueries({ queryKey: ['funding-info'] }); },
  });
  const updateMut = useMutation({
    mutationFn: () => updateFundingAccount(editing._id, form).then(r => r.data),
    onSuccess: () => { setShowForm(false); setEditing(null); queryClient.invalidateQueries({ queryKey: ['funding-accounts'] }); queryClient.invalidateQueries({ queryKey: ['funding-info'] }); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFundingAccount(id).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['funding-accounts'] }); queryClient.invalidateQueries({ queryKey: ['funding-info'] }); },
  });

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onMenuClick={() => setIsMobileOpen(true)} />
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold text-slate-900">Funding & Balances</h1>
                <p className="text-slate-600">Check provider wallet balances and default account for funding</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <p className="text-slate-500 text-sm">Total Provider Balance</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">₦{Number(total || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <p className="text-slate-500 text-sm">Active Providers</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{providers.length}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <p className="text-slate-500 text-sm">Last Updated</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">Now</p>
              </div>
            </div>

            {/* Balances Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {balancesStatus === 'pending' && (
                <div className="p-6 text-center text-gray-500">Loading balances...</div>
              )}
              {balancesStatus === 'error' && (
                <div className="p-6 text-center text-red-500">Failed to load balances.</div>
              )}
              {balancesStatus === 'success' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Provider</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Code</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Balance</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {providers.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No providers.</td>
                        </tr>
                      )}
                      {providers.map((p) => (
                        <tr key={p.code} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 text-sm text-gray-900">{p.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 uppercase">{p.code}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{p.balance === null ? 'N/A' : `₦${Number(p.balance).toLocaleString()}`}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${p.status === 'ok' ? 'bg-green-100 text-green-800' : (p.status === 'unsupported' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800')}`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Funding Accounts List */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">Funding Accounts</h2>
                <button onClick={openCreate} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                  Add Account
                </button>
              </div>
              {/* Default Funding Account under Add button */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Default Funding Account</h3>
                {fundingStatus === 'pending' && <div className="text-gray-500">Loading...</div>}
                {fundingStatus === 'error' && <div className="text-red-500">Failed to load funding info.</div>}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Bank</p>
                    <p className="font-semibold">{funding?.bankName || 'Access Bank'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Account Name</p>
                    <p className="font-semibold">{funding?.accountName || 'Connecta VTU'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Account Number</p>
                    <p className="font-semibold tracking-wider">{funding?.accountNumber || '0123456789'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Instructions</p>
                    <p className="font-semibold">{funding?.instructions || 'Transfer to this account and notify support with your reference.'}</p>
                  </div>
                </div>
              </div>
              {accountsStatus === 'pending' && <div className="text-gray-500">Loading accounts...</div>}
              {accountsStatus === 'error' && (
                <div className="text-red-600 text-sm">
                  <div className="font-medium">Failed to load accounts.</div>
                  <div className="mt-1">
                    {(() => {
                      const err: any = accountsError;
                      return err?.response?.data?.message || err?.message || 'An unexpected error occurred.';
                    })()}
                  </div>
                </div>
              )}
              {accountsStatus === 'success' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Bank</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Account Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Account Number</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {accounts.length === 0 && (
                        <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No accounts yet.</td></tr>
                      )}
                      {accounts.map((a:any) => (
                        <tr key={a._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm">{a.bankName}</td>
                          <td className="px-6 py-4 text-sm">{a.accountName}</td>
                          <td className="px-6 py-4 text-sm tracking-wider">{a.accountNumber}</td>
                          <td className="px-6 py-4 text-sm"><span className={`px-2 py-1 rounded text-xs font-semibold ${a.active ? 'bg-green-100 text-green-800':'bg-red-100 text-red-800'}`}>{a.active ? 'Active':'Inactive'}</span></td>
                          <td className="px-6 py-4 text-sm space-x-3">
                            <button onClick={() => openEdit(a)} className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-900 font-medium">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              Edit
                            </button>
                            <button onClick={() => deleteMut.mutate(a._id)} className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-900 font-medium">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0l1-3h6l1 3"/></svg>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal */}
            {showForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{editing ? 'Edit Account' : 'Add Account'}</h3>
                    <button onClick={() => { setShowForm(false); setEditing(null); }} className="p-2 text-slate-500 hover:text-slate-700">✕</button>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
                      <input value={form.bankName} onChange={e=>setForm({...form, bankName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Account Name</label>
                      <input value={form.accountName} onChange={e=>setForm({...form, accountName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
                      <input value={form.accountNumber} onChange={e=>setForm({...form, accountNumber: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Instructions</label>
                      <textarea value={form.instructions} onChange={e=>setForm({...form, instructions: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded" />
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.active} onChange={e=>setForm({...form, active: e.target.checked})} /> Active
                    </label>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 rounded border">Cancel</button>
                    <button onClick={() => (editing ? updateMut.mutate() : createMut.mutate())} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50" disabled={createMut.status==='pending' || updateMut.status==='pending'}>
                      {editing ? (updateMut.status==='pending' ? 'Saving...' : 'Save') : (createMut.status==='pending' ? 'Creating...' : 'Create')}
                    </button>
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

export default Funding;
