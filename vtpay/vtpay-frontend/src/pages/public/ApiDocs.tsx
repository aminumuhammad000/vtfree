import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { ArrowLeft, Code, Copy, Check } from 'lucide-react';

export const ApiDocs: React.FC = () => {
    const [copied, setCopied] = React.useState('');

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(''), 2000);
    };

    const CodeBlock = ({ code, id }: { code: string, id: string }) => (
        <div className="code-block-container">
            <button
                onClick={() => copyToClipboard(code, id)}
                className="code-block-copy-btn"
            >
                {copied === id ? <Check size={16} /> : <Copy size={16} />}
            </button>
            <pre className="code-block-pre">
                <code>{code}</code>
            </pre>
        </div>
    );

    return (
        <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
            {/* Header */}
            <header className="api-docs-header">
                <div className="api-docs-header-content">
                    <div className="api-docs-logo">
                        <Link to="/login" style={{ color: 'var(--color-text-muted)' }}>
                            <ArrowLeft size={20} />
                        </Link>
                        <h1>
                            <Code size={24} />
                            VTPay API Docs
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <Link to="/login">
                            <Button variant="outline" size="sm">Login</Button>
                        </Link>
                        <Link to="/register">
                            <Button size="sm">Get API Keys</Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="api-docs-content">
                <section className="api-docs-section">
                    <h2>Introduction</h2>
                    <p>
                        Welcome to the VTPay API documentation. Our API allows you to integrate virtual accounts,
                        wallet management, and payment processing directly into your application.
                    </p>
                </section>

                <section className="api-docs-section">
                    <h2 className="sub">Authentication</h2>
                    <p>
                        All API requests must be authenticated using a Bearer Token. You can obtain this token
                        by logging in or registering a new account.
                    </p>
                    <CodeBlock
                        id="auth"
                        code={`Authorization: Bearer <your_access_token>`}
                    />
                </section>

                <section className="api-docs-section">
                    <h2 className="sub">Base URL</h2>
                    <CodeBlock
                        id="base-url"
                        code={`https://api.vtpay.com/api`}
                    />
                </section>

                <section className="api-docs-section">
                    <h2 className="sub">Endpoints</h2>

                    <div className="page-container gap-8">
                        {/* Endpoint 1 */}
                        <div className="api-endpoint-card">
                            <div className="api-endpoint-header">
                                <span className="api-method-badge api-method-post">POST</span>
                                <code className="api-endpoint-path">/virtual-accounts</code>
                            </div>
                            <p className="api-endpoint-description">Create a new virtual account for receiving payments.</p>

                            <h4 className="font-semibold mb-2">Request Body</h4>
                            <CodeBlock
                                id="req-1"
                                code={`{
  "bankType": "gtBank",
  "bvn": "12345678901" // Optional
}`}
                            />

                            <h4 className="font-semibold mb-2">Response</h4>
                            <CodeBlock
                                id="res-1"
                                code={`{
  "success": true,
  "message": "Virtual account created successfully",
  "data": {
    "accountNumber": "0123456789",
    "accountName": "John Doe",
    "bankName": "GTBank",
    "status": "active"
  }
}`}
                            />
                        </div>

                        {/* Endpoint 2 */}
                        <div className="api-endpoint-card">
                            <div className="api-endpoint-header">
                                <span className="api-method-badge api-method-get">GET</span>
                                <code className="api-endpoint-path">/wallet</code>
                            </div>
                            <p className="api-endpoint-description">Retrieve current wallet balance and details.</p>

                            <h4 className="font-semibold mb-2">Response</h4>
                            <CodeBlock
                                id="res-2"
                                code={`{
  "success": true,
  "data": {
    "balance": 500000, // in kobo
    "balanceNaira": 5000.00,
    "currency": "NGN"
  }
}`}
                            />
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};
