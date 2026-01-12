import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    Shield,
    Zap,
    Globe,
    CreditCard,
    TrendingUp,
    Lock,
    CheckCircle,
    Users,
    DollarSign,
    Activity,
    Code,
    Smartphone,
    BarChart3,
    Clock,
    Layers
} from 'lucide-react';
import '../../styles/landing.css';

export const LandingPage: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="landing-page">
            {/* Navigation */}
            <nav className={`landing-nav ${isScrolled ? 'scrolled' : ''}`}>
                <div className="landing-nav-container">
                    <div className="landing-nav-content">
                        <Link to="/" className="landing-logo">
                            <div className="landing-logo-icon">
                                <div className="landing-logo-inner">V</div>
                            </div>
                            <span className="landing-logo-text">VTPay</span>
                        </Link>
                        <div className="landing-nav-links">
                            <Link to="/api-docs" className="landing-nav-link">Documentation</Link>
                            <Link to="/login" className="landing-nav-link">Log in</Link>
                            <Link to="/register" className="landing-btn-primary">
                                Get Started
                                <ArrowRight className="landing-icon-sm" />
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="landing-hero">
                <div className="landing-hero-bg">
                    <div className="landing-hero-gradient landing-hero-gradient-1"></div>
                    <div className="landing-hero-gradient landing-hero-gradient-2"></div>
                    <div className="landing-hero-gradient landing-hero-gradient-3"></div>
                </div>

                <div className="landing-container">
                    <div className="landing-hero-content">
                        <div className="landing-hero-badge">
                            <Zap className="landing-icon-xs" />
                            <span>Trusted by 10,000+ businesses worldwide</span>
                        </div>

                        <h1 className="landing-hero-title">
                            Modern Payment Infrastructure
                            <span className="landing-gradient-text"> Built for Scale</span>
                        </h1>

                        <p className="landing-hero-subtitle">
                            Accept payments, manage virtual accounts, and scale your business with
                            enterprise-grade payment solutions. Trusted by startups to Fortune 500s.
                        </p>

                        <div className="landing-hero-cta">
                            <Link to="/register" className="landing-btn-hero">
                                Start Building
                                <ArrowRight className="landing-icon-md" />
                            </Link>
                            <Link to="/api-docs" className="landing-btn-secondary">
                                <Code className="landing-icon-md" />
                                View API Docs
                            </Link>
                        </div>

                        <div className="landing-hero-stats">
                            <div className="landing-stat-item">
                                <div className="landing-stat-value">₦500B+</div>
                                <div className="landing-stat-label">Processed</div>
                            </div>
                            <div className="landing-stat-divider"></div>
                            <div className="landing-stat-item">
                                <div className="landing-stat-value">99.99%</div>
                                <div className="landing-stat-label">Uptime</div>
                            </div>
                            <div className="landing-stat-divider"></div>
                            <div className="landing-stat-item">
                                <div className="landing-stat-value">150+</div>
                                <div className="landing-stat-label">Countries</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="landing-features">
                <div className="landing-container">
                    <div className="landing-section-header">
                        <h2 className="landing-section-title">Everything you need to accept payments</h2>
                        <p className="landing-section-subtitle">
                            Built for developers, designed for everyone. Our platform grows with your business.
                        </p>
                    </div>

                    <div className="landing-features-grid">
                        <div className="landing-feature-card">
                            <div className="landing-feature-icon landing-icon-green">
                                <CreditCard />
                            </div>
                            <h3 className="landing-feature-title">Virtual Accounts</h3>
                            <p className="landing-feature-description">
                                Create and manage unlimited virtual accounts for your customers.
                                Instant setup, real-time notifications.
                            </p>
                            <ul className="landing-feature-list">
                                <li><CheckCircle className="landing-icon-xs" /> Instant account creation</li>
                                <li><CheckCircle className="landing-icon-xs" /> Real-time webhooks</li>
                                <li><CheckCircle className="landing-icon-xs" /> Automated reconciliation</li>
                            </ul>
                        </div>

                        <div className="landing-feature-card">
                            <div className="landing-feature-icon landing-icon-blue">
                                <Shield />
                            </div>
                            <h3 className="landing-feature-title">Bank-Grade Security</h3>
                            <p className="landing-feature-description">
                                Enterprise-level security with PCI-DSS compliance, encryption,
                                and fraud detection built-in.
                            </p>
                            <ul className="landing-feature-list">
                                <li><CheckCircle className="landing-icon-xs" /> 256-bit encryption</li>
                                <li><CheckCircle className="landing-icon-xs" /> PCI-DSS Level 1</li>
                                <li><CheckCircle className="landing-icon-xs" /> Real-time fraud detection</li>
                            </ul>
                        </div>

                        <div className="landing-feature-card">
                            <div className="landing-feature-icon landing-icon-purple">
                                <Zap />
                            </div>
                            <h3 className="landing-feature-title">Lightning Fast</h3>
                            <p className="landing-feature-description">
                                Process payments in milliseconds with our optimized infrastructure
                                and global CDN.
                            </p>
                            <ul className="landing-feature-list">
                                <li><CheckCircle className="landing-icon-xs" /> Sub-second processing</li>
                                <li><CheckCircle className="landing-icon-xs" /> 99.99% uptime SLA</li>
                                <li><CheckCircle className="landing-icon-xs" /> Global infrastructure</li>
                            </ul>
                        </div>

                        <div className="landing-feature-card">
                            <div className="landing-feature-icon landing-icon-orange">
                                <BarChart3 />
                            </div>
                            <h3 className="landing-feature-title">Advanced Analytics</h3>
                            <p className="landing-feature-description">
                                Get deep insights into your payment flows with comprehensive
                                analytics and reporting.
                            </p>
                            <ul className="landing-feature-list">
                                <li><CheckCircle className="landing-icon-xs" /> Real-time dashboards</li>
                                <li><CheckCircle className="landing-icon-xs" /> Custom reports</li>
                                <li><CheckCircle className="landing-icon-xs" /> Export capabilities</li>
                            </ul>
                        </div>

                        <div className="landing-feature-card">
                            <div className="landing-feature-icon landing-icon-teal">
                                <Code />
                            </div>
                            <h3 className="landing-feature-title">Developer First</h3>
                            <p className="landing-feature-description">
                                Beautiful APIs, comprehensive SDKs, and detailed documentation
                                to get you started in minutes.
                            </p>
                            <ul className="landing-feature-list">
                                <li><CheckCircle className="landing-icon-xs" /> RESTful APIs</li>
                                <li><CheckCircle className="landing-icon-xs" /> Multiple SDKs</li>
                                <li><CheckCircle className="landing-icon-xs" /> Interactive docs</li>
                            </ul>
                        </div>

                        <div className="landing-feature-card">
                            <div className="landing-feature-icon landing-icon-pink">
                                <Smartphone />
                            </div>
                            <h3 className="landing-feature-title">Mobile Ready</h3>
                            <p className="landing-feature-description">
                                Seamless mobile experience with native SDKs for iOS and Android.
                                Build once, deploy everywhere.
                            </p>
                            <ul className="landing-feature-list">
                                <li><CheckCircle className="landing-icon-xs" /> Native SDKs</li>
                                <li><CheckCircle className="landing-icon-xs" /> Responsive design</li>
                                <li><CheckCircle className="landing-icon-xs" /> Touch-optimized</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="landing-stats-section">
                <div className="landing-container">
                    <div className="landing-stats-grid">
                        <div className="landing-stats-card">
                            <div className="landing-stats-icon">
                                <Users />
                            </div>
                            <div className="landing-stats-value">10,000+</div>
                            <div className="landing-stats-label">Active Businesses</div>
                        </div>

                        <div className="landing-stats-card">
                            <div className="landing-stats-icon">
                                <DollarSign />
                            </div>
                            <div className="landing-stats-value">₦500B+</div>
                            <div className="landing-stats-label">Processed Annually</div>
                        </div>

                        <div className="landing-stats-card">
                            <div className="landing-stats-icon">
                                <Globe />
                            </div>
                            <div className="landing-stats-value">150+</div>
                            <div className="landing-stats-label">Countries Supported</div>
                        </div>

                        <div className="landing-stats-card">
                            <div className="landing-stats-icon">
                                <Activity />
                            </div>
                            <div className="landing-stats-value">99.99%</div>
                            <div className="landing-stats-label">Uptime Guarantee</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="landing-how-it-works">
                <div className="landing-container">
                    <div className="landing-section-header">
                        <h2 className="landing-section-title">Get started in minutes</h2>
                        <p className="landing-section-subtitle">
                            Three simple steps to start accepting payments
                        </p>
                    </div>

                    <div className="landing-steps">
                        <div className="landing-step">
                            <div className="landing-step-number">1</div>
                            <div className="landing-step-content">
                                <h3 className="landing-step-title">Create Your Account</h3>
                                <p className="landing-step-description">
                                    Sign up in seconds and get instant access to your dashboard.
                                    No credit card required.
                                </p>
                            </div>
                            <div className="landing-step-icon">
                                <Users />
                            </div>
                        </div>

                        <div className="landing-step-connector"></div>

                        <div className="landing-step">
                            <div className="landing-step-number">2</div>
                            <div className="landing-step-content">
                                <h3 className="landing-step-title">Integrate the API</h3>
                                <p className="landing-step-description">
                                    Use our SDKs and comprehensive documentation to integrate
                                    payments in minutes.
                                </p>
                            </div>
                            <div className="landing-step-icon">
                                <Code />
                            </div>
                        </div>

                        <div className="landing-step-connector"></div>

                        <div className="landing-step">
                            <div className="landing-step-number">3</div>
                            <div className="landing-step-content">
                                <h3 className="landing-step-title">Start Accepting Payments</h3>
                                <p className="landing-step-description">
                                    Go live and start processing payments with real-time
                                    notifications and webhooks.
                                </p>
                            </div>
                            <div className="landing-step-icon">
                                <TrendingUp />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Section */}
            <section className="landing-trust">
                <div className="landing-container">
                    <div className="landing-trust-content">
                        <h2 className="landing-trust-title">Trusted by industry leaders</h2>
                        <div className="landing-trust-features">
                            <div className="landing-trust-item">
                                <Lock className="landing-icon-md" />
                                <div>
                                    <h4>Bank-Grade Security</h4>
                                    <p>PCI-DSS Level 1 certified</p>
                                </div>
                            </div>
                            <div className="landing-trust-item">
                                <Shield className="landing-icon-md" />
                                <div>
                                    <h4>Data Protection</h4>
                                    <p>256-bit encryption standard</p>
                                </div>
                            </div>
                            <div className="landing-trust-item">
                                <Clock className="landing-icon-md" />
                                <div>
                                    <h4>24/7 Monitoring</h4>
                                    <p>Real-time fraud detection</p>
                                </div>
                            </div>
                            <div className="landing-trust-item">
                                <Layers className="landing-icon-md" />
                                <div>
                                    <h4>Compliance</h4>
                                    <p>Fully regulated and licensed</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="landing-cta">
                <div className="landing-container">
                    <div className="landing-cta-card">
                        <div className="landing-cta-bg">
                            <div className="landing-cta-gradient landing-cta-gradient-1"></div>
                            <div className="landing-cta-gradient landing-cta-gradient-2"></div>
                        </div>
                        <div className="landing-cta-content">
                            <h2 className="landing-cta-title">Ready to get started?</h2>
                            <p className="landing-cta-subtitle">
                                Join thousands of businesses already using VTPay to power their payments
                            </p>
                            <div className="landing-cta-buttons">
                                <Link to="/register" className="landing-btn-cta">
                                    Create Free Account
                                    <ArrowRight className="landing-icon-md" />
                                </Link>
                                <Link to="/api-docs" className="landing-btn-cta-secondary">
                                    Read Documentation
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="landing-container">
                    <div className="landing-footer-content">
                        <div className="landing-footer-brand">
                            <div className="landing-footer-logo">
                                <div className="landing-logo-icon">
                                    <div className="landing-logo-inner">V</div>
                                </div>
                                <span className="landing-logo-text">VTPay</span>
                            </div>
                            <p className="landing-footer-tagline">
                                Modern payment infrastructure for the internet
                            </p>
                        </div>

                        <div className="landing-footer-section">
                            <h4>Product</h4>
                            <Link to="/api-docs">API Reference</Link>
                            <a href="#">Pricing</a>
                            <a href="#">Features</a>
                        </div>

                        <div className="landing-footer-section">
                            <h4>Company</h4>
                            <a href="#">About</a>
                            <a href="#">Blog</a>
                            <a href="#">Careers</a>
                        </div>

                        <div className="landing-footer-section">
                            <h4>Support</h4>
                            <a href="#">Help Center</a>
                            <a href="#">Contact</a>
                            <a href="#">Status</a>
                        </div>

                        <div className="landing-footer-section">
                            <h4>Legal</h4>
                            <a href="#">Privacy</a>
                            <a href="#">Terms</a>
                            <a href="#">Security</a>
                        </div>
                    </div>

                    <div className="landing-footer-bottom">
                        <p>© 2025 VTPay Inc. All rights reserved.</p>
                        <div className="landing-footer-social">
                            <a href="#" aria-label="Twitter">Twitter</a>
                            <a href="#" aria-label="LinkedIn">LinkedIn</a>
                            <a href="#" aria-label="GitHub">GitHub</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
