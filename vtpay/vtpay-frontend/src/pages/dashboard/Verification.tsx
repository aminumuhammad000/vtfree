import React, { useState } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { CreditCard, FileText, Upload, AlertCircle, Clock, CheckCircle } from 'lucide-react';
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
            <div className="page-container">
                <div className="page-header-main">
                    <h1 className="page-title">Verification Status</h1>
                </div>
                <div className="card max-w-2xl mx-auto text-center p-8">
                    <div className="flex justify-center mb-6">
                        <div className="bg-green-100 p-4 rounded-full">
                            <CheckCircle size={48} className="text-green-600" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Account Verified</h2>
                    <p className="text-gray-600">
                        Congratulations! Your account is fully verified. You have access to all features including live API keys and virtual account creation.
                    </p>
                </div>
            </div>
        );
    }

    if (user?.kycLevel === 2) {
        return (
            <div className="page-container">
                <div className="page-header-main">
                    <h1 className="page-title">Verification Status</h1>
                </div>
                <div className="card max-w-2xl mx-auto text-center p-8">
                    <div className="flex justify-center mb-6">
                        <div className="bg-yellow-100 p-4 rounded-full">
                            <Clock size={48} className="text-yellow-600" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Verification Pending</h2>
                    <p className="text-gray-600 mb-6">
                        Your documents have been submitted and are currently under review. This process usually takes 24-48 hours.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-lg text-left">
                        <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
                        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                            <li>Our compliance team will review your documents.</li>
                            <li>You will receive an email notification once approved.</li>
                            <li>In the meantime, you can continue using the dashboard in Test Mode.</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    // Default: KYC Level < 2 (Upload Form)
    return (
        <div className="page-container">
            <div className="page-header-main">
                <h1 className="page-title">Account Verification</h1>
            </div>

            <div className="card max-w-2xl mx-auto p-8">
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-2">Submit KYC Documents</h2>
                    <p className="text-gray-500">
                        Please provide your details to unlock full account features.
                    </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <AlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-blue-700">
                        To comply with regulations, we need to verify your identity before you can perform live transactions.
                    </p>
                </div>

                {error && (
                    <div className="alert alert-error mb-6">
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <Input
                        label="National Identity Number (NIN)"
                        name="nin"
                        value={formData.nin}
                        onChange={handleChange}
                        placeholder="Enter your NIN"
                        leftIcon={<FileText size={18} />}
                        required
                    />

                    <Input
                        label="Bank Verification Number (BVN)"
                        name="bvn"
                        value={formData.bvn}
                        onChange={handleChange}
                        placeholder="Enter your BVN"
                        leftIcon={<CreditCard size={18} />}
                        required
                    />

                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                            Upload ID Card
                        </label>
                        <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: 'var(--color-border)' }}>
                            <input
                                type="file"
                                id="idCard"
                                className="hidden"
                                onChange={handleFileChange}
                                accept="image/*,.pdf"
                            />
                            <label htmlFor="idCard" className="cursor-pointer flex flex-col items-center">
                                <Upload size={32} className="text-gray-400 mb-2" />
                                <span className="text-sm font-medium text-gray-600">
                                    {formData.idCard ? formData.idCard : 'Click to upload ID Card'}
                                </span>
                                <span className="text-xs text-gray-400 mt-1">
                                    JPG, PNG or PDF (Max 5MB)
                                </span>
                            </label>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        isLoading={isLoading}
                        fullWidth
                        disabled={!formData.nin || !formData.bvn || !formData.idCard}
                    >
                        Submit for Verification
                    </Button>
                </form>
            </div>
        </div>
    );
};
