import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { ArrowLeft, Code, Copy, Check, Shield, Globe, Zap, Bell } from 'lucide-react';

export const ApiDocs: React.FC = () => {
    const [copied, setCopied] = React.useState('');

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(''), 2000);
    };

    const CodeBlock = ({ code, id }: { code: string, id: string }) => (
        <div className="relative group mt-4">
            <button
                onClick={() => copyToClipboard(code, id)}
                className="absolute right-4 top-4 p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            >
                {copied === id ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            </button>
            <pre className="bg-slate-900 text-slate-300 p-6 rounded-2xl overflow-x-auto font-mono text-sm border border-slate-800 shadow-xl">
                <code>{code}</code>
            </pre>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <ArrowLeft size={20} className="text-slate-600" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                                <Code size={24} className="text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">VTPay API Documentation</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/login">
                            <Button variant="outline" size="sm">Sign In</Button>
                        </Link>
                        <Link to="/register">
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">Get API Keys</Button>
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">
                {/* Sidebar */}
                <aside className="lg:w-64 flex-shrink-0">
                    <nav className="sticky top-32 space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-4">Getting Started</p>
                        <a href="#introduction" className="flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-white hover:text-emerald-600 rounded-xl transition-all font-medium">
                            <Globe size={18} /> Introduction
                        </a>
                        <a href="#authentication" className="flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-white hover:text-emerald-600 rounded-xl transition-all font-medium">
                            <Shield size={18} /> Authentication
                        </a>
                        <a href="#base-url" className="flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-white hover:text-emerald-600 rounded-xl transition-all font-medium">
                            <Zap size={18} /> Base URL
                        </a>

                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-8 mb-4 px-4">Endpoints</p>
                        <a href="#supported-banks" className="block px-4 py-2 text-sm text-slate-600 hover:text-emerald-600 font-medium">Supported Banks</a>
                        <a href="#create-account" className="block px-4 py-2 text-sm text-slate-600 hover:text-emerald-600 font-medium">Create Virtual Account</a>
                        <a href="#list-accounts" className="block px-4 py-2 text-sm text-slate-600 hover:text-emerald-600 font-medium">List Virtual Accounts</a>
                        <a href="#get-balance" className="block px-4 py-2 text-sm text-slate-600 hover:text-emerald-600 font-medium">Check Balance</a>
                        <a href="#zainbox" className="block px-4 py-2 text-sm text-slate-600 hover:text-emerald-600 font-medium">Zainbox Management</a>

                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-8 mb-4 px-4">Notifications</p>
                        <a href="#webhooks" className="flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-white hover:text-emerald-600 rounded-xl transition-all font-medium">
                            <Bell size={18} /> Webhooks
                        </a>
                    </nav>
                </aside>

                {/* Content */}
                <main className="flex-1 max-w-3xl space-y-20">
                    <section id="introduction" className="scroll-mt-32">
                        <h2 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight">Introduction</h2>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            Welcome to the VTPay API. Our platform provides a robust set of tools for developers to integrate
                            seamless payment processing, virtual account management, and automated wallet systems into their applications.
                        </p>
                        <div className="mt-8 p-6 bg-emerald-50 border border-emerald-100 rounded-2xl">
                            <p className="text-emerald-800 font-medium">
                                💡 VTPay is designed for high-performance fintech applications, offering 99.9% uptime and instant transaction notifications.
                            </p>
                        </div>
                    </section>

                    <section id="authentication" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Authentication</h2>
                        <p className="text-slate-600 mb-6">
                            Authenticate your requests by including your Secret Key in the <code className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-600 font-mono">Authorization</code> header as a Bearer token.
                        </p>
                        <CodeBlock
                            id="auth"
                            code={`Authorization: Bearer sk_live_xxxxxxxxxxxxxxxxxxxx`}
                        />
                        <p className="mt-4 text-sm text-slate-500">
                            Never share your secret keys in client-side code or public repositories.
                        </p>
                    </section>

                    <section id="base-url" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Base URL</h2>
                        <p className="text-slate-600 mb-4">All API requests should be made to our production endpoint:</p>
                        <CodeBlock
                            id="base-url"
                            code={`https://api.vtpay.com/api`}
                        />
                    </section>

                    <section id="endpoints" className="space-y-16">
                        <div id="supported-banks" className="scroll-mt-32">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase">GET</span>
                                <h3 className="text-2xl font-bold text-slate-900">Get Supported Banks</h3>
                            </div>
                            <p className="text-slate-600 mb-6">Retrieve a list of banks supported for virtual account creation.</p>
                            <code className="block bg-slate-100 p-3 rounded-xl font-mono text-sm text-slate-700 mb-4">/virtual-accounts/supported-banks</code>
                            <CodeBlock
                                id="res-banks"
                                code={`{
  "success": true,
  "data": [
    { "bankCode": "058", "bankName": "GTBank" },
    { "bankCode": "011", "bankName": "First Bank" }
  ]
}`}
                            />
                        </div>

                        <div id="create-account" className="scroll-mt-32">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded uppercase">POST</span>
                                <h3 className="text-2xl font-bold text-slate-900">Create Virtual Account</h3>
                            </div>
                            <p className="text-slate-600 mb-6">Generate a new dedicated virtual account for a customer.</p>
                            <code className="block bg-slate-100 p-3 rounded-xl font-mono text-sm text-slate-700 mb-4">/virtual-accounts</code>
                            <h4 className="font-bold text-slate-800 mt-6 mb-2">Request Body</h4>
                            <CodeBlock
                                id="req-create"
                                code={`{
  "bankType": "gtBank",
  "accountName": "Customer Name",
  "email": "customer@example.com",
  "reference": "unique_ref_001"
}`}
                            />
                        </div>

                        <div id="get-balance" className="scroll-mt-32">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase">GET</span>
                                <h3 className="text-2xl font-bold text-slate-900">Check Account Balance</h3>
                            </div>
                            <p className="text-slate-600 mb-6">Fetch the current balance of a specific virtual account.</p>
                            <code className="block bg-slate-100 p-3 rounded-xl font-mono text-sm text-slate-700 mb-4">/virtual-accounts/:accountNumber/balance</code>
                            <CodeBlock
                                id="res-balance"
                                code={`{
  "success": true,
  "data": {
    "balance": 25000.50,
    "currency": "NGN"
  }
}`}
                            />
                        </div>

                        <div id="zainbox" className="scroll-mt-32">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded uppercase">POST</span>
                                <h3 className="text-2xl font-bold text-slate-900">Create Zainbox</h3>
                            </div>
                            <p className="text-slate-600 mb-6">A Zainbox is a container for multiple virtual accounts. You must create one before generating virtual accounts.</p>
                            <code className="block bg-slate-100 p-3 rounded-xl font-mono text-sm text-slate-700 mb-4">/zainbox/create</code>
                            <CodeBlock
                                id="req-zainbox"
                                code={`{
  "zainboxName": "My Business Wallet",
  "tags": "fintech, payments",
  "callbackUrl": "https://your-api.com/webhook"
}`}
                            />
                        </div>
                    </section>

                    <section id="webhooks" className="scroll-mt-32 pb-20">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Webhooks</h2>
                        <p className="text-slate-600 mb-6">
                            VTPay uses webhooks to notify your application when an event happens in your account.
                            Configure your webhook URL in the developer dashboard.
                        </p>
                        <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-2xl">
                            <h4 className="text-emerald-400 font-bold mb-4">Sample Payload</h4>
                            <pre className="text-slate-300 font-mono text-sm">
                                {`{
  "event": "payment.success",
  "data": {
    "amount": 5000,
    "reference": "unique_ref_001",
    "accountNumber": "0123456789",
    "customer": "John Doe"
  }
}`}
                            </pre>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};
