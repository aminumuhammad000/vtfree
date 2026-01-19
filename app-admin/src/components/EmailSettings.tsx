import React, { useEffect, useState } from 'react';
import {
    FiMail,
    FiShield,
    FiServer,
    FiUser,
    FiKey,
    FiSend,
    FiCheck,
    FiInfo,
    FiLock,
    FiSave
} from 'react-icons/fi';
import { getAllConfigs, updateConfig } from '../api/adminApi';
import { useToast } from '../hooks/ToastContext';

const EmailSettings = () => {
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
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
                const newFormData = { ...formData };
                emailConfigs.forEach((c: any) => {
                    if (c.key in newFormData) {
                        (newFormData as any)[c.key] = c.value;
                    }
                });
                setFormData(newFormData);
            }
        } catch (error) {
            showError('Failed to fetch email settings');
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
            showSuccess('Email settings updated successfully');
        } catch (error) {
            showError('Failed to update email settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-96 space-y-6">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-green-600 rounded-full animate-spin"></div>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Configuration...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-green-600 text-xl">
                            <FiMail />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Email Gateway</h2>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">SMTP & Notification Delivery Engine</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-10">
                    {/* Provider Selection */}
                    <div className="space-y-6">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Delivery Provider</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { id: 'gmail', label: 'Gmail / Workspace', desc: 'Secure App Password Required', icon: 'https://www.google.com/favicon.ico' },
                                { id: 'other', label: 'Custom SMTP', desc: 'Enterprise SMTP Relay', icon: null }
                            ].map((provider) => (
                                <label
                                    key={provider.id}
                                    className={`relative flex items-center p-6 border-2 rounded-[2rem] cursor-pointer transition-all duration-300 group ${formData.MAIL_PROVIDER === provider.id
                                        ? 'border-green-500 bg-green-50/30 shadow-lg shadow-green-100/50'
                                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="MAIL_PROVIDER"
                                        value={provider.id}
                                        checked={formData.MAIL_PROVIDER === provider.id}
                                        onChange={handleChange}
                                        className="hidden"
                                    />
                                    <div className="flex items-center gap-5 w-full">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${formData.MAIL_PROVIDER === provider.id ? 'bg-white shadow-md scale-110' : 'bg-slate-100'
                                            }`}>
                                            {provider.icon ? (
                                                <img src={provider.icon} alt="" className="w-6 h-6" />
                                            ) : (
                                                <FiServer className={`w-6 h-6 ${formData.MAIL_PROVIDER === provider.id ? 'text-green-600' : 'text-slate-400'}`} />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-slate-900 text-sm tracking-tight">{provider.label}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{provider.desc}</p>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${formData.MAIL_PROVIDER === provider.id ? 'border-green-500 bg-green-500 scale-110' : 'border-slate-200'
                                            }`}>
                                            {formData.MAIL_PROVIDER === provider.id && <FiCheck className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Conditional Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {formData.MAIL_PROVIDER === 'gmail' ? (
                            <>
                                <div className="col-span-full p-6 bg-blue-50/50 border border-blue-100 rounded-[2rem] flex gap-4 animate-in zoom-in-95 duration-500">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 shrink-0">
                                        <FiInfo className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs text-blue-700 font-medium leading-relaxed">
                                            Gmail requires an <strong>App Password</strong> for secure delivery. This is a 16-digit passcode that gives the app permission to access your Google Account. Standard account passwords will not work.
                                        </p>
                                        <a
                                            href="https://myaccount.google.com/apppasswords"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 hover:underline transition-all"
                                        >
                                            Generate App Password
                                            <FiSend className="w-3 h-3 -rotate-45" />
                                        </a>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gmail Address</label>
                                    <div className="relative group">
                                        <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                                        <input
                                            type="email"
                                            name="MAIL_USER"
                                            value={formData.MAIL_USER}
                                            onChange={handleChange}
                                            placeholder="admin@gmail.com"
                                            className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white outline-none font-bold text-slate-700 transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">App Password</label>
                                    <div className="relative group">
                                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                                        <input
                                            type="password"
                                            name="MAIL_PASSWORD"
                                            value={formData.MAIL_PASSWORD}
                                            onChange={handleChange}
                                            placeholder="•••• •••• •••• ••••"
                                            className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white outline-none font-mono text-sm tracking-widest transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-top-4 duration-500">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SMTP Host</label>
                                        <div className="relative group">
                                            <FiServer className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                                            <input
                                                type="text"
                                                name="MAIL_HOST"
                                                value={formData.MAIL_HOST}
                                                onChange={handleChange}
                                                placeholder="smtp.provider.com"
                                                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white outline-none font-bold text-slate-700 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Port</label>
                                        <input
                                            type="text"
                                            name="MAIL_PORT"
                                            value={formData.MAIL_PORT}
                                            onChange={handleChange}
                                            placeholder="587"
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white outline-none font-black text-slate-700 transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SMTP Username</label>
                                    <div className="relative group">
                                        <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                                        <input
                                            type="text"
                                            name="MAIL_USER"
                                            value={formData.MAIL_USER}
                                            onChange={handleChange}
                                            className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white outline-none font-bold text-slate-700 transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SMTP Password</label>
                                    <div className="relative group">
                                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                                        <input
                                            type="password"
                                            name="MAIL_PASSWORD"
                                            value={formData.MAIL_PASSWORD}
                                            onChange={handleChange}
                                            className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white outline-none font-mono text-sm tracking-widest transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Common Fields */}
                        <div className="col-span-full pt-10 border-t border-slate-100">
                            <h3 className="text-xs font-black text-slate-900 mb-8 uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                Sender Identity Configuration
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Name</label>
                                    <input
                                        type="text"
                                        name="MAIL_FROM_NAME"
                                        value={formData.MAIL_FROM_NAME}
                                        onChange={handleChange}
                                        placeholder="Platform Notifications"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white outline-none font-black text-slate-700 transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reply-To Address</label>
                                    <div className="relative group">
                                        <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                                        <input
                                            type="email"
                                            name="MAIL_FROM_ADDRESS"
                                            value={formData.MAIL_FROM_ADDRESS}
                                            onChange={handleChange}
                                            placeholder="noreply@platform.com"
                                            className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white outline-none font-bold text-slate-700 transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-black py-5 px-12 rounded-[2rem] transition-all shadow-2xl shadow-slate-200 disabled:opacity-50 active:scale-95 group"
                        >
                            {saving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span className="uppercase tracking-widest text-[10px]">Syncing...</span>
                                </>
                            ) : (
                                <>
                                    <FiSave className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    <span className="uppercase tracking-widest text-[10px]">Save Configuration</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmailSettings;
