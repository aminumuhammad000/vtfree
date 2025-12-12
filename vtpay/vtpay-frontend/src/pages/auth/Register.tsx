import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Mail, Lock, User, Phone, ArrowRight, ArrowLeft } from 'lucide-react';

export const Register: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        fullName: '',
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
        // Validation for step 1
        if (currentStep === 1) {
            if (!formData.fullName) {
                setError('Please enter your full name');
                return;
            }
        }
        // Validation for step 2
        if (currentStep === 2) {
            if (!formData.email || !formData.phone) {
                setError('Please provide your contact information');
                return;
            }
            // Basic email validation
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

            // Show success message instead of auto-login
            setSuccessMessage(response.data.message || 'Registration successful. Please check your email to verify your account.');

            // Optionally redirect to login after a delay
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
            <div className="card animate-slide-up" style={{ maxWidth: '32rem', margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
                <div className="mb-6 flex justify-center">
                    <div className="bg-green-100 p-4 rounded-full">
                        <Mail size={48} className="text-green-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold mb-4">Check Your Email</h2>
                <p className="mb-6 text-gray-600">{successMessage}</p>
                <Button onClick={() => navigate('/login')} fullWidth>
                    Go to Login
                </Button>
            </div>
        );
    }

    return (
        <div className="card animate-slide-up" style={{ maxWidth: '32rem', margin: '0 auto', padding: '2rem' }}>
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Create Account</h2>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    Step {currentStep} of {totalSteps}
                </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
                <div className="step-progress-bar">
                    <div
                        className="step-progress-fill"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                {/* Step Indicators */}
                <div className="step-indicators">
                    {[1, 2, 3].map((step) => (
                        <div
                            key={step}
                            className={`step-indicator ${step < currentStep ? 'step-indicator-complete' :
                                step === currentStep ? 'step-indicator-active' :
                                    'step-indicator-inactive'
                                }`}
                        >
                            {step < currentStep ? '✓' : step}
                        </div>
                    ))}
                </div>
            </div>

            {error && (
                <div className="alert alert-error animate-slide-down">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Step 1: Personal Information */}
                {currentStep === 1 && (
                    <div className="animate-fade-in">
                        <h3 className="font-bold text-xl mb-6">Personal Information</h3>
                        <Input
                            label="Full Name"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="John Doe"
                            leftIcon={<User size={18} />}
                            required
                        />
                        <Button
                            type="button"
                            fullWidth
                            onClick={handleNext}
                            rightIcon={<ArrowRight size={20} />}
                            className="mt-6"
                        >
                            Continue
                        </Button>
                    </div>
                )}

                {/* Step 2: Contact Information */}
                {currentStep === 2 && (
                    <div className="animate-fade-in">
                        <h3 className="font-bold text-xl mb-6">Contact Information</h3>
                        <Input
                            label="Email Address"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            leftIcon={<Mail size={18} />}
                            required
                        />
                        <Input
                            label="Phone Number"
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="08012345678"
                            leftIcon={<Phone size={18} />}
                            required
                        />
                        <div className="flex gap-4 mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                leftIcon={<ArrowLeft size={20} />}
                                className="flex-1"
                            >
                                Back
                            </Button>
                            <Button
                                type="button"
                                onClick={handleNext}
                                rightIcon={<ArrowRight size={20} />}
                                className="flex-1"
                            >
                                Continue
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Security */}
                {currentStep === 3 && (
                    <div className="animate-fade-in">
                        <h3 className="font-bold text-xl mb-6">Security</h3>
                        <Input
                            label="Password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            leftIcon={<Lock size={18} />}
                            required
                        />
                        <Input
                            label="Confirm Password"
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                            leftIcon={<Lock size={18} />}
                            required
                        />
                        <p className="text-sm rounded-lg border mt-4" style={{ color: 'var(--color-text-muted)', background: '#DBEAFE', padding: '0.75rem', borderColor: '#BFDBFE' }}>
                            💡 Password must be at least 8 characters long
                        </p>
                        <div className="flex gap-4 mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                leftIcon={<ArrowLeft size={20} />}
                                className="flex-1"
                            >
                                Back
                            </Button>
                            <Button
                                type="submit"
                                isLoading={isLoading}
                                className="flex-1"
                            >
                                Create Account
                            </Button>
                        </div>
                    </div>
                )}
            </form>

            <div className="mt-8 pt-6 border-t text-center text-sm" style={{ color: 'var(--color-text-muted)', borderTopColor: '#F3F4F6' }}>
                Already have an account?{' '}
                <Link
                    to="/login"
                    className="font-semibold"
                    style={{ color: 'var(--color-primary)' }}
                >
                    Sign In
                </Link>
            </div>
        </div>
    );
};
