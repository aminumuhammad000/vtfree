import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
            {/* Animated Gradient Mesh Background */}
            <div className="absolute inset-0 gradient-mesh"></div>

            {/* Floating Shapes for Visual Interest */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-green-100 rounded-full opacity-20 blur-3xl animate-float"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-50 rounded-full opacity-30 blur-3xl animate-pulse"></div>

            {/* Main Content Container */}
            <div className="relative z-10 w-full max-w-md animate-slide-up">
                {/* Header Section */}
                <div className="text-center mb-8">
                    {/* Logo with Glow Effect */}
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl glass-strong shadow-glow mb-6 animate-float hover-glow">
                        <span className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">V</span>
                    </div>

                    {/* Brand Name */}
                    <h1 className="text-4xl font-bold text-[var(--color-text)] mb-3 tracking-tight">VTPay</h1>
                    <p className="text-[var(--color-text-muted)] text-lg font-medium">
                        Secure Payment Gateway & Virtual Accounts
                    </p>

                    {/* Decorative Line */}
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <div className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--color-primary)]"></div>
                        <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse"></div>
                        <div className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--color-primary)]"></div>
                    </div>
                </div>

                {/* Auth Content Card */}
                <div>
                    <Outlet />
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-sm text-[var(--color-text-muted)] opacity-75">
                    <div className="flex items-center justify-center gap-1">
                        <span className="inline-block w-1 h-1 rounded-full bg-[var(--color-primary)] animate-pulse"></span>
                        <span>&copy; {new Date().getFullYear()} VTPay. All rights reserved.</span>
                        <span className="inline-block w-1 h-1 rounded-full bg-[var(--color-primary)] animate-pulse"></span>
                    </div>
                </div>
            </div>
        </div>
    );
};
