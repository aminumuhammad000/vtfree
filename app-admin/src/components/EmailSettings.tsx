import React, { useEffect, useState } from 'react';
import { getAllConfigs, updateConfig } from '../api/adminApi';
import { useToast } from '../hooks/ToastContext';
import { Mail, Shield, Server, User, Key, Send } from 'lucide-react';

const EmailSettings = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [configs, setConfigs] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        MAIL_PROVIDER: 'other',
        MAIL_HOST: '',
        MAIL_PORT: '587',
        MAIL_USER: '',
        MAIL_PASSWORD: '',
        MAIL_FROM_NAME: '',
        MAIL_FROM_ADDRESS: ''
    });

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            setLoading(true);
            const response = await getAllConfigs();
            if (response.data.success) {
                const emailConfigs = response.data.data.filter((c: any) => c.group === 'EMAIL');
                setConfigs(emailConfigs);

                const newFormData = { ...formData };
                emailConfigs.forEach((c: any) => {
                    if (c.key in newFormData) {
                        (newFormData as any)[c.key] = c.value;
                    }
                });
                setFormData(newFormData);
            }
        } catch (error) {
            showToast('Failed to fetch email settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const promises = Object.entries(formData).map(([key, value]) =>
                updateConfig(key, { value })
            );
            await Promise.all(promises);
            showToast('Email settings updated successfully', 'success');
        } catch (error) {
            showToast('Failed to update email settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                        <Mail className="w-6 h-6 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Email Configuration</h2>
                </div>
                <p className="text-slate-600">Configure how the system sends emails to users</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Provider Selection */}
                    <div className="col-span-full">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email Provider</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.MAIL_PROVIDER === 'gmail' ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                <input
                                    type="radio"
                                    name="MAIL_PROVIDER"
                                    value="gmail"
                                    checked={formData.MAIL_PROVIDER === 'gmail'}
                                    onChange={handleChange}
                                    className="hidden"
                                />
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.MAIL_PROVIDER === 'gmail' ? 'border-green-500' : 'border-slate-300'}`}>
                                        {formData.MAIL_PROVIDER === 'gmail' && <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">Gmail</p>
                                        <p className="text-xs text-slate-500">Use Gmail with App Password</p>
                                    </div>
                                </div>
                            </label>
                            <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.MAIL_PROVIDER === 'other' ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                <input
                                    type="radio"
                                    name="MAIL_PROVIDER"
                                    value="other"
                                    checked={formData.MAIL_PROVIDER === 'other'}
                                    onChange={handleChange}
                                    className="hidden"
                                />
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.MAIL_PROVIDER === 'other' ? 'border-green-500' : 'border-slate-300'}`}>
                                        {formData.MAIL_PROVIDER === 'other' && <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">Other SMTP</p>
                                        <p className="text-xs text-slate-500">Custom SMTP server settings</p>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Conditional Fields */}
                    {formData.MAIL_PROVIDER === 'gmail' ? (
                        <>
                            <div className="col-span-full bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3">
                                <Shield className="w-5 h-5 text-blue-600 shrink-0" />
                                <p className="text-sm text-blue-700">
                                    For Gmail, please use an <strong>App Password</strong>. Host and Port will be configured automatically.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                    <User className="w-4 h-4" /> Gmail Address
                                </label>
                                <input
                                    type="email"
                                    name="MAIL_USER"
                                    value={formData.MAIL_USER}
                                    onChange={handleChange}
                                    placeholder="your-email@gmail.com"
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                    <Key className="w-4 h-4" /> App Password
                                </label>
                                <input
                                    type="password"
                                    name="MAIL_PASSWORD"
                                    value={formData.MAIL_PASSWORD}
                                    onChange={handleChange}
                                    placeholder="xxxx xxxx xxxx xxxx"
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                        <Server className="w-4 h-4" /> SMTP Host
                                    </label>
                                    <input
                                        type="text"
                                        name="MAIL_HOST"
                                        value={formData.MAIL_HOST}
                                        onChange={handleChange}
                                        placeholder="smtp.example.com"
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">SMTP Port</label>
                                    <input
                                        type="text"
                                        name="MAIL_PORT"
                                        value={formData.MAIL_PORT}
                                        onChange={handleChange}
                                        placeholder="587"
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                    <User className="w-4 h-4" /> SMTP User
                                </label>
                                <input
                                    type="text"
                                    name="MAIL_USER"
                                    value={formData.MAIL_USER}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                    <Key className="w-4 h-4" /> SMTP Password
                                </label>
                                <input
                                    type="password"
                                    name="MAIL_PASSWORD"
                                    value={formData.MAIL_PASSWORD}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                />
                            </div>
                        </>
                    )}

                    {/* Common Fields */}
                    <div className="col-span-full border-t border-slate-100 pt-8">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Sender Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Sender Name</label>
                                <input
                                    type="text"
                                    name="MAIL_FROM_NAME"
                                    value={formData.MAIL_FROM_NAME}
                                    onChange={handleChange}
                                    placeholder="My VTU App"
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                    <Send className="w-4 h-4" /> Sender Email Address
                                </label>
                                <input
                                    type="email"
                                    name="MAIL_FROM_ADDRESS"
                                    value={formData.MAIL_FROM_ADDRESS}
                                    onChange={handleChange}
                                    placeholder="noreply@example.com"
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Saving...
                            </>
                        ) : (
                            'Save Email Settings'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EmailSettings;
