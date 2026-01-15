import React, { useEffect, useState } from 'react';
import { getAllConfigs, updateConfig } from '../api/adminApi';
import { useToast } from '../hooks/ToastContext';
import { CreditCard, Shield, Key, Globe, CheckCircle2, AlertCircle } from 'lucide-react';

const PaymentSettings = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [configs, setConfigs] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        DEFAULT_PAYMENT_GATEWAY: 'vtpay',
        VTPAY_API_KEY: '',
        VTPAY_SECRET_KEY: '',
        VTPAY_PUBLIC_KEY: '',
        PAYRANT_API_KEY: '',
        PAYRANT_WEBHOOK_SECRET: '',
        PAYSTACK_SECRET_KEY: '',
        PAYSTACK_PUBLIC_KEY: '',
        MONNIFY_API_KEY: '',
        MONNIFY_SECRET_KEY: '',
        MONNIFY_CONTRACT_CODE: '',
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
                setConfigs(paymentConfigs);

                const newFormData = { ...formData };
                paymentConfigs.forEach((c: any) => {
                    if (c.key in newFormData) {
                        (newFormData as any)[c.key] = c.value;
                    }
                });
                setFormData(newFormData);
            }
        } catch (error) {
            showToast('Failed to fetch payment settings', 'error');
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
            showToast('Payment settings updated successfully', 'success');
            fetchConfigs();
        } catch (error) {
            showToast('Failed to update payment settings', 'error');
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

    const gateways = [
        { id: 'vtpay', name: 'VTPay', description: 'Default Gateway', disabled: false },
        { id: 'payrant', name: 'Payrant', description: 'Alternative Gateway', disabled: false },
        { id: 'paystack', name: 'Paystack', description: 'Coming Soon', disabled: true },
        { id: 'monnify', name: 'Monnify', description: 'Coming Soon', disabled: true },
    ];

    return (
        <div className="space-y-6">
            {/* Active Gateway Banner */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
                            <Shield className="w-6 h-6 text-green-400" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Active Gateway</span>
                    </div>
                    <div className="flex items-end gap-4">
                        <h2 className="text-5xl font-black tracking-tight capitalize">
                            {formData.DEFAULT_PAYMENT_GATEWAY || 'Not Set'}
                        </h2>
                        <div className="flex items-center gap-2 mb-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30 text-xs font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            LIVE
                        </div>
                    </div>
                    <p className="mt-4 text-slate-400 max-w-md">
                        This gateway is currently handling all automated funding and payment processing for your application.
                    </p>
                </div>
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-green-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CreditCard className="w-6 h-6 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Payment Configuration</h2>
                    </div>
                    <p className="text-slate-600">Select and configure your preferred payment gateways</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-10">
                    {/* Gateway Selection */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Select Default Gateway</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {gateways.map((gw) => (
                                <label
                                    key={gw.id}
                                    className={`relative flex flex-col p-5 border-2 rounded-2xl transition-all duration-200 ${gw.disabled ? 'opacity-50 cursor-not-allowed border-slate-100 bg-slate-100/30' : 'cursor-pointer'} ${formData.DEFAULT_PAYMENT_GATEWAY === gw.id
                                        ? 'border-green-500 bg-green-50/50 ring-4 ring-green-500/5'
                                        : !gw.disabled ? 'border-slate-100 hover:border-slate-200 bg-slate-50/30' : ''
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="DEFAULT_PAYMENT_GATEWAY"
                                        value={gw.id}
                                        checked={formData.DEFAULT_PAYMENT_GATEWAY === gw.id}
                                        onChange={handleChange}
                                        className="hidden"
                                        disabled={gw.disabled}
                                    />
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={`p-2 rounded-lg ${formData.DEFAULT_PAYMENT_GATEWAY === gw.id ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                            <Globe className="w-4 h-4" />
                                        </div>
                                        {formData.DEFAULT_PAYMENT_GATEWAY === gw.id && (
                                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        )}
                                    </div>
                                    <p className="font-bold text-slate-900">{gw.name}</p>
                                    <p className="text-xs text-slate-500 mt-1">{gw.description}</p>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* VTPay Config */}
                        {formData.DEFAULT_PAYMENT_GATEWAY === 'vtpay' && (
                            <div className="space-y-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">1</span>
                                    VTPay Configuration
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">API Key</label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                name="VTPAY_API_KEY"
                                                value={formData.VTPAY_API_KEY}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm font-mono"
                                                placeholder="vt_live_..."
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Secret Key</label>
                                        <div className="relative">
                                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="password"
                                                name="VTPAY_SECRET_KEY"
                                                value={formData.VTPAY_SECRET_KEY}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm font-mono"
                                                placeholder="••••••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payrant Config */}
                        {formData.DEFAULT_PAYMENT_GATEWAY === 'payrant' && (
                            <div className="space-y-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">2</span>
                                    Payrant Configuration
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">API Key</label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                name="PAYRANT_API_KEY"
                                                value={formData.PAYRANT_API_KEY}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Webhook Secret</label>
                                        <div className="relative">
                                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="password"
                                                name="PAYRANT_WEBHOOK_SECRET"
                                                value={formData.PAYRANT_WEBHOOK_SECRET}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Paystack Config */}
                        {formData.DEFAULT_PAYMENT_GATEWAY === 'paystack' && (
                            <div className="space-y-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">3</span>
                                    Paystack Configuration
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Secret Key</label>
                                        <input
                                            type="password"
                                            name="PAYSTACK_SECRET_KEY"
                                            value={formData.PAYSTACK_SECRET_KEY}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm font-mono"
                                            placeholder="sk_live_..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Public Key</label>
                                        <input
                                            type="text"
                                            name="PAYSTACK_PUBLIC_KEY"
                                            value={formData.PAYSTACK_PUBLIC_KEY}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm font-mono"
                                            placeholder="pk_live_..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Monnify Config */}
                        {formData.DEFAULT_PAYMENT_GATEWAY === 'monnify' && (
                            <div className="space-y-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">4</span>
                                    Monnify Configuration
                                </h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">API Key</label>
                                            <input
                                                type="text"
                                                name="MONNIFY_API_KEY"
                                                value={formData.MONNIFY_API_KEY}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Contract Code</label>
                                            <input
                                                type="text"
                                                name="MONNIFY_CONTRACT_CODE"
                                                value={formData.MONNIFY_CONTRACT_CODE}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Secret Key</label>
                                        <input
                                            type="password"
                                            name="MONNIFY_SECRET_KEY"
                                            value={formData.MONNIFY_SECRET_KEY}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-6 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-10 rounded-2xl transition-all shadow-xl shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-5 h-5" />
                                    Save Payment Settings
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
