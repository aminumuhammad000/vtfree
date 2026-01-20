import React, { useState } from 'react';
import {
    FiBell,
    FiMail,
    FiSend,
    FiInfo,
    FiCheckCircle,
    FiAlertTriangle,
    FiRefreshCw,
    FiType,
    FiMessageSquare,
    FiLink,
    FiZap,
    FiTarget,
    FiLayout,
    FiUser,
    FiSearch,
    FiX,
    FiCheck
} from 'react-icons/fi';
import { getUsers } from '../api/adminApi';
import { useQuery } from '@tanstack/react-query';
import * as adminApi from '../api/adminApi';
import Layout from '../components/Layout';
import { useToast } from '../hooks/ToastContext';

interface NotificationType {
    id: string;
    label: string;
    icon: React.ElementType;
    description: string;
    color: string;
}

const notificationTypes: NotificationType[] = [
    {
        id: 'system',
        label: 'System Info',
        icon: FiInfo,
        description: 'General system announcements',
        color: 'blue'
    },
    {
        id: 'promotion',
        label: 'Promotion',
        icon: FiZap,
        description: 'Marketing offers and deals',
        color: 'green'
    },
    {
        id: 'alert',
        label: 'Critical Alert',
        icon: FiAlertTriangle,
        description: 'Urgent warnings and notices',
        color: 'amber'
    },
    {
        id: 'app_update',
        label: 'App Update',
        icon: FiRefreshCw,
        description: 'New version availability',
        color: 'purple'
    },
];

