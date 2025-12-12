import React, { useState } from 'react';
import { FiX, FiUser, FiFileText, FiAlertCircle, FiCheckCircle, FiXCircle } from 'react-icons/fi';

interface DisputeViewModalProps {
    dispute: any;
    onClose: () => void;
    onResolve: (id: string, data: { status: string; resolution_notes: string }) => void;
    isResolving: boolean;
}

const DisputeViewModal: React.FC<DisputeViewModalProps> = ({ dispute, onClose, onResolve, isResolving }) => {
    const [notes, setNotes] = useState('');
    const [action, setAction] = useState<'resolved' | 'rejected' | null>(null);

    if (!dispute) return null;

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'open': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'resolved': return 'bg-green-100 text-green-700 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const handleSubmit = () => {
        if (action && notes) {
            onResolve(dispute._id, { status: action, resolution_notes: notes });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Dispute Details</h2>
                        <p className="text-sm text-slate-500 font-mono mt-1">ID: {dispute._id}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {/* Status Badge */}
                    <div className="mb-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(dispute.status)}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-2"></span>
                            {dispute.status?.toUpperCase()}
                        </span>
                    </div>

                    {/* User Info */}
                    <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <FiUser className="w-3 h-3" /> User Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-slate-500">Name</p>
                                <p className="font-medium text-slate-900">{dispute.user_id?.first_name} {dispute.user_id?.last_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Email</p>
                                <p className="font-medium text-slate-900">{dispute.user_id?.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Info */}
                    <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <FiFileText className="w-3 h-3" /> Transaction Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-slate-500">Reference</p>
                                <p className="font-mono text-sm text-slate-900">{dispute.transaction_id?.reference_number || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Amount</p>
                                <p className="font-bold text-slate-900">₦{dispute.transaction_id?.amount?.toLocaleString() || '0.00'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Dispute Reason */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-900 mb-2">Reason for Dispute</h3>
                        <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-700">
                            {dispute.reason}
                        </div>
                    </div>

                    {/* Resolution Section (Only if open) */}
                    {dispute.status === 'open' && (
                        <div className="border-t border-slate-100 pt-6">
                            <h3 className="text-sm font-semibold text-slate-900 mb-4">Resolution Action</h3>

                            <div className="flex gap-4 mb-4">
                                <button
                                    onClick={() => setAction('resolved')}
                                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${action === 'resolved'
                                            ? 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-slate-200 hover:border-green-200 hover:bg-green-50/50'
                                        }`}
                                >
                                    <FiCheckCircle className={action === 'resolved' ? 'text-green-600' : 'text-slate-400'} />
                                    <span className="font-medium">Approve & Refund</span>
                                </button>
                                <button
                                    onClick={() => setAction('rejected')}
                                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${action === 'rejected'
                                            ? 'border-red-500 bg-red-50 text-red-700'
                                            : 'border-slate-200 hover:border-red-200 hover:bg-red-50/50'
                                        }`}
                                >
                                    <FiXCircle className={action === 'rejected' ? 'text-red-600' : 'text-slate-400'} />
                                    <span className="font-medium">Reject Dispute</span>
                                </button>
                            </div>

                            {action && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Resolution Notes <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Explain the reason for your decision..."
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all h-24 resize-none"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Resolution History (If closed) */}
                    {dispute.status !== 'open' && (
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Resolution Notes</h3>
                            <p className="text-slate-700">{dispute.resolution_notes || 'No notes provided.'}</p>
                            <p className="text-xs text-slate-400 mt-2">
                                Resolved by {dispute.admin_id?.first_name || 'Admin'} on {new Date(dispute.updated_at).toLocaleString()}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                    >
                        Close
                    </button>
                    {dispute.status === 'open' && (
                        <button
                            onClick={handleSubmit}
                            disabled={!action || !notes || isResolving}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors shadow-sm shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isResolving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            Submit Resolution
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DisputeViewModal;
