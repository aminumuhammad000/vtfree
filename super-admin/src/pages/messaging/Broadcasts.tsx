import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getUsers } from 'api/superAdminApi';

interface User {
    _id: string;
    name: string;
    email: string;
}

const Broadcasts = () => {
    const [targetType, setTargetType] = useState<'all' | 'selected' | 'individual'>('all');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
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
            // Mocking the API call for now as we don't have a broadcast endpoint yet
            await new Promise(resolve => setTimeout(resolve, 2000));

            setStatus({
                type: 'success',
                message: `Broadcast successfully sent to ${targetType === 'all' ? 'all users' : targetType === 'selected' ? `${selectedUsers.length} selected users` : 'the individual user'}.`
            });

            // Reset form
            setSubject('');
            setMessage('');
            setSelectedUsers([]);
        } catch (error) {
            setStatus({
                type: 'error',
                message: 'Failed to send broadcast. Please try again later.'
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
                <h1 className="text-3xl font-bold text-slate-900">Broadcast Emails</h1>
                <p className="text-slate-500 mt-1">Send system-wide announcements or targeted messages to your users</p>
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
                    {/* Target Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Recipient Group</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { id: 'all', label: 'All Users', icon: 'solar:users-group-rounded-bold' },
                                { id: 'selected', label: 'Selected Users', icon: 'solar:user-plus-bold' },
                                { id: 'individual', label: 'Individual User', icon: 'solar:user-bold' }
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setTargetType(type.id as any)}
                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${targetType === type.id
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md'
                                        : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
                                        }`}
                                >
                                    <Icon icon={type.icon} width="24" />
                                    <span className="font-bold">{type.label}</span>
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
                            {targetType === 'selected' && selectedUsers.length > 0 && (
                                <p className="text-xs font-bold text-emerald-600">{selectedUsers.length} users selected</p>
                            )}
                        </div>
                    )}

                    {/* Email Content */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Subject</label>
                            <input
                                type="text"
                                required
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Enter email subject..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Message Content</label>
                            <textarea
                                required
                                rows={8}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Write your message here..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none"
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Icon icon="solar:info-circle-linear" width="18" />
                        <span>Emails will be sent from system@vtfree.com</span>
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
                                <Icon icon="solar:plain-bold" width="20" />
                                <span>Send Broadcast</span>
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Tips Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                    <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-2">
                        <Icon icon="solar:lightbulb-bold" className="text-blue-600" />
                        Best Practices
                    </h3>
                    <ul className="text-sm text-blue-700 space-y-2 list-disc list-inside">
                        <li>Keep subjects clear and concise</li>
                        <li>Use a professional tone for system updates</li>
                        <li>Double-check recipient selection before sending</li>
                        <li>Avoid sending too many broadcasts to prevent spam filters</li>
                    </ul>
                </div>
                <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                    <h3 className="font-bold text-amber-900 flex items-center gap-2 mb-2">
                        <Icon icon="solar:shield-warning-bold" className="text-amber-600" />
                        Important Note
                    </h3>
                    <p className="text-sm text-amber-700">
                        Broadcasts are sent immediately and cannot be recalled. Ensure all information, especially links and dates, are accurate before hitting send.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Broadcasts;
