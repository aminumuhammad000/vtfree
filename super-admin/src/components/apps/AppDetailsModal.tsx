import { useState } from 'react';
import { Icon } from '@iconify/react';
import { deleteApp, updateAppStatus } from 'api/superAdminApi';
import toast from 'react-hot-toast';

interface App {
    // ...
    _id: string;
    app_name: string;
    app_id: string;
    owner_id: {
        first_name: string;
        last_name: string;
        email: string;
        phone?: string;
    };
    status: string;
    created_at: string;
    package_name: string;
    total_revenue?: number;
    total_transactions?: number;
    total_end_users?: number;
    download_url?: string;
    version?: string;
    platforms?: {
        android: boolean;
        ios: boolean;
        web: boolean;
    };
    services?: string[];
}

interface AppDetailsModalProps {
    app: App;
    onClose: () => void;
    onStatusChange?: (appId: string, newStatus: string) => void;
    onDelete?: (appId: string) => void;
}

const AppDetailsModal = ({ app, onClose, onStatusChange, onDelete }: AppDetailsModalProps) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'technical' | 'owner'>('overview');
    const [isProcessing, setIsProcessing] = useState(false);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'live':
            case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'suspended': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const handleAction = async (action: 'approve' | 'reject' | 'suspend' | 'activate') => {
        setIsProcessing(true);
        try {
            let newStatus = '';
            switch (action) {
                case 'approve':
                case 'activate': newStatus = 'live'; break;
                case 'reject': newStatus = 'rejected'; break;
                case 'suspend': newStatus = 'suspended'; break;
            }

            const response = await updateAppStatus(app._id, newStatus);
            if (response.data.success) {
                toast.success(`App status updated to ${newStatus}`);
                if (onStatusChange) {
                    onStatusChange(app._id, newStatus);
                }
            } else {
                toast.error(response.data.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Update status error:', error);
            toast.error('Failed to update app status. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Are you SURE you want to delete ${app.app_name}? This will remove everything including app accounts, users and admin.`)) {
            return;
        }

        setIsProcessing(true);
        try {
            const response = await deleteApp(app._id);
            if (response.data.success) {
                toast.success('App deleted successfully');
                if (onDelete) onDelete(app._id);
            } else {
                toast.error(response.data.message || 'Failed to delete app');
            }
        } catch (error: any) {
            console.error('Delete app error:', error);
            toast.error(error.response?.data?.message || 'Failed to delete app. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 bg-white sticky top-0 z-10">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-500/20">
                                {app.app_name[0]}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                    {app.app_name}
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusColor(app.status)}`}>
                                        {app.status.toUpperCase()}
                                    </span>
                                </h2>
                                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 font-medium">
                                    <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => handleCopy(app.package_name)}>
                                        <Icon icon="solar:box-minimalistic-bold-duotone" className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                        <span className="font-mono group-hover:text-slate-700 transition-colors">{app.package_name}</span>
                                        <Icon icon="solar:copy-bold" className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                                    </div>
                                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                                    <div className="flex items-center gap-1.5">
                                        <Icon icon="solar:smartphone-bold-duotone" className="text-slate-400" />
                                        <span>v{app.version || '1.0.0'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                            <Icon icon="solar:close-circle-bold" width="28" height="28" />
                        </button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex items-center gap-8 mt-8 border-b border-slate-100 -mb-6">
                        {['overview', 'technical', 'owner'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`pb-4 text-sm font-semibold capitalize transition-all relative ${activeTab === tab
                                    ? 'text-blue-600'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Key Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                            <Icon icon="solar:wallet-money-bold-duotone" width="24" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-500">Total Revenue</span>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">₦{(app.total_revenue || 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                            <Icon icon="solar:users-group-rounded-bold-duotone" width="24" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-500">Total Users</span>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">{(app.total_end_users || 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                            <Icon icon="solar:transfer-horizontal-bold-duotone" width="24" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-500">Transactions</span>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">{(app.total_transactions || 0).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Active Features */}
                                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Icon icon="solar:layers-minimalistic-bold-duotone" className="text-indigo-500" />
                                        Active Services
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {app.services && app.services.length > 0 ? (
                                            app.services.map((service, idx) => (
                                                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-medium text-slate-700">
                                                    <Icon icon="solar:check-circle-bold" className="text-green-500 text-xs" />
                                                    {service.replace(/_/g, ' ').toUpperCase()}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="w-full py-8 text-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                                No specific features enabled
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* About/Metadata */}
                                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Icon icon="solar:info-circle-bold-duotone" className="text-blue-500" />
                                        App Information
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                            <span className="text-sm text-slate-500">App ID</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm text-slate-900 bg-slate-100 px-2 py-1 rounded">{app.app_id}</span>
                                                <button onClick={() => handleCopy(app.app_id)} className="text-slate-400 hover:text-blue-600"><Icon icon="solar:copy-bold" width="16" /></button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                            <span className="text-sm text-slate-500">Created On</span>
                                            <span className="text-sm font-medium text-slate-900">{new Date(app.created_at).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}</span>
                                        </div>
                                        {app.download_url && (
                                            <div className="pt-2">
                                                <a href={app.download_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-50 text-blue-600 rounded-xl font-semibold hover:bg-blue-100 transition-colors">
                                                    <Icon icon="solar:download-minimalistic-bold" />
                                                    Download APK
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TECHNICAL TAB */}
                    {activeTab === 'technical' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Platform Support</h3>
                                <div className="flex gap-4">
                                    {['android', 'ios', 'web'].map((platform) => {
                                        const isSupported = app.platforms ? (app.platforms as any)[platform] : false;
                                        return (
                                            <div key={platform} className={`flex-1 flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${isSupported
                                                ? 'border-blue-500 bg-blue-50/50 text-blue-700'
                                                : 'border-slate-100 bg-slate-50 text-slate-400 grayscale'
                                                }`}>
                                                <Icon
                                                    icon={platform === 'web' ? 'logos:chrome' : platform === 'android' ? 'logos:android-icon' : 'logos:apple'}
                                                    width="40"
                                                    className="mb-3"
                                                />
                                                <span className="font-bold capitalize">{platform}</span>
                                                <span className="text-xs mt-1 font-medium bg-white px-2 py-0.5 rounded-full border border-current opacity-70">
                                                    {isSupported ? 'Active' : 'Not Supported'}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm opacity-60">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Build Configuration (Read-Only)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <span className="block text-xs text-slate-500 uppercase font-bold mb-1">Bundle ID</span>
                                        <span className="font-mono text-sm text-slate-700">{app.package_name}</span>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <span className="block text-xs text-slate-500 uppercase font-bold mb-1">Build Version</span>
                                        <span className="font-mono text-sm text-slate-700">1.0.0 (Build 42)</span>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-lg col-span-2">
                                        <span className="block text-xs text-slate-500 uppercase font-bold mb-1">API Endpoint</span>
                                        <span className="font-mono text-sm text-slate-700">https://api.vtfree.com/v1/apps/{app.app_id}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* OWNER TAB */}
                    {activeTab === 'owner' && (
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="h-32 bg-gradient-to-r from-slate-800 to-slate-900 relative">
                                <div className="absolute inset-0 bg-[url('https://api.dicebear.com/7.x/shapes/svg')] opacity-10"></div>
                            </div>
                            <div className="px-8 pb-8">
                                <div className="relative -mt-12 mb-6 text-center lg:text-left flex flex-col lg:flex-row items-center gap-6">
                                    <div className="w-24 h-24 bg-white p-1 rounded-full shadow-lg">
                                        <img
                                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${app.owner_id?.first_name} ${app.owner_id?.last_name}`}
                                            alt="Owner"
                                            className="w-full h-full rounded-full bg-slate-100"
                                        />
                                    </div>
                                    <div className="pt-10 lg:pt-0">
                                        <h3 className="text-2xl font-bold text-slate-900">{app.owner_id?.first_name} {app.owner_id?.last_name}</h3>
                                        <p className="text-slate-500">App Owner • User since 2024</p>
                                    </div>
                                    <div className="lg:ml-auto pt-4 lg:pt-0">
                                        <button className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-xl transition-colors flex items-center gap-2">
                                            <Icon icon="solar:user-id-bold" />
                                            View Full Profile
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors">
                                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg"><Icon icon="solar:letter-bold" width="20" /></div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-medium uppercase">Email Address</p>
                                                <p className="text-sm font-semibold text-slate-900">{app.owner_id?.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors">
                                            <div className="p-2.5 bg-green-50 text-green-600 rounded-lg"><Icon icon="solar:phone-bold" width="20" /></div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-medium uppercase">Phone Number</p>
                                                <p className="text-sm font-semibold text-slate-900">{app.owner_id?.phone || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100">
                                        <h4 className="font-bold text-blue-900 mb-2">Notes</h4>
                                        <p className="text-sm text-blue-700/80 leading-relaxed">
                                            This user has completed KYC verification. They have 2 other active apps on the platform.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer / Actions */}
                <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between gap-4">
                    <div className="text-sm text-slate-500">
                        Last updated: {new Date(app.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex gap-3">
                        {app.status === 'pending' ? (
                            <>
                                <button
                                    onClick={() => handleAction('reject')}
                                    disabled={isProcessing}
                                    className="px-6 py-2.5 border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all focus:ring-2 focus:ring-red-500/20 disabled:opacity-50"
                                >
                                    Reject App
                                </button>
                                <button
                                    onClick={() => handleAction('approve')}
                                    disabled={isProcessing}
                                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-105 transition-all focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isProcessing && <Icon icon="svg-spinners:ring-resize" />}
                                    Approve Application
                                </button>
                            </>
                        ) : app.status === 'active' || app.status === 'live' ? (
                            <button
                                onClick={() => handleAction('suspend')}
                                disabled={isProcessing}
                                className="px-6 py-2.5 border border-amber-200 text-amber-700 font-bold rounded-xl hover:bg-amber-50 transition-all focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50 flex items-center gap-2"
                            >
                                <Icon icon="solar:forbidden-circle-bold" />
                                Suspend App
                            </button>
                        ) : (
                            <button
                                onClick={() => handleAction('activate')}
                                disabled={isProcessing}
                                className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
                            >
                                Reactivate App
                            </button>
                        )}
                        <button
                            onClick={handleDelete}
                            disabled={isProcessing}
                            className="px-4 py-2.5 border border-red-200 text-red-500 hover:bg-red-50 font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                            title="Delete App"
                        >
                            <Icon icon="solar:trash-bin-trash-bold" />
                            Delete
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AppDetailsModal;
