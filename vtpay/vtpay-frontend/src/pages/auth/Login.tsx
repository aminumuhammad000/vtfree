import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';
import { Mail, Lock } from 'lucide-react';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', formData);
            const { token, user } = response.data.data;
            login(token, user);
            navigate('/dashboard');
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.response?.data?.message || 'Failed to login. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '28rem', width: '100%', margin: '0 auto' }}>
            <Card>
                <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>

                {error && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
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
                        label="Password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        leftIcon={<Lock size={18} />}
                        required
                    />

                    <div className="flex justify-end mb-6">
                        <Link
                            to="/forgot-password"
                            className="text-sm"
                            style={{ color: 'var(--color-primary)' }}
                        >
                            Forgot Password?
                        </Link>
                    </div>

                    <Button
                        type="submit"
                        fullWidth
                        isLoading={isLoading}
                    >
                        Sign In
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Don't have an account?{' '}
                    <Link
                        to="/register"
                        className="font-medium"
                        style={{ color: 'var(--color-primary)' }}
                    >
                        Create Account
                    </Link>
                </div>
            </Card>
        </div>
    );
};