export default function Notifications() {
    const { showSuccess, showError, showWarning } = useToast();
    const [activeTab, setActiveTab] = useState<'notification' | 'email'>('notification');

    // Notification State
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('system');
    const [actionLink, setActionLink] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Email State
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);

    // User Selection State
    const [target, setTarget] = useState<'all' | 'selected'>('all');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

    const { data: usersData } = useQuery({
        queryKey: ['users-for-notification'],
        queryFn: () => getUsers({ page: 1, limit: 1000 }).then((res: any) => res.data),
    });

    const users = usersData?.data || [];

    const filteredUsers = React.useMemo(() => {
        if (!userSearchTerm) return users.slice(0, 10);
        return users.filter((user: any) =>
            user.first_name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
            user.last_name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
        ).slice(0, 10);
    }, [users, userSearchTerm]);

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleTypeSelect = (selectedType: string) => {
        setType(selectedType);
        if (selectedType === 'app_update') {
            setTitle('New App Update Available!');
            setMessage('A new version of the app is available. Please update now for the latest features and improvements.');
        }
    };

    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !message.trim()) {
            showWarning('Please fill in both title and message');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await adminApi.sendBroadcastNotification({
                title: title.trim(),
                message: message.trim(),
                type,
                action_link: actionLink.trim() || undefined,
                target,
                userIds: target === 'selected' ? selectedUserIds : undefined
            });

            if (response.data?.success) {
                showSuccess(response.data.message || 'Broadcast notification dispatched successfully');
                setTitle('');
                setMessage('');
                setActionLink('');
                setType('system');
            } else {
                showError(response.data?.message || 'Failed to dispatch notification');
            }
        } catch (error: any) {
            showError(error?.response?.data?.message || 'Failed to dispatch notification');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!emailSubject.trim() || !emailMessage.trim()) {
            showWarning('Please fill in both subject and message content');
            return;
        }

        setIsEmailSubmitting(true);
        try {
            const response = await adminApi.sendBroadcastEmail({
                subject: emailSubject.trim(),
                message: emailMessage.trim(),
                target,
                userIds: target === 'selected' ? selectedUserIds : undefined
            });

            if (response.data?.success) {
                showSuccess(response.data.message || 'Email broadcast dispatched successfully');
                setEmailSubject('');
                setEmailMessage('');
            } else {
                showError(response.data?.message || 'Failed to dispatch email broadcast');
            }
        } catch (error: any) {
            showError(error?.response?.data?.message || 'Failed to dispatch email broadcast');
        } finally {
            setIsEmailSubmitting(false);
        }
    };

    return (
        <Layout>
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">Broadcast Center</h1>
                            <p className="text-sm sm:text-lg text-slate-600 font-medium">Reach all users via push notifications or direct email</p>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex flex-col sm:flex-row p-1.5 bg-slate-100 rounded-2xl sm:rounded-[2rem] w-full sm:w-fit gap-2 sm:gap-0">
                        <button
                            onClick={() => setActiveTab('notification')}
                            className={`flex items-center justify-center sm:justify-start gap-3 px-8 py-3.5 rounded-xl sm:rounded-[1.5rem] text-sm font-black uppercase tracking-widest transition-all w-full sm:w-auto ${activeTab === 'notification'
                                ? 'bg-white text-green-600 shadow-xl shadow-slate-200'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                                }`}
                        >
                            <FiBell className={`w-5 h-5 ${activeTab === 'notification' ? 'text-green-600' : 'text-slate-400'}`} />
                            Push Notification
                        </button>
                        <button
                            onClick={() => setActiveTab('email')}
                            className={`flex items-center justify-center sm:justify-start gap-3 px-8 py-3.5 rounded-xl sm:rounded-[1.5rem] text-sm font-black uppercase tracking-widest transition-all w-full sm:w-auto ${activeTab === 'email'
                                ? 'bg-white text-green-600 shadow-xl shadow-slate-200'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                                }`}
                        >
                            <FiMail className={`w-5 h-5 ${activeTab === 'email' ? 'text-green-600' : 'text-slate-400'}`} />
                            Email Broadcast
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Form Area */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-green-600">
                                        {activeTab === 'notification' ? <FiBell className="w-5 h-5" /> : <FiMail className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">
                                            {activeTab === 'notification' ? 'Compose Notification' : 'Compose Email'}
                                        </h2>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Draft your broadcast message</p>
                                    </div>
                                </div>

                                {/* Target Selection */}
                                <div className="px-8 pt-8 pb-0 space-y-4">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Target Audience</label>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setTarget('all')}
                                            className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${target === 'all'
                                                    ? 'border-green-500 bg-green-50 text-green-700'
                                                    : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                                                }`}
                                        >
                                            <FiTarget className="w-4 h-4" />
                                            All Users
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTarget('selected')}
                                            className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${target === 'selected'
                                                    ? 'border-green-500 bg-green-50 text-green-700'
                                                    : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                                                }`}
                                        >
                                            <FiUser className="w-4 h-4" />
                                            Select Users
                                        </button>
                                    </div>

                                    {/* User Search & Selection */}
                                    {target === 'selected' && (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="relative">
                                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search by name or email..."
                                                    value={userSearchTerm}
                                                    onChange={(e) => {
                                                        setUserSearchTerm(e.target.value);
                                                        setIsUserDropdownOpen(true);
                                                    }}
                                                    onFocus={() => setIsUserDropdownOpen(true)}
                                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all font-medium text-sm"
                                                />
                                                {userSearchTerm && (
                                                    <button
                                                        type="button"
                                                        onClick={() => { setUserSearchTerm(''); setIsUserDropdownOpen(false); }}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
                                                    >
                                                        <FiX className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Selected Users Tags */}
                                            {selectedUserIds.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedUserIds.map(id => {
                                                        const user = users.find((u: any) => u._id === id);
                                                        if (!user) return null;
                                                        return (
                                                            <div key={id} className="flex items-center gap-1 pl-3 pr-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                                                <span>{user.first_name} {user.last_name}</span>
                                                                <button
                                                                    onClick={() => toggleUserSelection(id)}
                                                                    className="p-0.5 hover:bg-green-200 rounded-full transition-colors"
                                                                >
                                                                    <FiX className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                    <button
                                                        onClick={() => setSelectedUserIds([])}
                                                        className="text-[10px] font-bold text-red-500 hover:text-red-600 underline decoration-red-200 underline-offset-2"
                                                    >
                                                        Clear All
                                                    </button>
                                                </div>
                                            )}

                                            {/* Dropdown */}
                                            {isUserDropdownOpen && (
                                                <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                                                    {filteredUsers.length > 0 ? (
                                                        filteredUsers.map((user: any) => {
                                                            const isSelected = selectedUserIds.includes(user._id);
                                                            return (
                                                                <button
                                                                    key={user._id}
                                                                    type="button"
                                                                    onClick={() => toggleUserSelection(user._id)}
                                                                    className={`w-full p-3 flex items-center gap-3 text-left transition-colors border-b border-slate-50 last:border-0 ${isSelected ? 'bg-green-50' : 'hover:bg-slate-50'
                                                                        }`}
                                                                >
                                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isSelected ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500'
                                                                        }`}>
                                                                        {isSelected ? <FiCheck className="w-4 h-4" /> : user.first_name.charAt(0)}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className={`text-sm font-bold ${isSelected ? 'text-green-900' : 'text-slate-900'}`}>
                                                                            {user.first_name} {user.last_name}
                                                                        </p>
                                                                        <p className="text-[10px] text-slate-500">{user.email}</p>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="p-4 text-center text-slate-500 text-xs font-medium">
                                                            No users found matching "{userSearchTerm}"
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {activeTab === 'notification' ? (
                                    <form onSubmit={handleSendNotification} className="p-8 space-y-8">
                                        {/* Notification Type Selection */}
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Select Notification Category</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {notificationTypes.map((t) => (
                                                    <button
                                                        key={t.id}
                                                        type="button"
                                                        onClick={() => handleTypeSelect(t.id)}
                                                        className={`relative flex items-center p-4 border-2 rounded-2xl transition-all duration-300 group ${type === t.id
                                                            ? 'border-green-500 bg-green-50/30'
                                                            : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-4 w-full">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${type === t.id ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-slate-100 text-slate-400'
                                                                }`}>
                                                                <t.icon className="w-5 h-5" />
                                                            </div>
                                                            <div className="text-left flex-1">
                                                                <p className="font-black text-slate-900 text-sm">{t.label}</p>
                                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{t.description}</p>
                                                            </div>
                                                            {type === t.id && (
                                                                <FiCheckCircle className="w-5 h-5 text-green-600 animate-in zoom-in duration-300" />
                                                            )}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Title Input */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Notification Title</label>
                                            <div className="relative">
                                                <FiType className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    placeholder="e.g., Weekend Special Discount!"
                                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none font-bold text-slate-700 transition-all"
                                                    maxLength={100}
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">
                                                    {title.length}/100
                                                </div>
                                            </div>
                                        </div>

                                        {/* Message Input */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Message Content</label>
                                            <div className="relative">
                                                <FiMessageSquare className="absolute left-4 top-4 text-slate-400" />
                                                <textarea
                                                    value={message}
                                                    onChange={(e) => setMessage(e.target.value)}
                                                    placeholder="Type your message here..."
                                                    rows={5}
                                                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none font-medium text-slate-700 transition-all resize-none"
                                                    maxLength={500}
                                                />
                                                <div className="absolute right-4 bottom-4 text-[10px] font-black text-slate-300 uppercase">
                                                    {message.length}/500
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Link Input */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Action Link (Optional)</label>
                                            <div className="relative">
                                                <FiLink className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="url"
                                                    value={actionLink}
                                                    onChange={(e) => setActionLink(e.target.value)}
                                                    placeholder="https://your-app.com/promo"
                                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none font-medium text-slate-700 transition-all"
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight ml-1">Users will be redirected here upon tapping the notification</p>
                                        </div>

                                        {/* Submit Button */}
                                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setTitle('');
                                                    setMessage('');
                                                    setActionLink('');
                                                    setType('system');
                                                }}
                                                className="w-full sm:w-auto px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all active:scale-95"
                                                disabled={isSubmitting}
                                            >
                                                Reset
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting || !title.trim() || !message.trim()}
                                                className="flex-1 flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-slate-200 active:scale-[0.98] disabled:opacity-50"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                        <span>Dispatching...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiSend className="w-4 h-4" />
                                                        <span>Send Broadcast</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <form onSubmit={handleSendEmail} className="p-8 space-y-8">
                                        {/* Email Subject */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Email Subject</label>
                                            <div className="relative">
                                                <FiType className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={emailSubject}
                                                    onChange={(e) => setEmailSubject(e.target.value)}
                                                    placeholder="Enter email subject line"
                                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none font-bold text-slate-700 transition-all"
                                                    maxLength={150}
                                                />
                                            </div>
                                        </div>

                                        {/* Email Content */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Email Content (HTML Supported)</label>
                                            <div className="relative">
                                                <FiLayout className="absolute left-4 top-4 text-slate-400" />
                                                <textarea
                                                    value={emailMessage}
                                                    onChange={(e) => setEmailMessage(e.target.value)}
                                                    placeholder="Type your email content here. HTML tags are allowed for styling..."
                                                    rows={12}
                                                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none font-mono text-xs transition-all resize-none leading-relaxed"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100 mt-2">
                                                <FiInfo className="w-4 h-4 text-blue-500 shrink-0" />
                                                <p className="text-[10px] text-blue-700 font-bold uppercase tracking-tight">Pro Tip: Use standard HTML tags like &lt;b&gt;, &lt;p&gt;, and &lt;a&gt; for formatting.</p>
                                            </div>
                                        </div>

                                        {/* Submit Button */}
                                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEmailSubject('');
                                                    setEmailMessage('');
                                                }}
                                                className="w-full sm:w-auto px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all active:scale-95"
                                                disabled={isEmailSubmitting}
                                            >
                                                Reset
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isEmailSubmitting || !emailSubject.trim() || !emailMessage.trim()}
                                                className="flex-1 flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-slate-200 active:scale-[0.98] disabled:opacity-50"
                                            >
                                                {isEmailSubmitting ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                        <span>Sending Emails...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiMail className="w-4 h-4" />
                                                        <span>Dispatch Email Broadcast</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* Sidebar: Info & Stats */}
                        <div className="lg:col-span-1 space-y-8">
                            {/* Target Audience Card */}
                            <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-green-500/20 transition-colors duration-700"></div>
                                <div className="relative z-10 space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/10 rounded-xl backdrop-blur-md flex items-center justify-center">
                                            <FiTarget className="w-5 h-5 text-green-400" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Target Audience</span>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-black tracking-tight">All Users</h3>
                                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                            Your message will be delivered to every active account registered on the platform.
                                        </p>
                                    </div>
                                    <div className="pt-4 border-t border-white/10 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                                <FiCheckCircle className="w-3.5 h-3.5 text-green-400" />
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Instant Delivery</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                                <FiCheckCircle className="w-3.5 h-3.5 text-green-400" />
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Cross-Platform Reach</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Guidelines Card */}
                            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                        <FiInfo className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Guidelines</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                                            {activeTab === 'notification'
                                                ? 'Notifications appear as push alerts on mobile and web browsers.'
                                                : 'Email broadcasts are sent directly to the user\'s registered inbox.'}
                                        </p>
                                    </div>
                                    <ul className="space-y-3">
                                        {[
                                            'Keep titles short and punchy',
                                            'Use a clear call to action',
                                            'Avoid excessive capitalization',
                                            'Test HTML links before sending'
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></div>
                                                <p className="text-xs text-slate-500 font-medium">{item}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
