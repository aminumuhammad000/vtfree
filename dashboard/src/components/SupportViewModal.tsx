import React from 'react';
import { FiX, FiUser, FiMail, FiClock } from 'react-icons/fi';

interface SupportViewModalProps {
    ticket: any;
    onClose: () => void;
}

const SupportViewModal: React.FC<SupportViewModalProps> = ({ ticket, onClose }) => {
    if (!ticket) return null;

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'new': return 'bg-green-100 text-green-700 border-green-200';
            case 'replied': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'resolved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'bg-red-100 text-red-700 border-red-200';
            case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'low': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
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
                        <h2 className="text-xl font-bold text-slate-900">Ticket Details</h2>
                        <p className="text-sm text-slate-500 font-mono mt-1">ID: {ticket._id}</p>
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
                    {/* Status & Priority Badges */}
                    <div className="flex gap-3 mb-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-2"></span>
                            {ticket.status?.toUpperCase()}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority?.toUpperCase()} Priority
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
                                <p className="font-medium text-slate-900">{ticket.user_id?.first_name} {ticket.user_id?.last_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Email</p>
                                <div className="flex items-center gap-2">
                                    <FiMail className="w-3 h-3 text-slate-400" />
                                    <a href={`mailto:${ticket.user_id?.email}`} className="font-medium text-green-600 hover:underline">
                                        {ticket.user_id?.email}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ticket Content */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">{ticket.subject}</h3>
                            <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {ticket.description || ticket.message}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <FiClock className="w-4 h-4" />
                            <span>Created on {new Date(ticket.created_at).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                    >
                        Close
                    </button>
                    <button
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors shadow-sm shadow-green-200"
                    >
                        Reply to Ticket
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SupportViewModal;
