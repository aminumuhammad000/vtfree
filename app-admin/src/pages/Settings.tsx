
import React, { useEffect, useState } from 'react';
import { getSupportContent, updateSupportContent } from '../api/adminApi';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
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
    const { showToast } = useToast();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
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
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            setLoading(true);
            const response = await getSupportContent();
            if (response.data.success) {
                setFormData(response.data.data);
            }
        } catch (error) {
            showToast('Failed to fetch settings', 'error');
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
                showToast('Settings updated successfully', 'success');
            }
        } catch (error) {
            showToast('Failed to update settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar onMenuClick={() => setIsMobileOpen(true)} />
                <main className="flex-1 overflow-auto p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-4xl font-bold text-slate-900 mb-2">Settings</h1>
                            <p className="text-slate-600">Manage application settings and support information</p>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Support Contact Information</h2>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                                        <input
                                            type="text"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">WhatsApp Number</label>
                                        <input
                                            type="text"
                                            name="whatsappNumber"
                                            value={formData.whatsappNumber}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Website URL</label>
                                        <input
                                            type="url"
                                            name="websiteUrl"
                                            value={formData.websiteUrl || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 pt-6">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4">Social Media Links</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Facebook URL</label>
                                            <input
                                                type="url"
                                                name="facebookUrl"
                                                value={formData.facebookUrl || ''}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Twitter URL</label>
                                            <input
                                                type="url"
                                                name="twitterUrl"
                                                value={formData.twitterUrl || ''}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Instagram URL</label>
                                            <input
                                                type="url"
                                                name="instagramUrl"
                                                value={formData.instagramUrl || ''}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Settings;

