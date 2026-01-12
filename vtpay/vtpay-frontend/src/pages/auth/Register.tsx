import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Loader2, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

export const Register: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        fullName: '',
        businessName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleNext = () => {
        if (currentStep === 1) {
            if (!formData.fullName) {
                setError('Please enter your full name');
                return;
            }
            if (!formData.businessName) {
                setError('Please enter your business name');
                return;
            }
        }
        if (currentStep === 2) {
            if (!formData.email || !formData.phone) {
                setError('Please provide your contact information');
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                setError('Please enter a valid email address');
                return;
            }
        }
        setError('');
        setCurrentStep(currentStep + 1);
    };

    const handleBack = () => {
        setError('');
        setCurrentStep(currentStep - 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const { confirmPassword, ...registerData } = formData;
            const response = await api.post('/auth/register', registerData);
            setSuccessMessage(response.data.message || 'Registration successful. Please check your email to verify your account.');
            setTimeout(() => {
                navigate('/login');
            }, 5000);
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.response?.data?.message || 'Failed to register. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const totalSteps = 3;
    const progress = (currentStep / totalSteps) * 100;

    if (successMessage) {
        return (
            <div className="auth-card" style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{
                        display: 'inline-flex',
                        padding: '1rem',
                        background: 'var(--success-bg)',
                        borderRadius: '50%'
                    }}>
                        <CheckCircle size={48} style={{ color: 'var(--success)' }} />
                    </div>
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Check Your Email</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{successMessage}</p>
                <button onClick={() => navigate('/login')} className="auth-submit-btn">
                    Go to Login
                </button>
            </div>
        );
    }

    return (
        <div className="auth-card">
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
                    Create Account
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Step {currentStep} of {totalSteps}
                </p>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: '2rem' }}>
                <div className="step-progress-bar">
                    <div className="step-progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="step-indicators">
                    {[1, 2, 3].map((step) => (
                        <div
                            key={step}
                            className={`step-indicator ${step < currentStep ? 'complete' :
                                step === currentStep ? 'active' : ''
                                }`}
                        >
                            {step < currentStep ? '✓' : step}
                        </div>
                    ))}
                </div>
            </div>

            {error && (
                <div className="alert alert-error">
                    <div className="alert-icon">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="alert-content">
                        <p>{error}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
                {/* Step 1: Personal Information */}
                {currentStep === 1 && (
                    <div className="animate-fade-in">
                        <h3 style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '1.5rem' }}>Personal Information</h3>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="John Doe"
                                className="form-input"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Business Name</label>
                            <input
                                type="text"
                                name="businessName"
                                value={formData.businessName}
                                onChange={handleChange}
                                placeholder="Acme Corp"
                                className="form-input"
                                required
                            />
                        </div>
                        <button type="button" onClick={handleNext} className="auth-submit-btn">
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                Continue <ArrowRight size={18} />
                            </span>
                        </button>
                    </div>
                )}

                {/* Step 2: Contact Information */}
                {currentStep === 2 && (
                    <div className="animate-fade-in">
                        <h3 style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '1.5rem' }}>Contact Information</h3>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                className="form-input"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="08012345678"
                                className="form-input"
                                required
                            />
                        </div>
                        <div className="auth-form-buttons">
                            <button type="button" onClick={handleBack} className="btn btn-outline">
                                <ArrowLeft size={18} /> Back
                            </button>
                            <button type="button" onClick={handleNext} className="auth-submit-btn" style={{ flex: 1 }}>
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    Continue <ArrowRight size={18} />
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Security */}
                {currentStep === 3 && (
                    <div className="animate-fade-in">
                        <h3 style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '1.5rem' }}>Security</h3>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="form-input"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="form-input"
                                required
                            />
                        </div>
                        <p className="password-hint">
                            💡 Password must be at least 8 characters long
                        </p>
                        <div className="auth-form-buttons">
                            <button type="button" onClick={handleBack} className="btn btn-outline">
                                <ArrowLeft size={18} /> Back
                            </button>
                            <button type="submit" className="auth-submit-btn" style={{ flex: 1 }} disabled={isLoading}>
                                {isLoading ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        <Loader2 size={20} style={{ animation: 'spin 0.8s linear infinite' }} />
                                        Creating...
                                    </span>
                                ) : (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        Create Account
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </form>

            <div className="auth-footer">
                Already have an account?{' '}
                <Link to="/login">Sign In</Link>
            </div>
        </div>
    );
};
