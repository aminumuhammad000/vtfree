import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getUsers } from 'api/superAdminApi';

interface User {
    _id: string;
    name: string;
    email: string;
}

const NotificationManagement = () => {
    const [targetType, setTargetType] = useState<'all' | 'selected' | 'individual'>('all');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'info' | 'warning' | 'success' | 'error'>('info');
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

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

            setStatus({
                type: 'success',
                message: `In-app notification successfully sent to ${targetType === 'all' ? 'all users' : targetType === 'selected' ? `${selectedUsers.length} selected users` : 'the individual user'}.`
            });

            // Reset form
            setTitle('');
            setMessage('');
            setSelectedUsers([]);
        } catch (error) {
            setStatus({
                type: 'error',
                message: 'Failed to send notification. Please try again later.'
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
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">In-App Notifications</h1>
                <p className="text-slate-500 mt-1">Send real-time alerts and notifications to users' dashboards</p>
            </div>

            {status && (
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                    <Icon icon={status.type === 'success' ? "solar:check-circle-bold" : "solar:danger-bold"} width="24" />
                    <p className="font-medium">{status.message}</p>
                </div>
            )}

            <form onSubmit={handleSend} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 lg:p-8 space-y-6">
                    {/* Notification Type */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Notification Level</label>
                        <div className="flex flex-wrap gap-3">
                            {[
                                { id: 'info', label: 'Info', color: 'bg-blue-500', icon: 'solar:info-circle-bold' },
                                { id: 'success', label: 'Success', color: 'bg-emerald-500', icon: 'solar:check-circle-bold' },
                                { id: 'warning', label: 'Warning', color: 'bg-amber-500', icon: 'solar:danger-triangle-bold' },
                                { id: 'error', label: 'Error', color: 'bg-red-500', icon: 'solar:danger-circle-bold' }
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setType(t.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${type === t.id
                                            ? `border-${t.id === 'info' ? 'blue' : t.id === 'success' ? 'emerald' : t.id === 'warning' ? 'amber' : 'red'}-500 bg-${t.id === 'info' ? 'blue' : t.id === 'success' ? 'emerald' : t.id === 'warning' ? 'amber' : 'red'}-50 text-${t.id === 'info' ? 'blue' : t.id === 'success' ? 'emerald' : t.id === 'warning' ? 'amber' : 'red'}-700`
                                            : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
                                        }`}
                                >
                                    <Icon icon={t.icon} width="18" />
                                    <span className="font-bold text-sm">{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Target Selection */}
                    <div className="space-y-3">
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
                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${targetType === t.id
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md'
                                            : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
                                        }`}
                                >
                                    <Icon icon={t.icon} width="24" />
                                    <span className="font-bold">{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* User Selection List (Conditional) */}
                    {targetType !== 'all' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                {targetType === 'selected' ? 'Select Recipients' : 'Select Recipient'}
                            </label>
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

                    {/* Notification Content */}
                    <div className="space-y-4">
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
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Message Body</label>
                            <textarea
                                required
                                rows={4}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Write your notification message here..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none"
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Icon icon="solar:bell-bing-bold-duotone" width="18" className="text-emerald-600" />
                        <span>Notification will appear in user's dashboard immediately</span>
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
                                <Icon icon="solar:bell-bold" width="20" />
                                <span>Send Notification</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NotificationManagement;
