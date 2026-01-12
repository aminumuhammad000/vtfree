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
            fetchMessages(); // Refresh list
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
                return <span className="message-status resolved"><CheckCircle size={12} className="mr-1" /> Resolved</span>;
            case 'in_progress':
                return <span className="message-status in_progress"><Clock size={12} className="mr-1" /> In Progress</span>;
            default:
                return <span className="message-status pending"><Clock size={12} className="mr-1" /> Pending</span>;
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="help-header">
                <h1 className="text-heading">Need Help?</h1>
                <p className="text-body">
                    Have a question or run into an issue? Send us a message and we'll help you out.
                </p>
            </div>

            <div className="help-grid">
                <div className="help-main-col">
                    {/* Form Card */}
                    <div className="help-card">
                        <div className="help-card-header">
                            <h3 className="text-subheading">Send a Message</h3>
                        </div>
                        <div className="help-card-body">
                            {success && (
                                <div className="alert alert-success mb-6">
                                    <div className="alert-icon">
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <div className="alert-content">
                                        <p className="font-medium">{success}</p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="alert alert-error mb-6">
                                    <div className="alert-icon">
                                        <AlertCircle size={20} />
                                    </div>
                                    <div className="alert-content">
                                        <p className="font-medium">{error}</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="form-group">
                                    <label className="form-label">Subject</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="What is this about?"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Message</label>
                                    <textarea
                                        className="form-input help-form-textarea"
                                        placeholder="Describe your issue or question in detail..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        required
                                    ></textarea>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <div className="spinner w-5 h-5 border-white border-t-transparent"></div>
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
                    <div className="help-card">
                        <div className="help-card-header flex items-center justify-between">
                            <h3 className="text-subheading">Message History</h3>
                            <button onClick={fetchMessages} className="text-muted hover:text-primary transition-colors">
                                <History size={18} />
                            </button>
                        </div>
                        <div className="help-card-body">
                            {isLoadingMessages ? (
                                <div className="flex justify-center py-8">
                                    <div className="spinner w-8 h-8 border-primary border-t-transparent"></div>
                                </div>
                            ) : messages.length > 0 ? (
                                <div className="message-list">
                                    {messages.map((msg) => (
                                        <div key={msg._id} className="message-item">
                                            <div className="message-header">
                                                <span className="message-subject">{msg.subject}</span>
                                                <span className="message-date">
                                                    {new Date(msg.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="message-preview">{msg.message}</p>
                                            {getStatusBadge(msg.status)}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted">
                                    <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>No messages yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Contact Info */}
                <div className="help-sidebar">
                    <div className="help-contact-card">
                        <div className="help-contact-icon chat">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h3 className="text-subheading text-base">Live Chat</h3>
                            <p className="text-body text-sm mt-1 mb-3">
                                Chat with our support team in real-time.
                            </p>
                            <button className="btn btn-outline btn-sm w-full">
                                Start Chat
                            </button>
                        </div>
                    </div>

                    <div className="help-contact-card">
                        <div className="help-contact-icon email">
                            <Send size={20} />
                        </div>
                        <div>
                            <h3 className="text-subheading text-base">Email Support</h3>
                            <p className="text-body text-sm mt-1 mb-3">
                                support@vtpay.com
                            </p>
                            <a href="mailto:support@vtpay.com" className="text-sm font-bold text-success hover:underline">
                                Send Email
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
