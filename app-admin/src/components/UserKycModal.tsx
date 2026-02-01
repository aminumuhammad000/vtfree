import React from 'react';
import { FiX, FiCheck, FiXCircle, FiImage, FiCalendar, FiUser, FiInfo, FiMapPin, FiSmartphone } from 'react-icons/fi';


interface UserKycModalProps {
    user: any;
    onClose: () => void;
    onApprove: (userId: string) => void;
    onReject: (userId: string) => void;
    isSaving: boolean;
}

const UserKycModal: React.FC<UserKycModalProps> = ({ user, onClose, onApprove, onReject, isSaving }) => {
    if (!user) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600 text-xl">
                            <FiCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">KYC Verification</h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Review document uploads for {user.first_name} {user.last_name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl transition-all shadow-sm border border-transparent hover:border-slate-100"
                    >
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto max-h-[70vh]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Front Document */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <FiImage className="text-blue-500" />
                                    ID Front Side
                                </h4>
                            </div>
                            <div className="aspect-[4/3] bg-slate-100 rounded-3xl overflow-hidden border-2 border-dashed border-slate-200 group relative">
                                {user.kyc_document_id_front_url ? (
                                    <img
                                        src={user.kyc_document_id_front_url}
                                        alt="ID Front"
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                                        <FiImage className="w-12 h-12 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No Image Uploaded</p>
                                    </div>
                                )}
                                {user.kyc_document_id_front_url && (
                                    <a
                                        href={user.kyc_document_id_front_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="absolute inset-0 bg-slate-900/0 hover:bg-slate-900/20 flex items-center justify-center transition-all group-hover:opacity-100 opacity-0"
                                    >
                                        <span className="px-4 py-2 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">View Original</span>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Back Document */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <FiImage className="text-blue-500" />
                                    ID Back Side
                                </h4>
                            </div>
                            <div className="aspect-[4/3] bg-slate-100 rounded-3xl overflow-hidden border-2 border-dashed border-slate-200 group relative">
                                {user.kyc_document_id_back_url ? (
                                    <img
                                        src={user.kyc_document_id_back_url}
                                        alt="ID Back"
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                                        <FiImage className="w-12 h-12 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No Image Uploaded</p>
                                    </div>
                                )}
                                {user.kyc_document_id_back_url && (
                                    <a
                                        href={user.kyc_document_id_back_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="absolute inset-0 bg-slate-900/0 hover:bg-slate-900/20 flex items-center justify-center transition-all group-hover:opacity-100 opacity-0"
                                    >
                                        <span className="px-4 py-2 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">View Original</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Personal Details Section */}
                    <div className="mt-8 bg-slate-50 rounded-[2rem] p-6 border border-slate-100 overflow-hidden">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                            <FiInfo className="text-blue-500" />
                            Personal Verification Details
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</span>
                                <div className="flex items-center gap-2 text-slate-700 font-bold">
                                    <FiSmartphone className="text-slate-400" />
                                    {user.phone_number || 'N/A'}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BVN</span>
                                <div className="text-slate-700 font-mono font-bold tracking-wider">
                                    {user.bvn || 'Not Provided'}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NIN</span>
                                <div className="text-slate-700 font-mono font-bold tracking-wider">
                                    {user.nin || 'Not Provided'}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date of Birth</span>
                                <div className="flex items-center gap-2 text-slate-700 font-bold">
                                    <FiCalendar className="text-slate-400" />
                                    {user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : 'N/A'}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Residential Address</span>
                                <div className="flex items-start gap-2 text-slate-700 font-bold">
                                    <FiMapPin className="text-slate-400 mt-1" />
                                    <span className="leading-tight">{user.address || 'N/A'}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">City & State</span>
                                <div className="flex items-center gap-2 text-slate-700 font-bold">
                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 uppercase text-[10px] font-black">
                                        {user.state?.slice(0, 2) || 'NG'}
                                    </div>
                                    <span>{user.city || 'N/A'}, {user.state || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Meta Section */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center gap-4 shadow-sm">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                                <FiUser />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">User Name</p>
                                <p className="text-sm font-bold text-slate-900">{user.first_name} {user.last_name}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center gap-4 shadow-sm">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                                <FiCalendar />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted Date</p>
                                <p className="text-sm font-bold text-slate-900">{new Date(user.updated_at || user.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex items-center gap-4 text-blue-600 shadow-sm">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-200">
                                <FiCheck />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Current Status</p>
                                <p className="text-sm font-bold uppercase tracking-tight">{user.kyc_status || 'PENDING'}</p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-8 py-8 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <p className="text-xs text-slate-500 font-medium max-w-md text-center sm:text-left">
                        Review the documents carefully before approving. Make sure the information matches the registered user profile.
                    </p>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <button
                            onClick={() => onReject(user._id)}
                            disabled={isSaving}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-rose-100 text-rose-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-50 hover:border-rose-200 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <FiXCircle className="w-4 h-4" />
                            Reject KYC
                        </button>
                        <button
                            onClick={() => onApprove(user._id)}
                            disabled={isSaving}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-green-700 shadow-xl shadow-green-100 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <FiCheck className="w-4 h-4" />
                            {isSaving ? 'Verifying...' : 'Approve KYC'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserKycModal;
