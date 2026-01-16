import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getUsers } from 'api/superAdminApi';

interface User {
    _id: string;
    name: string;
    email: string;
}

const Notifications = () => {
    const [activeTab, setActiveTab] = useState<'in-app' | 'email'>('in-app');
    const [targetType, setTargetType] = useState<'all' | 'selected' | 'individual'>('all');

    // Common state
    const [message, setMessage] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // In-App specific
    const [title, setTitle] = useState('');
    const [type, setType] = useState<'info' | 'warning' | 'success' | 'error'>('info');

    // Email specific
    const [subject, setSubject] = useState('');

    useEffect(() => {
        if (targetType !== 'all') {
            fetchUsers();
        }
    }, [targetType]);

    const fetchUsers = async () => {
        try {
            const response = await getUsers({ search: searchTerm });
            setUsers(response.data.users);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        setStatus(null);

        try {
            // Mocking the API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            const targetLabel = targetType === 'all' ? 'all users' : targetType === 'selected' ? `${selectedUsers.length} selected users` : 'the individual user';
            const methodLabel = activeTab === 'in-app' ? 'In-app notification' : 'Broadcast email';

            setStatus({
                type: 'success',
                message: `${methodLabel} successfully sent to ${targetLabel}.`
            });

            // Reset form
            setTitle('');
            setSubject('');
            setMessage('');
            setSelectedUsers([]);
        } catch (error) {
            setStatus({
                type: 'error',
                message: `Failed to send ${activeTab === 'in-app' ? 'notification' : 'email'}. Please try again later.`
            });
        } finally {
            setIsSending(false);
        }
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Messaging & Notifications</h1>
                    <p className="text-slate-500 mt-1">Communicate with your users via in-app alerts or email broadcasts</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-slate-200">
                <div className="flex gap-2 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('in-app')}
                        className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all duration-300 border-b-2 whitespace-nowrap ${activeTab === 'in-app'
                            ? 'border-emerald-600 text-emerald-600'
                            : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                            }`}
                    >
                        <Icon icon="solar:bell-bing-bold" width="20" />
                        <span>In-App Notification</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('email')}
                        className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all duration-300 border-b-2 whitespace-nowrap ${activeTab === 'email'
                            ? 'border-emerald-600 text-emerald-600'
                            : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                            }`}
                    >
                        <Icon icon="solar:letter-bold" width="20" />
                        <span>Email Broadcast</span>
                    </button>
                </div>
            </div>

            {status && (
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                    <Icon icon={status.type === 'success' ? "solar:check-circle-bold" : "solar:danger-bold"} width="24" />
                    <p className="font-medium">{status.message}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSend} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 lg:p-8 space-y-8">
                            {/* Recipient Selection */}
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Recipient Group</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {[
                                        { id: 'all', label: 'All Users', icon: 'solar:users-group-rounded-bold' },
                                        { id: 'selected', label: 'Selected Users', icon: 'solar:user-plus-bold' },
                                        { id: 'individual', label: 'Individual User', icon: 'solar:user-bold' }
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setTargetType(t.id as any)}
                                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${targetType === t.id
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                                                : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
                                                }`}
                                        >
                                            <Icon icon={t.icon} width="28" />
                                            <span className="font-bold text-sm">{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* User Selection List (Conditional) */}
                            {targetType !== 'all' && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                            {targetType === 'selected' ? 'Select Recipients' : 'Select Recipient'}
                                        </label>
                                        {targetType === 'selected' && selectedUsers.length > 0 && (
                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                                {selectedUsers.length} selected
                                            </span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="20" />
                                        <input
                                            type="text"
                                            placeholder="Search users by name or email..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onKeyUp={(e) => e.key === 'Enter' && fetchUsers()}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                    <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
                                        {users.length > 0 ? (
                                            users.map((user) => (
                                                <div
                                                    key={user._id}
                                                    onClick={() => targetType === 'selected' ? toggleUserSelection(user._id) : setSelectedUsers([user._id])}
                                                    className={`flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 transition-colors ${selectedUsers.includes(user._id) ? 'bg-emerald-50/50' : ''
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                                            {user.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                                                            <p className="text-xs text-slate-500">{user.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedUsers.includes(user._id)
                                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                                        : 'border-slate-200'
                                                        }`}>
                                                        {selectedUsers.includes(user._id) && <Icon icon="solar:check-read-bold" width="14" />}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center text-slate-400">
                                                <Icon icon="solar:users-group-rounded-linear" className="mx-auto mb-2" width="32" />
                                                <p className="text-sm">No users found. Try searching.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Content Fields */}
                            <div className="space-y-6">
                                {activeTab === 'in-app' ? (
                                    <>
                                        <div className="space-y-3">
                                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Notification Level</label>
                                            <div className="flex flex-wrap gap-3">
                                                {[
                                                    { id: 'info', label: 'Info', color: 'blue', icon: 'solar:info-circle-bold' },
                                                    { id: 'success', label: 'Success', color: 'emerald', icon: 'solar:check-circle-bold' },
                                                    { id: 'warning', label: 'Warning', color: 'amber', icon: 'solar:danger-triangle-bold' },
                                                    { id: 'error', label: 'Error', color: 'red', icon: 'solar:danger-circle-bold' }
                                                ].map((t) => (
                                                    <button
                                                        key={t.id}
                                                        type="button"
                                                        onClick={() => setType(t.id as any)}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${type === t.id
                                                            ? `border-${t.color}-500 bg-${t.color}-50 text-${t.color}-700`
                                                            : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
                                                            }`}
                                                    >
                                                        <Icon icon={t.icon} width="18" />
                                                        <span className="font-bold text-sm">{t.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Notification Title</label>
                                            <input
                                                type="text"
                                                required
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="Enter notification title..."
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Email Subject</label>
                                        <input
                                            type="text"
                                            required
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            placeholder="Enter email subject..."
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Message Body</label>
                                    <textarea
                                        required
                                        rows={activeTab === 'email' ? 10 : 5}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder={`Write your ${activeTab === 'email' ? 'email content' : 'notification message'} here...`}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none"
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <div className="hidden sm:flex items-center gap-2 text-slate-500 text-sm">
                                <Icon icon={activeTab === 'email' ? "solar:info-circle-linear" : "solar:bell-bing-bold-duotone"} width="18" className="text-emerald-600" />
                                <span>{activeTab === 'email' ? 'Sent from system@vtfree.com' : 'Appears in user dashboard immediately'}</span>
                            </div>
                            <button
                                type="submit"
                                disabled={isSending || (targetType !== 'all' && selectedUsers.length === 0)}
                                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${isSending || (targetType !== 'all' && selectedUsers.length === 0)
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-200 active:scale-95'
                                    }`}
                            >
                                {isSending ? (
                                    <>
                                        <Icon icon="solar:refresh-linear" className="animate-spin" width="20" />
                                        <span>Sending...</span>
                                    </>
                                ) : (
                                    <>
                                        <Icon icon={activeTab === 'email' ? "solar:plain-bold" : "solar:bell-bold"} width="20" />
                                        <span>Send {activeTab === 'email' ? 'Broadcast' : 'Notification'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                            <Icon icon="solar:lightbulb-bold" className="text-amber-500" width="24" />
                            Sending Tips
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-slate-700">Targeting</p>
                                <p className="text-xs text-slate-500">Use "Selected Users" for maintenance alerts affecting specific groups.</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-slate-700">Timing</p>
                                <p className="text-xs text-slate-500">In-app notifications are instant. Emails may take a few minutes to deliver.</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-slate-700">Formatting</p>
                                <p className="text-xs text-slate-500">Keep in-app messages short. Use email for detailed announcements.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-100">
                        <Icon icon="solar:shield-check-bold" width="32" className="mb-4 opacity-80" />
                        <h3 className="font-bold text-lg mb-2">Safe Delivery</h3>
                        <p className="text-sm text-emerald-50 opacity-90 leading-relaxed">
                            All messages are logged for audit purposes. Ensure content complies with platform policies before broadcasting.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
