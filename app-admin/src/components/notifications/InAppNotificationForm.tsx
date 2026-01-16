import React, { useState } from 'react';
import * as adminApi from '../../api/adminApi';
import { useToast } from '../../hooks/ToastContext';

interface NotificationType {
    id: string;
    label: string;
    icon: React.ReactNode;
    description: string;
}

const notificationTypes: NotificationType[] = [
    {
        id: 'system',
        label: 'System Info',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        description: 'General system notifications'
    },
    {
        id: 'promotion',
        label: 'Promotion',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
        ),
        description: 'Promotional offers and deals'
    },
    {
        id: 'alert',
        label: 'Alert',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
        description: 'Important alerts and warnings'
    },
    {
        id: 'app_update',
        label: 'App Update',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        ),
        description: 'New app version available'
    },
];

export default function InAppNotificationForm() {
    const { showToast } = useToast();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('system');
    const [actionLink, setActionLink] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            showToast('Please fill in title and message', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await adminApi.sendBroadcastNotification({
                title: title.trim(),
                message: message.trim(),
                type,
                action_link: actionLink.trim() || undefined,
            });

            if (response.data?.success) {
                showToast(response.data.message || 'Notification sent successfully', 'success');
                // Reset form
                setTitle('');
                setMessage('');
                setActionLink('');
                setType('system');
            } else {
                showToast(response.data?.message || 'Failed to send notification', 'error');
            }
        } catch (error: any) {
            showToast(error?.response?.data?.message || 'Failed to send notification', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSendNotification} className="p-6 space-y-6">
            {/* Notification Type */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Notification Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {notificationTypes.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => handleTypeSelect(t.id)}
                            className={`
                          p-4 rounded-xl border-2 transition-all duration-200 text-left
                          ${type === t.id
                                    ? 'border-green-500 bg-green-50 shadow-md'
                                    : 'border-slate-200 bg-white hover:border-green-300 hover:bg-slate-50'
                                }
                        `}
                        >
                            <div className="flex items-start gap-3">
                                <div className={type === t.id ? 'text-green-600' : 'text-slate-600'}>
                                    {t.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-slate-800">{t.label}</div>
                                    <div className="text-xs text-slate-500 mt-1">{t.description}</div>
                                </div>
                                {type === t.id && (
                                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Title */}
            <div>
                <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-2">
                    Title <span className="text-red-500">*</span>
                </label>
                <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter notification title"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                    maxLength={100}
                />
                <div className="text-xs text-slate-500 mt-1 text-right">
                    {title.length}/100 characters
                </div>
            </div>

            {/* Message */}
            <div>
                <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-2">
                    Message <span className="text-red-500">*</span>
                </label>
                <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter notification message"
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none resize-none"
                    maxLength={500}
                />
                <div className="text-xs text-slate-500 mt-1 text-right">
                    {message.length}/500 characters
                </div>
            </div>

            {/* Action Link */}
            <div>
                <label htmlFor="actionLink" className="block text-sm font-semibold text-slate-700 mb-2">
                    Action URL (Optional)
                </label>
                <input
                    id="actionLink"
                    type="url"
                    value={actionLink}
                    onChange={(e) => setActionLink(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                    Link to open when user taps the notification
                </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
                <button
                    type="button"
                    onClick={() => {
                        setTitle('');
                        setMessage('');
                        setActionLink('');
                        setType('system');
                    }}
                    className="px-6 py-3 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-all"
                    disabled={isSubmitting}
                >
                    Clear
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || !title.trim() || !message.trim()}
                    className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-green-600 to-indigo-600 text-white font-semibold hover:from-green-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                    {isSubmitting ? 'Sending...' : 'Send In-app Notification'}
                </button>
            </div>
        </form>
    );
}
