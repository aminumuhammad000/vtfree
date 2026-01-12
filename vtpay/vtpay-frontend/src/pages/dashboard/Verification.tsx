import React, { useState } from 'react';
import api from '../../services/api';
import {
    CreditCard,
    FileText,
    Upload,
    AlertCircle,
    Clock,
    CheckCircle2,
    ShieldCheck,
    Info,
    ArrowRight,
    Lock,
    Check,
    User,
    Calendar,
    Zap,
    RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export const Verification: React.FC = () => {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        nin: user?.nin || '',
        bvn: user?.bvn || '',
        ninName: '',
        dob: '',
        idCard: user?.idCardPath || '',
        otherDocs: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData({ ...formData, [e.target.name]: e.target.files[0].name });
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

    // Render based on Account Status
    if (user?.status === 'suspended') {
        return (
            <div className="verification-container animate-fade-in">
                <div className="verification-success-card border-red-200 bg-red-50">
                    <div className="success-icon-wrapper bg-red-100">
                        <AlertCircle size={48} className="text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-red-900 mb-3">Account Suspended</h2>
                    <p className="text-red-700 max-w-md mx-auto leading-relaxed mb-6">
                        Your account has been suspended by the administration. You currently have restricted access to VTPay features.
                    </p>
                    <div className="bg-white p-6 rounded-2xl border border-red-100 text-left mb-8">
                        <h3 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                            <Info size={18} />
                            Why is my account suspended?
                        </h3>
                        <p className="text-sm text-red-800">
                            Suspensions typically occur due to compliance reviews, suspicious activity, or missing documentation. Please contact our support team for more information.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <Link to="/dashboard/help" className="btn bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold">
                            Contact Support
                        </Link>
                        <button
                            onClick={async () => {
                                setIsLoading(true);
                                try {
                                    const response = await api.get('/auth/profile');
                                    updateUser(response.data.data);
                                } catch (err) {
                                    console.error('Refresh status error:', err);
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            className="text-red-600 text-sm font-bold hover:underline flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                            Check Status Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Render based on KYC Level
    if (user?.kycLevel === 3) {
        return (
            <div className="verification-container animate-fade-in">
                <div className="verification-success-card">
                    <div className="success-icon-wrapper">
                        <CheckCircle2 size={48} className="text-success" />
                    </div>
                    <h2 className="text-2xl font-bold text-heading mb-3">Account Verified</h2>
                    <p className="text-muted max-w-md mx-auto leading-relaxed">
                        Congratulations! Your account is fully verified. You now have unrestricted access to all VTPay features, including live payments and virtual accounts.
                    </p>
                    <div className="verification-status-grid">
                        <div className="text-center">
                            <div className="status-item-icon">
                                <Check size={20} />
                            </div>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Live API</p>
                        </div>
                        <div className="text-center">
                            <div className="status-item-icon">
                                <Check size={20} />
                            </div>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Virtual AC</p>
                        </div>
                        <div className="text-center">
                            <div className="status-item-icon">
                                <Check size={20} />
                            </div>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">High Limits</p>
                        </div>
                    </div>

                    <div className="mt-10">
                        <Link to="/dashboard" className="btn btn-primary px-8 py-3 rounded-xl font-bold">
                            Go to Dashboard
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (user?.kycLevel === 2) {
        return (
            <div className="verification-container animate-fade-in">
                <div className="verification-success-card">
                    <div className="pending-icon-wrapper">
                        <Clock size={48} className="text-warning" />
                    </div>
                    <h2 className="text-2xl font-bold text-heading mb-3">Review in Progress</h2>
                    <p className="text-muted mb-10 max-w-md mx-auto leading-relaxed">
                        Your documents have been submitted and are currently being reviewed by our compliance team. This typically takes 24-48 hours.
                    </p>

                    <div className="pending-info-box">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <ShieldCheck size={100} />
                        </div>
                        <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                            <ShieldCheck size={20} />
                            What to expect?
                        </h3>
                        <ul className="space-y-4 text-sm text-blue-800 relative z-10">
                            <li className="flex items-start gap-3">
                                <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">1</div>
                                <p>Our team will verify your NIN and details against national databases.</p>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">2</div>
                                <p>Your uploaded ID card will be checked for authenticity and clarity.</p>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">3</div>
                                <p>You'll receive an email notification as soon as the review is complete.</p>
                            </li>
                        </ul>
                    </div>

                    <button
                        onClick={async () => {
                            setIsLoading(true);
                            try {
                                const response = await api.get('/auth/profile');
                                updateUser(response.data.data);
                            } catch (err) {
                                console.error('Error refreshing status:', err);
                            } finally {
                                setIsLoading(false);
                            }
                        }}
                        disabled={isLoading}
                        className="mt-8 btn btn-outline w-full max-w-xs mx-auto justify-center"
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                Checking...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Check Status
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-10 animate-fade-in">
            <div className="verification-header">
                <div>
                    <h1 className="text-heading">Verification</h1>
                    <p className="text-body mt-1">Complete your KYC to unlock full account features</p>
                </div>
                <div className="tier-badge">
                    <Lock size={14} className="text-muted" />
                    <span className="tier-badge-text">Tier 1 Limited</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 space-y-6">
                    <div className="verification-card">
                        <div className="verification-form-container">
                            {error && (
                                <div className="alert alert-error mb-8">
                                    <div className="alert-icon">
                                        <AlertCircle size={18} />
                                    </div>
                                    <p>{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="form-group">
                                        <label className="form-label">National Identity Number (NIN)</label>
                                        <div className="verification-input-wrapper">
                                            <div className="verification-input-icon">
                                                <FileText size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                name="nin"
                                                value={formData.nin}
                                                onChange={handleChange}
                                                placeholder="Enter 11-digit NIN"
                                                className="verification-input"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Bank Verification Number (BVN)</label>
                                        <div className="verification-input-wrapper">
                                            <div className="verification-input-icon">
                                                <ShieldCheck size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                name="bvn"
                                                value={formData.bvn}
                                                onChange={handleChange}
                                                placeholder="Enter 11-digit BVN"
                                                className="verification-input"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Name on NIN</label>
                                        <div className="verification-input-wrapper">
                                            <div className="verification-input-icon">
                                                <User size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                name="ninName"
                                                value={formData.ninName}
                                                onChange={handleChange}
                                                placeholder="Enter full name as it appears on NIN"
                                                className="verification-input"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Date of Birth</label>
                                        <div className="verification-input-wrapper">
                                            <div className="verification-input-icon">
                                                <Calendar size={18} />
                                            </div>
                                            <input
                                                type="date"
                                                name="dob"
                                                value={formData.dob}
                                                onChange={handleChange}
                                                className="verification-input"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Identity Document</label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="idCard"
                                                name="idCard"
                                                className="hidden"
                                                onChange={handleFileChange}
                                                accept="image/*,.pdf"
                                                required
                                            />
                                            <label htmlFor="idCard" className="file-upload-label group">
                                                <div className="file-upload-icon-wrapper group-hover:text-primary">
                                                    <Upload size={24} className="text-muted group-hover:text-primary transition-colors" />
                                                </div>
                                                <p className="file-upload-text group-hover:text-primary transition-colors">
                                                    {formData.idCard ? formData.idCard : 'Upload ID Document'}
                                                </p>
                                                <p className="file-upload-subtext">
                                                    JPG, PNG or PDF (Max 5MB)
                                                </p>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">
                                            Other Documents <span className="text-muted font-normal text-xs">(Optional)</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="otherDocs"
                                                name="otherDocs"
                                                className="hidden"
                                                onChange={handleFileChange}
                                                accept="image/*,.pdf"
                                            />
                                            <label htmlFor="otherDocs" className="flex items-center gap-3 w-full p-4 border border-border rounded-xl bg-bg-subtle hover:bg-bg-surface transition-all cursor-pointer">
                                                <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center flex-shrink-0 border border-border">
                                                    <Upload size={16} className="text-muted" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-text-primary">
                                                        {formData.otherDocs ? formData.otherDocs : 'Upload Utility Bill or other docs'}
                                                    </p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || !formData.nin || !formData.bvn || !formData.ninName || !formData.dob || !formData.idCard}
                                    className="verification-submit-btn"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="spinner"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            Submit for Verification
                                            <ArrowRight size={20} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="verification-info-card">
                        <h3 className="text-sm font-bold text-heading mb-4 flex items-center gap-2">
                            <Info size={16} className="text-primary" />
                            Why verify?
                        </h3>
                        <div className="space-y-4">
                            <div className="verification-benefit-item">
                                <div className="verification-benefit-icon green">
                                    <Zap size={16} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-heading">Unlock Live Mode</p>
                                    <p className="text-[10px] text-muted mt-0.5">Start processing real payments and payouts instantly.</p>
                                </div>
                            </div>
                            <div className="verification-benefit-item">
                                <div className="verification-benefit-icon blue">
                                    <CreditCard size={16} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-heading">Virtual Accounts</p>
                                    <p className="text-[10px] text-muted mt-0.5">Generate dedicated bank accounts for your customers.</p>
                                </div>
                            </div>
                            <div className="verification-benefit-item">
                                <div className="verification-benefit-icon purple">
                                    <ShieldCheck size={16} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-heading">Higher Limits</p>
                                    <p className="text-[10px] text-muted mt-0.5">Increase your transaction and withdrawal limits significantly.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="verification-accepted-docs">
                        <h4 className="text-xs font-bold text-heading uppercase tracking-wider mb-3">Accepted Documents</h4>
                        <ul className="space-y-2">
                            {['National ID Card', 'International Passport', 'Driver\'s License', 'Voter\'s Card'].map((doc) => (
                                <li key={doc} className="doc-list-item">
                                    <div className="doc-list-dot"></div>
                                    {doc}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
