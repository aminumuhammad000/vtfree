import React, { useState } from 'react';
import * as adminApi from '../api/adminApi';
import Layout from '../components/Layout';
import { useToast } from '../hooks/ToastContext';

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

export default function Notifications() {
    const { showToast } = useToast();
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

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!emailSubject.trim() || !emailMessage.trim()) {
            showToast('Please fill in subject and message', 'error');
            return;
        }

        setIsEmailSubmitting(true);
        try {
            const response = await adminApi.sendBroadcastEmail({
                subject: emailSubject.trim(),
                message: emailMessage.trim(),
            });

            if (response.data?.success) {
                showToast(response.data.message || 'Email broadcast sent successfully', 'success');
                setEmailSubject('');
                setEmailMessage('');
            } else {
                showToast(response.data?.message || 'Failed to send email broadcast', 'error');
            }
        } catch (error: any) {
            showToast(error?.response?.data?.message || 'Failed to send email broadcast', 'error');
        } finally {
            setIsEmailSubmitting(false);
        }
    };

    return (
        <Layout>
            <div className="p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-6 lg:mb-8">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">Broadcast Communications</h1>
                        <p className="text-sm sm:text-base text-slate-600">Send notifications or emails to all active users</p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex p-1 bg-slate-100 rounded-xl mb-8 max-w-md">
                        <button
                            onClick={() => setActiveTab('notification')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'notification' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            App Notification
                        </button>
                        <button
                            onClick={() => setActiveTab('email')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'email' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Send Email
                        </button>
                    </div>

                    {/* Main Form Card */}
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-600 to-indigo-600 px-6 py-4">
                            <h2 className="text-xl font-semibold text-white">
                                {activeTab === 'notification' ? 'Create App Notification' : 'Create Email Broadcast'}
                            </h2>
                        </div>

                        {activeTab === 'notification' ? (
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
                                        {isSubmitting ? 'Sending...' : 'Send Broadcast Notification'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleSendEmail} className="p-6 space-y-6">
                                {/* Email Subject */}
                                <div>
                                    <label htmlFor="emailSubject" className="block text-sm font-semibold text-slate-700 mb-2">
                                        Email Subject <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="emailSubject"
                                        type="text"
                                        value={emailSubject}
                                        onChange={(e) => setEmailSubject(e.target.value)}
                                        placeholder="Enter email subject"
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                                        maxLength={150}
                                    />
                                </div>

                                {/* Email Message */}
                                <div>
                                    <label htmlFor="emailMessage" className="block text-sm font-semibold text-slate-700 mb-2">
                                        Email Content (HTML supported) <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        id="emailMessage"
                                        value={emailMessage}
                                        onChange={(e) => setEmailMessage(e.target.value)}
                                        placeholder="Enter email content..."
                                        rows={10}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none resize-none font-mono text-sm"
                                    />
                                    <p className="text-xs text-slate-500 mt-2">
                                        You can use HTML tags for formatting.
                                    </p>
                                </div>

                                {/* Submit Button */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEmailSubject('');
                                            setEmailMessage('');
                                        }}
                                        className="px-6 py-3 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-all"
                                        disabled={isEmailSubmitting}
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isEmailSubmitting || !emailSubject.trim() || !emailMessage.trim()}
                                        className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-green-600 to-indigo-600 text-white font-semibold hover:from-green-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                                    >
                                        {isEmailSubmitting ? 'Sending Emails...' : 'Send Email Broadcast'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Info Card */}
                    <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex gap-3">
                            <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div className="text-sm text-green-800">
                                <p className="font-semibold mb-1">Important Information</p>
                                <ul className="list-disc list-inside space-y-1 text-green-700">
                                    <li>{activeTab === 'notification' ? 'Notifications will be sent to all active users' : 'Emails will be sent to all registered users with valid emails'}</li>
                                    <li>{activeTab === 'notification' ? 'Users will see the notification as a popup when they open the app' : 'Ensure your email content is professional and complies with anti-spam laws'}</li>
                                    <li>Make sure your message is clear and concise</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
