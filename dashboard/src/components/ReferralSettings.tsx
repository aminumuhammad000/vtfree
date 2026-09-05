import React, { useEffect, useState } from 'react';
import {
    FiGift,
    FiSave,
    FiToggleLeft,
    FiToggleRight,
    FiDollarSign
} from 'react-icons/fi';
import { getAllConfigs, updateConfig } from '../api/adminApi';
import { useToast } from '../hooks/ToastContext';

const ReferralSettings = () => {
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        REFERRAL_ENABLED: 'false',
        REFERRAL_AMOUNT: '0'
    });

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            setLoading(true);
            const response = await getAllConfigs();
            if (response.data.success) {
                const configs = response.data.data.filter((c: any) => c.group === 'REFERRAL');
                const newFormData = { ...formData };
                configs.forEach((c: any) => {
                    if (c.key in newFormData) {
                        (newFormData as any)[c.key] = c.value;
                    }
                });
                setFormData(newFormData);
            }
        } catch (error) {
            showError('Failed to fetch referral settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleEnabled = () => {
        setFormData(prev => ({
            ...prev,
            REFERRAL_ENABLED: prev.REFERRAL_ENABLED === 'true' ? 'false' : 'true'
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const promises = Object.entries(formData).map(([key, value]) =>
                updateConfig(key, { value })
            );
            await Promise.all(promises);
            showSuccess('Referral settings updated successfully');
        } catch (error) {
            showError('Failed to update referral settings');
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
                            <FiGift />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Referral Program</h2>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Manage signup bonuses and rewards</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-10">
                    <div className="grid grid-cols-1 gap-8">
                        {/* Status Toggle */}
                        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">Program Status</h3>
                                <p className="text-xs text-slate-500 mt-1">Enable or disable the referral system</p>
                            </div>
                            <button
                                type="button"
                                onClick={toggleEnabled}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${formData.REFERRAL_ENABLED === 'true'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-slate-200 text-slate-500'
                                    }`}
                            >
                                {formData.REFERRAL_ENABLED === 'true' ? (
                                    <>Active <FiToggleRight className="w-5 h-5" /></>
                                ) : (
                                    <>Disabled <FiToggleLeft className="w-5 h-5" /></>
                                )}
                            </button>
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Referral Reward Amount (NGN)</label>
                            <div className="relative group">
                                <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                                <input
                                    type="number"
                                    name="REFERRAL_AMOUNT"
                                    value={formData.REFERRAL_AMOUNT}
                                    onChange={handleChange}
                                    placeholder="e.g. 500"
                                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white outline-none font-bold text-slate-700 transition-all font-mono"
                                    required
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 ml-1">Amount to be credited to the referrer's wallet.</p>
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
                                    <span className="uppercase tracking-widest text-[10px]">Saving...</span>
                                </>
                            ) : (
                                <>
                                    <FiSave className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    <span className="uppercase tracking-widest text-[10px]">Save Settings</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReferralSettings;
