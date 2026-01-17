import React from 'react';
import { Outlet } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export const AuthLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Brand Section */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-green-200">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">VTPay</h1>
                    <p className="text-gray-500 mt-2 text-sm font-medium">Secure Payment Gateway & Virtual Accounts</p>
                </div>

                {/* Auth Content */}
                <Outlet />

                {/* Footer */}
                <p className="text-center text-xs text-gray-400 mt-8 font-medium">
                    © {new Date().getFullYear()} VTPay. Protected by enterprise-grade security.
                </p>
            </div>
        </div>
    );
};
