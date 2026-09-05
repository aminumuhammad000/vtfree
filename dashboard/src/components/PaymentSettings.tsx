import React, { useEffect, useState } from 'react';
import {
    FiCreditCard,
    FiShield,
    FiLock,
    FiZap,
    FiInfo,
    FiSave,
    FiEye,
    FiEyeOff,
    FiCheckCircle,
} from 'react-icons/fi';
import { getAllConfigs, updateConfig } from '../api/adminApi';
import { useToast } from '../hooks/ToastContext';

const PaymentSettings = () => {
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
    const [formData, setFormData] = useState({
        DEFAULT_PAYMENT_GATEWAY: 'vtstack',
        VTSTACK_SECRET_KEY: '',
    });

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            setLoading(true);
            const response = await getAllConfigs();
            if (response.data.success) {
                const paymentConfigs = response.data.data.filter((c: any) => c.group === 'PAYMENT');
                const newFormData = { ...formData };
                paymentConfigs.forEach((c: any) => {
                    if (c.key in newFormData) {
                        (newFormData as any)[c.key] = c.value;
                    }
                });
                setFormData(newFormData);
            }
        } catch {
            showError('Failed to fetch payment settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleSecret = (key: string) => {
        setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            await Promise.all(
                Object.entries(formData).map(([key, value]) => updateConfig(key, { value }))
            );
            showSuccess('Payment settings updated successfully');
            fetchConfigs();
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to update payment settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-48 gap-3">
                <div className="w-8 h-8 border-[3px] border-slate-100 border-t-green-600 rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading...</p>
            </div>
        );
    }

    const secretFields = [
        { key: 'VTSTACK_SECRET_KEY', label: 'VTStack Secret Key', placeholder: 'sk_live_...' },
    ];

    return (
        <div className="space-y-5">
            {/* Active Gateway Banner */}
            <div className="bg-slate-900 rounded-2xl p-5 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
                <div className="relative flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <FiShield className="w-4 h-4 text-green-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Gateway</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black tracking-tight uppercase text-white">
                                VTStack
                            </h2>
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full border border-green-500/30 text-[10px] font-black uppercase">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                Live
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5">All payment processing routes through VTStack</p>
                    </div>
                    <FiZap className="w-14 h-14 text-white/5 hidden sm:block" />
                </div>
            </div>

            {/* VTStack Config Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                        <FiCreditCard className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-900">VTStack Credentials</h2>
                        <p className="text-[10px] text-slate-400 font-medium">Configure your VTStack API keys</p>
                    </div>
                    <div className="ml-auto">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                            <FiCheckCircle className="w-3 h-3" />
                            Sole Provider
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    {/* Info Banner */}
                    <div className="flex items-start gap-3 p-3.5 bg-green-50 border border-green-100 rounded-xl">
                        <FiInfo className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs text-green-800 font-medium leading-relaxed">
                                VTStack handles all automated funding and virtual account creation.
                                Keep your keys secure and never share them.
                            </p>
                            <a
                                href="https://vtstack.vtfree.com.ng"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-green-700 hover:text-green-900 mt-1.5"
                            >
                                Get API Keys <FiZap className="w-3 h-3" />
                            </a>
                        </div>
                    </div>

                    {/* Hidden gateway field */}
                    <input type="hidden" name="DEFAULT_PAYMENT_GATEWAY" value="vtstack" />

                    {/* Key Fields */}
                    <div className="space-y-4">
                        {secretFields.map(({ key, label, placeholder }) => (
                            <div key={key}>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
                                <div className="relative">
                                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input
                                        type={showSecrets[key] ? 'text' : 'password'}
                                        name={key}
                                        value={(formData as any)[key]}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none font-mono text-xs text-slate-700 transition-all"
                                        placeholder={placeholder}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => toggleSecret(key)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showSecrets[key] ? <FiEyeOff className="w-3.5 h-3.5" /> : <FiEye className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Save */}
                    <div className="flex justify-end pt-3 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-2.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 active:scale-95"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <FiSave className="w-4 h-4" />
                                    <span>Save Settings</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentSettings;
