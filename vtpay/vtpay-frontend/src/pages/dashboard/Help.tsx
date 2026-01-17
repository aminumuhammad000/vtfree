import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Send, MessageSquare, CheckCircle2, AlertCircle, History, Clock, CheckCircle } from 'lucide-react';

interface HelpMessage {
    _id: string;
    subject: string;
    message: string;
    status: 'pending' | 'in_progress' | 'resolved';
    createdAt: string;
}

export const Help: React.FC = () => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [messages, setMessages] = useState<HelpMessage[]>([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(true);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const response = await api.get('/help/my-messages');
            if (response.data.success) {
                setMessages(response.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            await api.post('/help', {
                subject,
                message,
            });
            setSuccess('Your message has been sent successfully. We will get back to you shortly.');
            setSubject('');
            setMessage('');
            fetchMessages();
        } catch (err: any) {
            console.error('Failed to send help message:', err);
            setError(err.response?.data?.message || 'Failed to send message. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'resolved':
                return <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700"><CheckCircle size={12} /> Resolved</span>;
            case 'in_progress':
                return <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700"><Clock size={12} /> In Progress</span>;
            default:
                return <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700"><Clock size={12} /> Pending</span>;
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900">Need Help?</h1>
                <p className="text-sm text-gray-500 mt-1">Have a question or run into an issue? Send us a message and we'll help you out.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Form Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">Send a Message</h3>
                            <p className="text-xs text-gray-500 mt-0.5">We typically respond within 24 hours</p>
                        </div>
                        <div className="p-6">
                            {success && (
                                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                                    <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-green-800 font-medium">{success}</p>
                                </div>
                            )}

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                                    <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-800 font-medium">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-2">Subject</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"
                                        placeholder="What is this about?"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-2">Message</label>
                                    <textarea
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all resize-none"
                                        placeholder="Describe your issue or question in detail..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        required
                                        rows={6}
                                    ></textarea>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <Send size={18} />
                                                Send Message
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Message History */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Message History</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Track your support requests</p>
                            </div>
                            <button onClick={fetchMessages} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
                                <History size={18} />
                            </button>
                        </div>
                        <div className="p-6">
                            {isLoadingMessages ? (
                                <div className="flex justify-center py-12">
                                    <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                                </div>
                            ) : messages.length > 0 ? (
                                <div className="space-y-4">
                                    {messages.map((msg) => (
                                        <div key={msg._id} className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
                                            <div className="flex items-start justify-between mb-2">
                                                <span className="font-bold text-gray-900 text-sm">{msg.subject}</span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(msg.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 mb-3 line-clamp-2">{msg.message}</p>
                                            {getStatusBadge(msg.status)}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <MessageSquare size={48} className="mx-auto mb-3 text-gray-300" />
                                    <p className="text-gray-500">No messages yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Contact Info */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-2xl shadow-lg text-white">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
                            <MessageSquare size={24} />
                        </div>
                        <h3 className="text-lg font-bold mb-2">Live Chat</h3>
                        <p className="text-blue-100 text-sm mb-4">Chat with our support team in real-time.</p>
                        <button className="w-full py-2.5 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors">
                            Start Chat
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-2xl shadow-lg text-white">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
                            <Send size={24} />
                        </div>
                        <h3 className="text-lg font-bold mb-2">Email Support</h3>
                        <p className="text-green-100 text-sm mb-2">support@vtpay.com</p>
                        <a href="mailto:support@vtpay.com" className="text-sm font-bold hover:underline">
                            Send Email →
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
