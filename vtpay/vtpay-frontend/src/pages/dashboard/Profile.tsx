import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { User, Mail, Phone, Camera, Briefcase, Lock, Shield, CheckCircle, AlertCircle } from 'lucide-react';

export const Profile: React.FC = () => {
    const { user, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [profileData, setProfileData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        businessName: user?.businessName || '',
        phone: user?.phone || ''
    });

    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    // Update local state when user context changes
    useEffect(() => {
        if (user) {
            setProfileData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                businessName: user.businessName || '',
                phone: user.phone || ''
            });
        }
    }, [user]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            const response = await api.put('/auth/profile', profileData);
            if (response.data.success) {
                updateUser(response.data.data);
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                setIsEditing(false);
            }
        } catch (error: any) {
            console.error('Update profile error:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to update profile'
            });
        } finally {
            setIsLoading(false);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        setIsLoading(true);
        try {
            await api.put('/auth/change-password', {
                currentPassword: passwords.current,
                newPassword: passwords.new
            });
            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to update password'
            });
        } finally {
            setIsLoading(false);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-10 animate-fade-in">
            {/* Header */}
            <div className="profile-header">
                <div>
                    <h1 className="text-heading">Account Settings</h1>
                    <p className="text-body mt-1">Manage your personal info, business details, and security.</p>
                </div>
                <div className="profile-nav">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`profile-nav-btn ${activeTab === 'general' ? 'active' : ''}`}
                    >
                        General Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`profile-nav-btn ${activeTab === 'security' ? 'active' : ''}`}
                    >
                        Security
                    </button>
                </div>
            </div>

            {/* Feedback Message */}
            {message && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                    <div className="alert-icon">
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    </div>
                    <div className="alert-content">
                        <p className="font-medium">{message.text}</p>
                    </div>
                </div>
            )}

            <div className="profile-grid">
                {/* Left Sidebar - Profile Summary */}
                <div className="profile-sidebar">
                    <div className="profile-card">
                        <div className="profile-banner">
                            <div className="profile-avatar-container">
                                <div className="profile-avatar-wrapper">
                                    <div className="profile-avatar">
                                        <div className="profile-avatar-inner">
                                            {user?.firstName?.charAt(0)}
                                        </div>
                                    </div>
                                    <button className="profile-camera-btn">
                                        <Camera size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="profile-info">
                            <h2 className="profile-name">{user?.firstName} {user?.lastName}</h2>
                            <p className="profile-email">{user?.email}</p>
                            <div className="profile-badges">
                                <span className={`badge ${user?.kycLevel === 3 ? 'badge-success' : 'badge-warning'}`}>
                                    {user?.kycLevel === 3 ? 'Verified' : 'Pending Verification'}
                                </span>
                                <span className="badge badge-secondary">
                                    User
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats or Info */}
                    <div className="profile-stats-card">
                        <h3 className="profile-stats-title">Account Info</h3>
                        <div className="space-y-4">
                            <div className="profile-stat-row">
                                <span className="profile-stat-label">Member Since</span>
                                <span className="profile-stat-value">Jan 2024</span>
                            </div>
                            <div className="profile-stat-row">
                                <span className="profile-stat-label">Last Login</span>
                                <span className="profile-stat-value">Today, 10:23 AM</span>
                            </div>
                            <div className="profile-stat-row">
                                <span className="profile-stat-label">Status</span>
                                <span className={`font-medium ${user?.status === 'active' ? 'text-success' : 'text-error'}`}>
                                    {user?.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Unknown'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Content - Forms */}
                <div className="profile-main-col">
                    {activeTab === 'general' ? (
                        <div className="profile-card">
                            <div className="profile-form-header">
                                <div>
                                    <h3 className="text-subheading">Personal Information</h3>
                                    <p className="text-body text-sm">Update your personal details and business info.</p>
                                </div>
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className={`btn ${isEditing ? 'btn-secondary' : 'btn-primary'}`}
                                >
                                    {isEditing ? 'Cancel Editing' : 'Edit Details'}
                                </button>
                            </div>
                            <div className="profile-form-body">
                                <form onSubmit={handleSaveProfile} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="form-group">
                                            <label className="form-label">First Name</label>
                                            <div className="profile-input-group">
                                                <div className="profile-input-icon">
                                                    <User size={18} />
                                                </div>
                                                <input
                                                    type="text"
                                                    name="firstName"
                                                    value={profileData.firstName}
                                                    onChange={handleProfileChange}
                                                    disabled={!isEditing}
                                                    className="profile-input"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Last Name</label>
                                            <div className="profile-input-group">
                                                <div className="profile-input-icon">
                                                    <User size={18} />
                                                </div>
                                                <input
                                                    type="text"
                                                    name="lastName"
                                                    value={profileData.lastName}
                                                    onChange={handleProfileChange}
                                                    disabled={!isEditing}
                                                    className="profile-input"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Business Name</label>
                                        <div className="profile-input-group">
                                            <div className="profile-input-icon">
                                                <Briefcase size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                name="businessName"
                                                value={profileData.businessName}
                                                onChange={handleProfileChange}
                                                placeholder="Enter your business name"
                                                disabled={!isEditing}
                                                className="profile-input"
                                            />
                                        </div>
                                        <p className="text-caption mt-1">This name will appear on your invoices and transactions.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="form-group">
                                            <label className="form-label">Email Address</label>
                                            <div className="profile-input-group">
                                                <div className="profile-input-icon">
                                                    <Mail size={18} />
                                                </div>
                                                <input
                                                    type="email"
                                                    value={user?.email || ''}
                                                    disabled
                                                    className="profile-input bg-gray-50 cursor-not-allowed"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Phone Number</label>
                                            <div className="profile-input-group">
                                                <div className="profile-input-icon">
                                                    <Phone size={18} />
                                                </div>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={profileData.phone}
                                                    onChange={handleProfileChange}
                                                    disabled={!isEditing}
                                                    className="profile-input"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {isEditing && (
                                        <div className="pt-4 flex justify-end border-t border-gray-100 mt-6">
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="profile-save-btn"
                                            >
                                                {isLoading ? (
                                                    <div className="spinner"></div>
                                                ) : (
                                                    <CheckCircle size={18} />
                                                )}
                                                Save Changes
                                            </button>
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="profile-card">
                            <div className="profile-form-header">
                                <h3 className="text-subheading">Security Settings</h3>
                                <p className="text-body text-sm">Update your password and secure your account.</p>
                            </div>
                            <div className="profile-form-body">
                                <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-lg">
                                    <div className="form-group">
                                        <label className="form-label">Current Password</label>
                                        <div className="profile-input-group">
                                            <div className="profile-input-icon">
                                                <Lock size={18} />
                                            </div>
                                            <input
                                                type="password"
                                                name="current"
                                                value={passwords.current}
                                                onChange={handlePasswordChange}
                                                className="profile-input"
                                                placeholder="Enter current password"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="form-group">
                                            <label className="form-label">New Password</label>
                                            <div className="profile-input-group">
                                                <div className="profile-input-icon">
                                                    <Shield size={18} />
                                                </div>
                                                <input
                                                    type="password"
                                                    name="new"
                                                    value={passwords.new}
                                                    onChange={handlePasswordChange}
                                                    className="profile-input"
                                                    placeholder="New password"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Confirm Password</label>
                                            <div className="profile-input-group">
                                                <div className="profile-input-icon">
                                                    <Shield size={18} />
                                                </div>
                                                <input
                                                    type="password"
                                                    name="confirm"
                                                    value={passwords.confirm}
                                                    onChange={handlePasswordChange}
                                                    className="profile-input"
                                                    placeholder="Confirm new password"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="profile-save-btn"
                                        >
                                            {isLoading ? (
                                                <div className="spinner"></div>
                                            ) : (
                                                <Shield size={18} />
                                            )}
                                            Update Password
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
