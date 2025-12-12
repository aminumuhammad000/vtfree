import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
    return (
        <div className="auth-container">
            <div className="auth-wrapper">
                {/* Brand Section */}
                <div className="auth-brand">
                    <div className="auth-brand-icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1>VTPay</h1>
                    <p>Secure Payment Gateway & Virtual Accounts</p>
                </div>

                {/* Auth Content */}
                <Outlet />

                {/* Footer */}
                <p className="auth-security-note">
                    © {new Date().getFullYear()} VTPay. Protected by enterprise-grade security.
                </p>
            </div>
        </div>
    );
};
