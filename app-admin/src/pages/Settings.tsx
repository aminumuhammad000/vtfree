import React, { useEffect, useState } from 'react';
import {
    FiSettings,
    FiMail,
    FiCreditCard,
    FiCpu,
    FiGlobe,
    FiPhone,
    FiMessageCircle,
    FiFacebook,
    FiTwitter,
    FiInstagram,
    FiSave,
    FiInfo,
    FiGift
} from 'react-icons/fi';
import { getSupportContent, updateSupportContent } from '../api/adminApi';
import Layout from '../components/Layout';
import SystemConfig from '../components/SystemConfig';
import EmailSettings from '../components/EmailSettings';
import PaymentSettings from '../components/PaymentSettings';
import ReferralSettings from '../components/ReferralSettings';
import { useToast } from '../hooks/ToastContext';

interface SupportContent {
    email: string;
    phoneNumber: string;
    whatsappNumber: string;
    facebookUrl?: string;
    twitterUrl?: string;
    instagramUrl?: string;
    websiteUrl?: string;
}

const Settings = () => {
    const { showSuccess, showError } = useToast();
    const [activeTab, setActiveTab] = useState<'general' | 'system' | 'email' | 'payment' | 'referral'>('general');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<SupportContent>({
        email: '',
        phoneNumber: '',
        whatsappNumber: '',
        facebookUrl: '',
        twitterUrl: '',
        instagramUrl: '',
        websiteUrl: ''
    });

    useEffect(() => {
        if (activeTab === 'general') {
            fetchContent();
        }
    }, [activeTab]);

    const fetchContent = async () => {
        try {
            setLoading(true);
            const response = await getSupportContent();
            if (response.data.success) {
                setFormData(response.data.data);
            }
        } catch (error) {
            showError('Failed to fetch settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const response = await updateSupportContent(formData);
            if (response.data.success) {
                showSuccess('Settings updated successfully');
            }
        } catch (error) {
            showError('Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'general', label: 'General', icon: FiSettings },
        { id: 'email', label: 'Email', icon: FiMail },
        { id: 'payment', label: 'Payment', icon: FiCreditCard },
        { id: 'referral', label: 'Referral', icon: FiGift },
        { id: 'system', label: 'System', icon: FiCpu },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <FiInfo className="text-green-600" />
                                    Support Contact Information
                                </h2>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Email Address</label>
                                        <div className="relative">
                                            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none font-medium text-slate-700 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Phone Number</label>
                                        <div className="relative">
                                            <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                name="phoneNumber"
                                                value={formData.phoneNumber}
                                                onChange={handleChange}
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none font-medium text-slate-700 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">WhatsApp Number</label>
                                        <div className="relative">
                                            <FiMessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                name="whatsappNumber"
                                                value={formData.whatsappNumber}
                                                onChange={handleChange}
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none font-medium text-slate-700 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Website URL</label>
                                        <div className="relative">
                                            <FiGlobe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="url"
                                                name="websiteUrl"
                                                value={formData.websiteUrl || ''}
                                                onChange={handleChange}
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none font-medium text-slate-700 transition-all"
                                                placeholder="https://example.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100">
                                    <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-widest flex items-center gap-2">
                                        <FiGlobe className="text-blue-500" />
                                        Social Media Presence
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Facebook URL</label>
                                            <div className="relative">
                                                <FiFacebook className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="url"
                                                    name="facebookUrl"
                                                    value={formData.facebookUrl || ''}
                                                    onChange={handleChange}
                                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none font-medium text-slate-700 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Twitter URL</label>
                                            <div className="relative">
                                                <FiTwitter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="url"
                                                    name="twitterUrl"
                                                    value={formData.twitterUrl || ''}
                                                    onChange={handleChange}
                                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none font-medium text-slate-700 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Instagram URL</label>
                                            <div className="relative">
                                                <FiInstagram className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="url"
                                                    name="instagramUrl"
                                                    value={formData.instagramUrl || ''}
                                                    onChange={handleChange}
                                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none font-medium text-slate-700 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-lg shadow-green-100 disabled:opacity-50 active:scale-95"
                                    >
                                        <FiSave className="w-5 h-5" />
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                );
            case 'system':
                return <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><SystemConfig /></div>;
            case 'email':
                return <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><EmailSettings /></div>;
            case 'payment':
                return <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><PaymentSettings /></div>;
            case 'referral':
                return <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><ReferralSettings /></div>;
            default:
                return null;
        }
    };

    return (
        <Layout>
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-2 tracking-tight">Settings</h1>
                            <p className="text-sm sm:text-lg text-slate-600 font-medium">Configure your platform's core parameters and integrations</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-3xl w-fit">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id
                                    ? 'bg-white text-green-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                    }`}
                            >
                                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-green-600' : 'text-slate-400'}`} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="min-h-[400px]">
                        {renderTabContent()}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Settings;
