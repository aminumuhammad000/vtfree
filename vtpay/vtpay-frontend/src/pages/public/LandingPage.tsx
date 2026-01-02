import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Book, Shield, Zap, Globe } from 'lucide-react';

export const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900">
            {/* Navigation */}
            <nav className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                                V
                            </div>
                            <span className="text-xl font-bold tracking-tight">VTPay</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                                Log in
                            </Link>
                            <Link
                                to="/register"
                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm hover:shadow-md"
                            >
                                Create Account
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-grow">
                <div className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-8 leading-tight">
                            Payments infrastructure <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                                for the internet
                            </span>
                        </h1>
                        <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600 mb-10 leading-relaxed">
                            Millions of companies of all sizes—from startups to Fortune 500s—use
                            VTPay's software and APIs to accept payments, send payouts, and
                            manage their businesses online.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                to="/register"
                                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-green-600 hover:bg-green-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                            >
                                Start now <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                            <Link
                                to="/api-docs"
                                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 border border-gray-200 text-lg font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all shadow-sm hover:shadow-md hover:-translate-y-1 group"
                            >
                                <Book className="mr-2 h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                                Read the docs
                            </Link>
                        </div>
                    </div>

                    {/* Background decoration */}
                    <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full overflow-hidden -z-10 pointer-events-none">
                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-green-100/50 blur-3xl opacity-60 mix-blend-multiply filter"></div>
                        <div className="absolute top-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-emerald-100/50 blur-3xl opacity-60 mix-blend-multiply filter"></div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="bg-gray-50 py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6 text-green-600">
                                    <Zap className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Fast Integration</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Get up and running in minutes with our easy-to-use libraries and SDKs.
                                    Designed for developers, by developers.
                                </p>
                            </div>
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                                    <Shield className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Secure by Default</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    We handle the complexity of compliance and security so you can focus
                                    on building your product. PCI-DSS compliant.
                                </p>
                            </div>
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 text-purple-600">
                                    <Globe className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Global Scale</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Accept payments from anywhere in the world. Support for multiple
                                    currencies and payment methods out of the box.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-100 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 font-bold text-xs">
                            V
                        </div>
                        <span className="text-gray-500 font-medium">© 2025 VTPay Inc.</span>
                    </div>
                    <div className="flex gap-8">
                        <Link to="/api-docs" className="text-gray-500 hover:text-green-600 transition-colors">API Reference</Link>
                        <a href="#" className="text-gray-500 hover:text-green-600 transition-colors">Support</a>
                        <a href="#" className="text-gray-500 hover:text-green-600 transition-colors">Terms</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};
