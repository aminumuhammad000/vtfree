import React, { useEffect, useState } from 'react';
import {
    FiCreditCard,
    FiShield,
    FiGlobe,
    FiCheckCircle,
    FiLock,
    FiZap,
    FiInfo,
    FiSave,
    FiEye,
    FiEyeOff
} from 'react-icons/fi';
import { getAllConfigs, updateConfig } from '../api/adminApi';
import { useToast } from '../hooks/ToastContext';

const PaymentSettings = () => {
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
    const [formData, setFormData] = useState({
        DEFAULT_PAYMENT_GATEWAY: 'vtpay',
        VTPAY_API_KEY: '',
        VTPAY_SECRET_KEY: '',
        VTPAY_PUBLIC_KEY: '',
        PAYSTACK_SECRET_KEY: '',
        PAYSTACK_PUBLIC_KEY: '',
        MONNIFY_API_KEY: '',
        MONNIFY_SECRET_KEY: '',
        MONNIFY_CONTRACT_CODE: '',
        PAYRANT_API_KEY: '',
        PAYRANT_WEBHOOK_SECRET: '',
        PAYRANT_IS_ACTIVE: 'false',
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
        } catch (error) {
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
            const promises = Object.entries(formData).map(([key, value]) =>
                updateConfig(key, { value })
            );
            await Promise.all(promises);
            showSuccess('Payment settings updated successfully');
            fetchConfigs();
        } catch (error) {
            showError('Failed to update payment settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-64 space-y-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-green-600 rounded-full animate-spin"></div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Gateways...</p>
            </div>
        );
    }

    const gateways = [
        { id: 'vtpay', name: 'VTPay', description: 'VTPay Gateway', disabled: false },
        { id: 'payrant', name: 'Payrant', description: 'Payrant Gateway', disabled: false },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Active Gateway Banner */}
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-green-500/20 transition-colors duration-700"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-xl backdrop-blur-md flex items-center justify-center">
                                <FiShield className="w-5 h-5 text-green-400" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Active Gateway</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <h2 className="text-4xl sm:text-5xl font-black tracking-tight capitalize">
                                {formData.DEFAULT_PAYMENT_GATEWAY || 'Not Set'}
                            </h2>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30 text-[10px] font-black uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                Live
                            </div>
                        </div>
                        <p className="text-sm text-slate-400 font-medium max-w-md leading-relaxed">
                            All automated funding and payment processing are currently routed through this gateway.
                        </p>
                    </div>
                    <div className="hidden lg:block">
                        <FiZap className="w-24 h-24 text-white/5" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-green-600">
                            <FiCreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Gateway Management</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Configure & Switch Gateways</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-10">
                    {/* Gateway Selection */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Default Gateway Selection</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {gateways.map((gw) => (
                                <label
                                    key={gw.id}
                                    className={`relative flex flex-col p-5 border-2 rounded-2xl transition-all duration-300 group ${gw.disabled
                                        ? 'opacity-40 cursor-not-allowed border-slate-100 bg-slate-50'
                                        : 'cursor-pointer'
                                        } ${formData.DEFAULT_PAYMENT_GATEWAY === gw.id
                                            ? 'border-green-500 bg-green-50/30 shadow-lg shadow-green-100/50'
                                            : !gw.disabled ? 'border-slate-100 hover:border-slate-200 hover:bg-slate-50' : ''
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
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${formData.DEFAULT_PAYMENT_GATEWAY === gw.id ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-400'
                                            }`}>
                                            <FiGlobe className="w-4 h-4" />
                                        </div>
                                        {formData.DEFAULT_PAYMENT_GATEWAY === gw.id && (
                                            <FiCheckCircle className="w-5 h-5 text-green-600 animate-in zoom-in duration-300" />
                                        )}
                                    </div>
                                    <p className="font-black text-slate-900 text-sm">{gw.name}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-1">{gw.description}</p>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* VTPay Config */}
                        {formData.DEFAULT_PAYMENT_GATEWAY === 'vtpay' && (
                            <div className="space-y-6 p-6 bg-slate-50/50 rounded-3xl border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 text-[10px] font-black text-slate-400">01</div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">VTPay Credentials</h3>
                                </div>
                                <div className="p-4 bg-green-50/50 border border-green-100 rounded-2xl flex gap-3">
                                    <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center text-green-600 shrink-0">
                                        <FiInfo className="w-4 h-4" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] text-green-800 font-medium leading-relaxed">
                                            VTPay is the recommended gateway for seamless automated funding and payouts. You need active API keys to process transactions.
                                        </p>
                                        <a
                                            href="https://vtpay.vtfree.com.ng"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-green-700 hover:text-green-900 hover:underline transition-all"
                                        >
                                            Get API Keys
                                            <FiZap className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Secret API Key</label>
                                        <div className="relative">
                                            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type={showSecrets['VTPAY_SECRET_KEY'] ? 'text' : 'password'}
                                                name="VTPAY_SECRET_KEY"
                                                value={formData.VTPAY_SECRET_KEY}
                                                onChange={handleChange}
                                                className="w-full pl-11 pr-12 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none font-mono text-xs transition-all"
                                                placeholder="sk_live_..."
                                            />
                                            <button
                                                type="button"
                                                onClick={() => toggleSecret('VTPAY_SECRET_KEY')}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showSecrets['VTPAY_SECRET_KEY'] ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payrant Config */}
                        {formData.DEFAULT_PAYMENT_GATEWAY === 'payrant' && (
                            <div className="space-y-6 p-6 bg-slate-50/50 rounded-3xl border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 text-[10px] font-black text-slate-400">01</div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Payrant Credentials</h3>
                                </div>
                                <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl flex gap-3">
                                    <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center text-purple-600 shrink-0">
                                        <FiInfo className="w-4 h-4" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] text-purple-800 font-medium leading-relaxed">
                                            Payrant is an alternative gateway supporting PalmPay virtual accounts.
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Payrant API Key</label>
                                        <div className="relative">
                                            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type={showSecrets['PAYRANT_API_KEY'] ? 'text' : 'password'}
                                                name="PAYRANT_API_KEY"
                                                value={formData.PAYRANT_API_KEY}
                                                onChange={handleChange}
                                                className="w-full pl-11 pr-12 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none font-mono text-xs transition-all"
                                                placeholder="Payrant API Key"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => toggleSecret('PAYRANT_API_KEY')}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showSecrets['PAYRANT_API_KEY'] ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Payrant Webhook Secret</label>
                                        <div className="relative">
                                            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type={showSecrets['PAYRANT_WEBHOOK_SECRET'] ? 'text' : 'password'}
                                                name="PAYRANT_WEBHOOK_SECRET"
                                                value={formData.PAYRANT_WEBHOOK_SECRET}
                                                onChange={handleChange}
                                                className="w-full pl-11 pr-12 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none font-mono text-xs transition-all"
                                                placeholder="Webhook Secret"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => toggleSecret('PAYRANT_WEBHOOK_SECRET')}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showSecrets['PAYRANT_WEBHOOK_SECRET'] ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    <div className="flex justify-end pt-6 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-xl shadow-slate-200 disabled:opacity-50 active:scale-95 flex items-center gap-3"
                        >
                            {saving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Syncing...</span>
                                </>
                            ) : (
                                <>
                                    <FiSave className="w-5 h-5" />
                                    <span>Update Gateway Settings</span>
                                </>
                            )}
                        </button>
                    </div>
                </form >
            </div >
        </div >
    );
};

export default PaymentSettings;
