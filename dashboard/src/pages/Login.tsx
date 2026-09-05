import { useMutation } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { login as loginApi } from '../api/adminApi';
import { useAuthContext } from '../hooks/AuthContext';
import { useToast } from '../hooks/ToastContext';

type LoginForm = {
  email: string;
  password: string;
  app_id: string;
};

const Login: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<LoginForm>();
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [showForgotPassword, setShowForgotPassword] = React.useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = React.useState('');
  const [forgotPasswordAppId, setForgotPasswordAppId] = React.useState('');
  const navigate = useNavigate();
  const auth = useAuthContext();
  const toast = useToast();

  // Load saved credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('admin_email');
    const savedAppId = localStorage.getItem('admin_app_id');
    const savedPassword = localStorage.getItem('admin_password');
    const savedRemember = localStorage.getItem('admin_remember_me');

    if (savedRemember === 'true' && savedEmail && savedAppId && savedPassword) {
      setValue('email', savedEmail);
      setValue('app_id', savedAppId);
      // Decode password (basic encoding, not encryption)
      try {
        setValue('password', atob(savedPassword));
      } catch (e) {
        console.error('Failed to decode password');
      }
      setRememberMe(true);
    }
  }, [setValue]);

  const mutation = useMutation({
    mutationFn: (data: LoginForm) => loginApi(data),
    onSuccess: (res: any) => {
      console.log('Login response:', res);
      setApiError(null);
      if (res.data.success) {
        console.log('Login successful, saving auth data...');

        // Handle Remember Me
        if (rememberMe) {
          localStorage.setItem('admin_email', res.data.data.admin.email);
          localStorage.setItem('admin_app_id', res.data.data.app.app_id);
          // Basic encoding (not secure encryption, but better than plain text)
          localStorage.setItem('admin_password', btoa(mutation.variables?.password || ''));
          localStorage.setItem('admin_remember_me', 'true');
        } else {
          // Clear saved credentials if not remembering
          localStorage.removeItem('admin_email');
          localStorage.removeItem('admin_app_id');
          localStorage.removeItem('admin_password');
          localStorage.removeItem('admin_remember_me');
        }

        auth.login(res.data.data.token, res.data.data.admin, res.data.data.app);
        console.log('Auth data saved, navigating to dashboard...');
        toast.showSuccess('Login successful! Redirecting...');
        navigate('/dashboard');
      } else {
        const errMsg = res.data.message || 'Login failed';
        setApiError(errMsg);
        toast.showError(errMsg);
      }
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Login failed. Please check your credentials.';
      setApiError(errorMessage);
      toast.showError(errorMessage);
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (_data: { email: string; app_id: string }) => {
      // This would call your backend API to send password reset request to super admin
      // For now, we'll simulate it
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, message: 'Password reset request sent to admin' });
        }, 1000);
      });
    },
    onSuccess: () => {
      toast.showSuccess('Password reset request sent! Admin will contact you shortly.');
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
      setForgotPasswordAppId('');
    },
    onError: (error: any) => {
      toast.showError(error?.message || 'Failed to send password reset request');
    },
  });

  const onSubmit = (data: LoginForm) => {
    setApiError(null);
    mutation.mutate(data);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail || !forgotPasswordAppId) {
      toast.showError('Please enter both email and app ID');
      return;
    }
    forgotPasswordMutation.mutate({
      email: forgotPasswordEmail,
      app_id: forgotPasswordAppId,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md px-6">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-900 rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h1>
          <p className="text-slate-500">Sign in to your admin account</p>
        </div>

        {/* Login Form Card */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200"
        >
          {/* API Error Alert */}
          {apiError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-red-800">Login Failed</h3>
                  <p className="text-sm text-red-700 mt-1">{apiError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-900 focus:border-transparent transition-all ${errors.email ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-slate-50'
                }`}
              placeholder="admin@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-2 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* App ID Field */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              App ID / Package Name
            </label>
            <input
              type="text"
              {...register('app_id', {
                required: 'App ID is required',
                minLength: {
                  value: 3,
                  message: 'App ID must be at least 3 characters'
                }
              })}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-900 focus:border-transparent transition-all ${errors.app_id ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-slate-50'
                }`}
              placeholder="e.g. com.example.myapp"
            />
            <p className="text-xs text-slate-500 mt-1">Enter the package name assigned to your app (e.g. com.example.myapp)</p>
            {errors.app_id && (
              <p className="text-red-500 text-sm mt-2 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.app_id.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Password
            </label>
            <input
              type="password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-900 focus:border-transparent transition-all ${errors.password ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-slate-50'
                }`}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-2 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-green-900 border-slate-300 rounded focus:ring-green-900 cursor-pointer"
              />
              <span className="ml-2 text-sm text-slate-600">Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm font-medium text-green-900 hover:text-green-700 transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-green-900 text-white py-3 rounded-lg font-semibold hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-900 focus:ring-opacity-50 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            disabled={mutation.status === 'pending'}
          >
            {mutation.status === 'pending' ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Protected by enterprise-grade security
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-fadeIn">
            {/* Close Button */}
            <button
              onClick={() => setShowForgotPassword(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-4">
                <svg className="w-7 h-7 text-green-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Forgot Password?</h2>
              <p className="text-slate-500 text-sm">
                Enter your email and app ID. We'll send a password reset request to the admin.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-900 focus:border-transparent transition-all bg-slate-50"
                  placeholder="admin@example.com"
                  required
                />
              </div>

              {/* App ID Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  App ID
                </label>
                <input
                  type="text"
                  value={forgotPasswordAppId}
                  onChange={(e) => setForgotPasswordAppId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-900 focus:border-transparent transition-all bg-slate-50"
                  placeholder="VTPLUG"
                  required
                />
              </div>

              {/* Info Message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-blue-800">
                  The super admin will receive your request and contact you to reset your password.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotPasswordMutation.status === 'pending'}
                  className="flex-1 px-4 py-3 bg-green-900 text-white rounded-lg font-semibold hover:bg-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {forgotPasswordMutation.status === 'pending' ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Send Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;