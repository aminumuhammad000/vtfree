import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { createFundingAccount, deleteFundingAccount, getBanksList, getFundingAccounts, getFundingInfo, getProviderBalances, getVTPayBalance, updateFundingAccount, validateAccount, getAllConfigs } from '../../api/adminApi';

const FundingPanel: React.FC = () => {
    // Default Gateway
    const { data: configRes } = useQuery({
        queryKey: ['system-configs'],
        queryFn: async () => {
            const res = await getAllConfigs();
            return res.data?.data || [];
        },
    });

    const defaultGateway = configRes?.find((c: any) => c.key === 'DEFAULT_PAYMENT_GATEWAY')?.value || 'vtpay';

    // Gateway Balance
    const { data: gatewayBalanceRes } = useQuery({
        queryKey: ['gateway-balance', defaultGateway],
        queryFn: async () => {
            const res = await getVTPayBalance(); // This endpoint now handles default gateway in backend
            return res.data?.data || { balance: 0 };
        },
    });

    // Banks List
    const { data: banksRes, status: banksStatus } = useQuery({
        queryKey: ['banks-list'],
        queryFn: async () => {
            const res = await getBanksList();
            return res.data?.data || [];
        },
    });

    const banks = Array.isArray(banksRes) ? banksRes : (banksRes?.banks || []);

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
    const [form, setForm] = useState({ bankName: '', bankCode: '', accountName: '', accountNumber: '', instructions: '', active: true });

    // Account verification state
    const [verifying, setVerifying] = useState(false);
    const [verifiedName, setVerifiedName] = useState('');
    const [verificationError, setVerificationError] = useState('');

    const openCreate = () => { setEditing(null); setForm({ bankName: '', bankCode: '', accountName: '', accountNumber: '', instructions: '', active: true }); setVerifiedName(''); setVerificationError(''); setShowForm(true); };
    const openEdit = (acc: any) => { setEditing(acc); setForm({ bankName: acc.bankName, bankCode: acc.bankCode || '', accountName: acc.accountName, accountNumber: acc.accountNumber, instructions: acc.instructions || '', active: !!acc.active }); setVerifiedName(acc.accountName); setVerificationError(''); setShowForm(true); };

    // Handle account verification
    const handleVerifyAccount = async () => {
        if (!form.bankCode || !form.accountNumber) {
            setVerificationError('Please select a bank and enter account number');
            return;
        }

        setVerifying(true);
        setVerificationError('');
        setVerifiedName('');

        try {
            const res = await validateAccount({
                bank_code: form.bankCode,
                account_number: form.accountNumber,
            });

            if (res.data?.status === 'success' && res.data?.data?.verified) {
                setVerifiedName(res.data.data.account_name);
                setForm({ ...form, accountName: res.data.data.account_name });
            } else {
                setVerificationError(res.data?.message || 'Account verification failed');
            }
        } catch (error: any) {
            setVerificationError(error.response?.data?.message || 'Failed to verify account');
        } finally {
            setVerifying(false);
        }
    };

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
        <div className="space-y-6">
            {/* Modern Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Gateway Balance Card */}
                <div className="relative bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white overflow-hidden group hover-lift transition-all duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:w-40 group-hover:h-40 transition-all"></div>
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-3">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm font-semibold uppercase tracking-wide text-purple-100">{defaultGateway} Balance</p>
                        </div>
                        <p className="text-4xl font-extrabold mb-1">₦{Number(gatewayBalanceRes?.balance || 0).toLocaleString()}</p>
                        <p className="text-xs text-purple-200 uppercase tracking-wide">Available Funds</p>
                    </div>
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 rounded-full"></div>
                </div>

                {/* Total Provider Balance */}
                <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white overflow-hidden group hover-lift transition-all duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:w-40 group-hover:h-40 transition-all"></div>
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-3">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm font-semibold uppercase tracking-wide text-blue-100">Provider Balance</p>
                        </div>
                        <p className="text-4xl font-extrabold mb-1">₦{Number(total || 0).toLocaleString()}</p>
                        <p className="text-xs text-blue-200 uppercase tracking-wide">Total Across Providers</p>
                    </div>
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 rounded-full"></div>
                </div>

                {/* Active Providers */}
                <div className="relative bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg p-6 text-white overflow-hidden group hover-lift transition-all duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:w-40 group-hover:h-40 transition-all"></div>
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-3">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                            <p className="text-sm font-semibold uppercase tracking-wide text-amber-100">Active Providers</p>
                        </div>
                        <p className="text-4xl font-extrabold mb-1">{providers.length}</p>
                        <p className="text-xs text-amber-200 uppercase tracking-wide">Connected Services</p>
                    </div>
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 rounded-full"></div>
                </div>

                {/* Funding Accounts */}
                <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white overflow-hidden group hover-lift transition-all duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:w-40 group-hover:h-40 transition-all"></div>
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-3">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm font-semibold uppercase tracking-wide text-green-100">Withdrawal Accounts</p>
                        </div>
                        <p className="text-4xl font-extrabold mb-1">{accounts.length}</p>
                        <p className="text-xs text-green-200 uppercase tracking-wide">Configured Accounts</p>
                    </div>
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 rounded-full"></div>
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
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                            {p.balance === null || p.balance === '***.**'
                                                ? (p.status === 'error' ? <span className="text-red-600">Error</span> : (p.balance === '***.**' ? '***.**' : 'N/A'))
                                                : `₦${Number(p.balance).toLocaleString()}`}
                                        </td>
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
                    <button onClick={openCreate} className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Add Account
                    </button>
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
                                {accounts.map((a: any) => (
                                    <tr key={a._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm">{a.bankName}</td>
                                        <td className="px-6 py-4 text-sm">{a.accountName}</td>
                                        <td className="px-6 py-4 text-sm tracking-wider">{a.accountNumber}</td>
                                        <td className="px-6 py-4 text-sm"><span className={`px-2 py-1 rounded text-xs font-semibold ${a.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{a.active ? 'Active' : 'Inactive'}</span></td>
                                        <td className="px-6 py-4 text-sm space-x-3">
                                            <button onClick={() => openEdit(a)} className="inline-flex items-center gap-1.5 text-green-600 hover:text-green-900 font-medium">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                Edit
                                            </button>
                                            <button onClick={() => deleteMut.mutate(a._id)} className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-900 font-medium">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0l1-3h6l1 3" /></svg>
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
                    <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">{editing ? 'Edit Account' : 'Add Withdrawal Account'}</h3>
                            <button onClick={() => { setShowForm(false); setEditing(null); }} className="p-2 text-slate-500 hover:text-slate-700">✕</button>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {/* Bank Selection Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Bank *</label>
                                <select
                                    value={form.bankCode}
                                    onChange={e => {
                                        const selectedBank = banks.find((b: any) => b.code === e.target.value);
                                        setForm({ ...form, bankCode: e.target.value, bankName: selectedBank?.name || '' });
                                        setVerifiedName(''); // Reset verification when bank changes
                                        setVerificationError('');
                                    }}
                                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    disabled={editing} // Don't allow changing bank on edit
                                >
                                    <option value="">{banksStatus === 'pending' ? 'Loading banks...' : 'Select a bank'}</option>
                                    {banks.map((bank: any) => (
                                        <option key={bank.code} value={bank.code}>
                                            {bank.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Account Number */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Account Number *</label>
                                <input
                                    type="text"
                                    value={form.accountNumber}
                                    onChange={e => {
                                        setForm({ ...form, accountNumber: e.target.value });
                                        setVerifiedName(''); // Reset verification when account number changes
                                        setVerificationError('');
                                    }}
                                    maxLength={10}
                                    placeholder="0123456789"
                                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    disabled={editing} // Don't allow changing account number on edit
                                />
                            </div>

                            {/* Verify Account Button */}
                            {!editing && (
                                <div>
                                    <button
                                        onClick={handleVerifyAccount}
                                        disabled={verifying || !form.bankCode || !form.accountNumber || form.accountNumber.length !== 10}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        {verifying ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Verifying...
                                            </span>
                                        ) : 'Verify Account'}
                                    </button>
                                </div>
                            )}

                            {/* Verified Account Name */}
                            {verifiedName && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-semibold text-green-800">Account Verified!</p>
                                            <p className="text-sm text-green-700 mt-1"><strong>Account Name:</strong> {verifiedName}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Verification Error */}
                            {verificationError && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-sm text-red-800">{verificationError}</p>
                                    </div>
                                </div>
                            )}

                            {/* Account Name (Read-only after verification) */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Account Name</label>
                                <input
                                    value={form.accountName}
                                    readOnly
                                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                                    placeholder="Verify account to see name"
                                />
                            </div>

                            {/* Instructions */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Instructions (Optional)</label>
                                <textarea
                                    value={form.instructions}
                                    onChange={e => setForm({ ...form, instructions: e.target.value })}
                                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    rows={3}
                                    placeholder="Any special instructions for this account"
                                />
                            </div>

                            {/* Active Checkbox */}
                            <label className="inline-flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.active}
                                    onChange={e => setForm({ ...form, active: e.target.checked })}
                                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                />
                                Active
                            </label>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => { setShowForm(false); setEditing(null); }}
                                className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => (editing ? updateMut.mutate() : createMut.mutate())}
                                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={
                                    createMut.status === 'pending' ||
                                    updateMut.status === 'pending' ||
                                    (!editing && !verifiedName) // Require verification for new accounts
                                }
                            >
                                {editing
                                    ? (updateMut.status === 'pending' ? 'Saving...' : 'Save Changes')
                                    : (createMut.status === 'pending' ? 'Adding...' : 'Add Account')
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FundingPanel;
