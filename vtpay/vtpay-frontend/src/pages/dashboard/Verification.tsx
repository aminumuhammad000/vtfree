import React, { useState } from 'react';
import api from '../../services/api';
import { CreditCard, FileText, Upload, AlertCircle, Clock, CheckCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Verification: React.FC = () => {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        nin: user?.nin || '',
        bvn: user?.bvn || '',
        idCard: user?.idCardPath || '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData({ ...formData, idCard: e.target.files[0].name });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await api.post('/kyc/submit', formData);
            if (user) {
                updateUser({ ...user, kycLevel: 2 });
            }
        } catch (err: any) {
            console.error('KYC submission error:', err);
            setError(err.response?.data?.message || 'Failed to submit KYC details.');
        } finally {
            setIsLoading(false);
        }
    };

    // Render based on KYC Level
    if (user?.kycLevel === 3) {
        return (
            <div className="max-w-2xl mx-auto py-12">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Verified</h2>
                    <p className="text-slate-500 max-w-md mx-auto">
                        Congratulations! Your account is fully verified. You have access to all features including live API keys and virtual account creation.
                    </p>
                </div>
            </div>
        );
    }

    if (user?.kycLevel === 2) {
        return (
            <div className="max-w-2xl mx-auto py-12">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock size={40} className="text-yellow-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Verification Pending</h2>
                    <p className="text-slate-500 mb-8 max-w-md mx-auto">
                        Your documents have been submitted and are currently under review. This process usually takes 24-48 hours.
                    </p>

                    <div className="bg-blue-50 rounded-xl p-6 text-left border border-blue-100">
                        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                            <ShieldCheck size={18} />
                            What happens next?
                        </h3>
                        <ul className="space-y-2 text-sm text-blue-800">
                            <li className="flex items-start gap-2">
                                <span className="mt-1.5 w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></span>
                                Our compliance team will review your documents.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-1.5 w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></span>
                                You will receive an email notification once approved.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-1.5 w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></span>
                                In the meantime, you can continue using the dashboard in Test Mode.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    // Default: KYC Level < 2 (Upload Form)
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Account Verification</h1>
                <p className="text-slate-500">Submit your details to unlock full features</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8 flex items-start gap-3">
                    <AlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-blue-700">
                        To comply with regulations, we need to verify your identity before you can perform live transactions.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
                        <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">National Identity Number (NIN)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FileText size={18} className="text-slate-400" />
                            </div>
                            <input
                                type="text"
                                name="nin"
                                value={formData.nin}
                                onChange={handleChange}
                                placeholder="Enter your NIN"
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Bank Verification Number (BVN)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <CreditCard size={18} className="text-slate-400" />
                            </div>
                            <input
                                type="text"
                                name="bvn"
                                value={formData.bvn}
                                onChange={handleChange}
                                placeholder="Enter your BVN"
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Upload ID Card</label>
                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-50 hover:border-green-500 transition-all group">
                            <input
                                type="file"
                                id="idCard"
                                className="hidden"
                                onChange={handleFileChange}
                                accept="image/*,.pdf"
                            />
                            <label htmlFor="idCard" className="cursor-pointer flex flex-col items-center w-full h-full">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                                    <Upload size={24} className="text-slate-400 group-hover:text-green-600" />
                                </div>
                                <span className="text-sm font-medium text-slate-700 group-hover:text-green-700">
                                    {formData.idCard ? formData.idCard : 'Click to upload ID Card'}
                                </span>
                                <span className="text-xs text-slate-400 mt-1">
                                    JPG, PNG or PDF (Max 5MB)
                                </span>
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !formData.nin || !formData.bvn || !formData.idCard}
                        className="w-full py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Submitting...
                            </>
                        ) : 'Submit for Verification'}
                    </button>
                </form>
            </div>
        </div>
    );
};
