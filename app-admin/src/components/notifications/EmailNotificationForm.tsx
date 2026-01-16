import React, { useState } from 'react';
import * as adminApi from '../../api/adminApi';
import { useToast } from '../../hooks/ToastContext';

export default function EmailNotificationForm() {
    const { showToast } = useToast();
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);

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
                    {isEmailSubmitting ? 'Sending Emails...' : 'Send Email Notification'}
                </button>
            </div>
        </form>
    );
}
