import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useState, useEffect } from 'react';
import { UserService } from 'services/user.service';
import { toast } from 'react-hot-toast';

interface UserData {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    status: string;
    created_at: string;
    apps_count?: number;
    wallet_balance?: number;
    address?: string;
    total_transactions?: number;
    total_revenue?: number;
    type: 'vtfree-users' | 'admin-users';
    role?: string;
    app_id?: string;
    virtual_account?: {
        bank: string;
        account_number: string;
        account_name: string;
    } | null;
    apps?: any[];
}

const UserDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const userType = location.state?.type || 'vtfree-users';
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreditModal, setShowCreditModal] = useState(false);
    const [creditAmount, setCreditAmount] = useState('');
    const [creditReason, setCreditReason] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            if (!id) return;
            setLoading(true);
            try {
                let data;
                if (userType === 'vtfree-users') {
                    data = await UserService.getOwnerById(id);
                } else {
                    data = await UserService.getAdminById(id);
                }

                if (data) {
                    const mappedUser: UserData = {
                        _id: data._id,
                        first_name: data.first_name,
                        last_name: data.last_name,
                        email: data.email,
                        phone_number: data.phone_number || 'N/A',
                        status: data.status,
                        created_at: data.created_at,
                        type: userType,
                        wallet_balance: data.wallet_balance,
                        role: data.role,
                        app_id: data.app_id,
                        apps: data.apps || [],
                        // Add other fields if available in backend
                        apps_count: data.apps?.length || 0,
                        total_transactions: 0,
                        total_revenue: 0
                    };
                    setUser(mappedUser);
                }
            } catch (error) {
                console.error('Error fetching user details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [id, userType]);

    const handleCreditWallet = async () => {
        if (!id || !creditAmount || isNaN(Number(creditAmount))) return;

        setLoading(true);
        setError(null);
        try {
            const response = await UserService.creditOwnerWallet(id, Number(creditAmount), creditReason);
            if (response.success) {
                // Update local user state with new balance
                if (user) {
                    setUser({
                        ...user,
                        wallet_balance: response.data.wallet_balance
                    });
                }
                setShowCreditModal(false);
                setCreditAmount('');
                setCreditReason('');
                toast.success(response.message || 'Wallet credited successfully');
            } else {
                setError(response.message || 'Failed to credit wallet');
                toast.error(response.message || 'Failed to credit wallet');
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'An error occurred';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return <div className="text-center py-12">User not found</div>;
    }

    const stats = user.type === 'vtfree-users' ? [
        { label: 'Wallet Balance', value: `₦${user.wallet_balance?.toLocaleString()}`, icon: 'solar:wallet-money-bold-duotone', color: 'green' },
        { label: 'Total Apps', value: user.apps_count, icon: 'solar:smartphone-2-bold-duotone', color: 'blue' },
        { label: 'Transactions', value: user.total_transactions, icon: 'solar:bill-list-bold-duotone', color: 'purple' },
        { label: 'Total Revenue', value: `₦${user.total_revenue?.toLocaleString()}`, icon: 'solar:dollar-bold-duotone', color: 'orange' },
    ] : [
        { label: 'Role', value: user.role, icon: 'solar:shield-user-bold-duotone', color: 'blue' },
        { label: 'Status', value: user.status.toUpperCase(), icon: 'solar:user-check-bold-duotone', color: 'green' },
    ];

    const getStatusColor = (status: string) => {
        return status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-white rounded-lg border border-slate-200 transition-colors"
                    >
                        <Icon icon="solar:arrow-left-linear" width="24" height="24" />
                    </button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                            {user.type === 'vtfree-users' ? 'User Details' : 'Admin Details'}
                        </h1>
                        <p className="text-slate-500 text-sm sm:text-base">View and manage information</p>
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-medium text-sm transition-colors">
                        Edit {user.type === 'vtfree-users' ? 'User' : 'Admin'}
                    </button>
                    <button className="flex-1 sm:flex-none px-4 py-2 bg-red-50 text-red-600 rounded-xl font-medium text-sm hover:bg-red-100 transition-colors">
                        Suspend
                    </button>
                </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl sm:text-4xl flex-shrink-0">
                        {user.first_name[0]}{user.last_name[0]}
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{user.first_name} {user.last_name}</h2>
                                <div className="flex flex-wrap items-center gap-2 mt-2 text-slate-500 text-sm">
                                    <div className="flex items-center gap-1">
                                        <Icon icon="solar:letter-linear" width="16" height="16" />
                                        <span className="break-all">{user.email}</span>
                                    </div>
                                    <span>•</span>
                                    <a
                                        href={`https://wa.me/${user.phone_number.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:underline"
                                    >
                                        <Icon icon="logos:whatsapp-icon" width="16" height="16" />
                                        <span>{user.phone_number}</span>
                                    </a>
                                    {user.type === 'admin-users' && user.app_id && (
                                        <>
                                            <span>•</span>
                                            <div className="flex items-center gap-1 text-blue-600">
                                                <Icon icon="solar:globus-linear" width="16" height="16" />
                                                <span className="font-semibold">App ID: {user.app_id}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <span className={`px-3 py-1.5 rounded-full text-sm font-bold h-fit ${getStatusColor(user.status)}`}>
                                    {user.status.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Address</p>
                                <p className="font-medium text-slate-900 text-sm">{user.address || 'Not provided'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Joined Date</p>
                                <p className="font-medium text-slate-900 text-sm">{new Date(user.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Virtual Account Info (Only for VTFree Users) */}
            {user.type === 'vtfree-users' && user.virtual_account && (
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                            <Icon icon="solar:card-bold" width="24" />
                        </div>
                        <h3 className="text-lg font-bold">Virtual Account Details</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div>
                            <p className="text-slate-400 text-sm mb-1">Bank Name</p>
                            <p className="font-bold text-lg">{user.virtual_account.bank}</p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm mb-1">Account Number</p>
                            <div className="flex items-center gap-2">
                                <p className="font-mono font-bold text-xl tracking-wider">{user.virtual_account.account_number}</p>
                                <button className="p-1 hover:bg-white/10 rounded transition-colors" title="Copy">
                                    <Icon icon="solar:copy-bold" width="16" />
                                </button>
                            </div>
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm mb-1">Account Name</p>
                            <p className="font-bold text-lg">{user.virtual_account.account_name}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <div key={index} className={`bg-white rounded-xl p-5 border border-${stat.color}-100 hover:shadow-lg transition-all`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-3 bg-${stat.color}-50 rounded-xl flex-shrink-0`}>
                                <Icon icon={stat.icon} width="24" height="24" className={`text-${stat.color}-600`} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{stat.value}</p>
                                <p className="text-xs sm:text-sm text-slate-500">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Connected Apps (Only for VTFree Users) */}
            {user.type === 'vtfree-users' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-900">Connected Apps</h3>
                        <button
                            onClick={() => setShowCreditModal(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                            <Icon icon="solar:wallet-add-bold" width="18" />
                            Credit Wallet
                        </button>
                    </div>
                    {user.apps && user.apps.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {user.apps.map((app) => (
                                <div
                                    key={app._id}
                                    onClick={() => navigate(`/pages/apps`)} // Or specific app page if it exists
                                    className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 flex-shrink-0">
                                            {app.branding?.logo_url ? (
                                                <img src={app.branding.logo_url} alt="" className="w-full h-full rounded-lg object-cover" />
                                            ) : (
                                                <Icon icon="solar:smartphone-2-bold-duotone" width="24" height="24" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 truncate">{app.app_name}</p>
                                            <p className="text-xs text-slate-500">ID: {app.app_id}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Status</span>
                                        <span className={`font-medium ${app.status === 'active' ? 'text-green-600' : 'text-orange-600'}`}>
                                            {app.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl text-slate-400">
                            No apps connected to this account
                        </div>
                    )}
                </div>
            )}

            {/* Credit Modal */}
            {showCreditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900">Credit User Wallet</h3>
                            <button onClick={() => setShowCreditModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
                                <Icon icon="solar:close-circle-bold" width="24" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Amount (₦)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₦</span>
                                    <input
                                        type="number"
                                        value={creditAmount}
                                        onChange={(e) => setCreditAmount(e.target.value)}
                                        className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all font-mono text-lg"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Reason (Optional)</label>
                                <textarea
                                    value={creditReason}
                                    onChange={(e) => setCreditReason(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm h-24 resize-none"
                                    placeholder="Enter reason for credit..."
                                />
                            </div>
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
                                    <Icon icon="solar:danger-bold" width="18" />
                                    {error}
                                </div>
                            )}
                        </div>
                        <div className="p-6 bg-slate-50 flex gap-3">
                            <button
                                onClick={() => setShowCreditModal(false)}
                                className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreditWallet}
                                disabled={!creditAmount || Number(creditAmount) <= 0 || loading}
                                className="flex-1 px-4 py-3 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    'Complete Credit'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDetails;
