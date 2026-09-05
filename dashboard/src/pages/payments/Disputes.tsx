import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDisputes, resolveDispute } from '../../api/adminApi';
import Layout from '../../components/Layout';
import DisputeViewModal from '../../components/DisputeViewModal';

const Disputes: React.FC = () => {
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewDispute, setViewDispute] = useState<any | null>(null);
    const limit = 10;
    const queryClient = useQueryClient();

    const { data, status, isError } = useQuery({
        queryKey: ['disputes', page, statusFilter, searchTerm],
        queryFn: () => getDisputes({
            page,
            limit,
            status: statusFilter || undefined,
            search: searchTerm || undefined
        }).then((res: any) => res.data),
    });

    const disputes = data?.data || [];
    const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

    const resolveMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => resolveDispute(id, data).then((res: any) => res.data),
        onSuccess: () => {
            setViewDispute(null);
            queryClient.invalidateQueries({ queryKey: ['disputes'] });
        },
    });

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'open': return 'bg-yellow-100 text-yellow-800';
            case 'resolved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <Layout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Disputes</h1>
                        <p className="text-slate-500">Manage and resolve transaction disputes</p>
                    </div>

                    <div className="flex gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-sm"
                        >
                            <option value="">All Status</option>
                            <option value="open">Open</option>
                            <option value="resolved">Resolved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Search reason..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-sm"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {status === 'pending' && (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                            <p className="mt-2 text-slate-500">Loading disputes...</p>
                        </div>
                    )}

                    {isError && (
                        <div className="p-12 text-center text-red-500">
                            Failed to load disputes. Please try again.
                        </div>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Transaction Ref</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {disputes.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                                    No disputes found
                                                </td>
                                            </tr>
                                        ) : (
                                            disputes.map((dispute: any) => (
                                                <tr key={dispute._id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">
                                                                {dispute.user_id?.first_name?.[0]}{dispute.user_id?.last_name?.[0]}
                                                            </div>
                                                            <div className="ml-3">
                                                                <p className="text-sm font-medium text-slate-900">{dispute.user_id?.first_name} {dispute.user_id?.last_name}</p>
                                                                <p className="text-xs text-slate-500">{dispute.user_id?.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                                                        {dispute.transaction_id?.reference_number || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-700 max-w-xs truncate">
                                                        {dispute.reason}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(dispute.status)}`}>
                                                            {dispute.status?.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                        {new Date(dispute.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => setViewDispute(dispute)}
                                                            className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-lg transition-colors"
                                                        >
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
                                <p className="text-sm text-slate-500">
                                    Page {pagination.page} of {pagination.pages}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-3 py-1 border border-slate-300 rounded-md text-sm disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                        disabled={page === pagination.pages}
                                        className="px-3 py-1 border border-slate-300 rounded-md text-sm disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Modal */}
                {viewDispute && (
                    <DisputeViewModal
                        dispute={viewDispute}
                        onClose={() => setViewDispute(null)}
                        onResolve={(id, data) => resolveMutation.mutate({ id, data })}
                        isResolving={resolveMutation.status === 'pending'}
                    />
                )}
            </div>
        </Layout>
    );
};

export default Disputes;
