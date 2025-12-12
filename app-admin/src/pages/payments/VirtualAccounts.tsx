import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiMoreVertical, FiLock, FiUnlock, FiRefreshCw } from 'react-icons/fi';
import { getVirtualAccounts, freezeAccount, unfreezeAccount, syncAccount } from '../../api/paymentApi';

import Layout from '../../components/Layout';

const VirtualAccounts: React.FC = () => {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            // Mock data for now
            // const response = await getVirtualAccounts();
            // setAccounts(response.data.data);
            setAccounts([
                { _id: '1', account_name: 'John Doe', account_number: '1234567890', bank_name: 'Wema Bank', balance: 5000, status: 'active', user: { name: 'John Doe' } },
                { _id: '2', account_name: 'Jane Smith', account_number: '0987654321', bank_name: 'Moniepoint', balance: 1200, status: 'frozen', user: { name: 'Jane Smith' } },
            ]);
        } catch (error) {
            console.error('Failed to fetch accounts', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFreeze = async (id: string, currentStatus: string) => {
        try {
            if (currentStatus === 'active') {
                await freezeAccount(id);
            } else {
                await unfreezeAccount(id);
            }
            fetchAccounts();
        } catch (error) {
            console.error('Failed to update account status', error);
        }
    };

    return (
        <Layout>
            <div className="p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Virtual Accounts</h1>
                        <p className="text-slate-500 mt-1">Manage customer virtual accounts</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search accounts..."
                                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 w-full md:w-64 shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 shadow-sm">
                            <FiFilter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Details</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Bank</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {accounts.map((account) => (
                                    <tr key={account._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold text-slate-900">{account.account_name}</p>
                                                <p className="text-xs text-slate-500">{account.account_number}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{account.bank_name}</td>
                                        <td className="px-6 py-4 text-sm font-mono text-slate-700">₦{account.balance.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${account.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {account.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button
                                                onClick={() => handleFreeze(account._id, account.status)}
                                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                title={account.status === 'active' ? 'Freeze' : 'Unfreeze'}
                                            >
                                                {account.status === 'active' ? <FiLock className="w-5 h-5" /> : <FiUnlock className="w-5 h-5" />}
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Sync">
                                                <FiRefreshCw className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default VirtualAccounts;
