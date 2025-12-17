import { useState } from 'react';
import { Icon } from '@iconify/react';

interface Plan {
    id: string;
    name: string;
    description: string;
    monthlyPrice: number;
    annualPrice: number;
    features: string[];
    isPopular?: boolean;
    maxUsers?: number;
    maxApps?: number;
}

const PricingPlans = () => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

    const plans: Plan[] = [
        {
            id: 'starter',
            name: 'Starter',
            description: 'Perfect for individuals and small projects',
            monthlyPrice: 0,
            annualPrice: 0,
            maxUsers: 100,
            maxApps: 1,
            features: [
                'Up to 100 users',
                '1 application',
                'Basic API access',
                'Email support',
                '99.5% uptime SLA',
                'Standard security',
            ],
        },
        {
            id: 'professional',
            name: 'Professional',
            description: 'For growing businesses and teams',
            monthlyPrice: 49,
            annualPrice: 470,
            maxUsers: 1000,
            maxApps: 5,
            isPopular: true,
            features: [
                'Up to 1,000 users',
                'Up to 5 applications',
                'Full API access',
                'Priority email support',
                '99.9% uptime SLA',
                'Advanced security features',
                'Custom branding',
                'Analytics dashboard',
            ],
        },
        {
            id: 'business',
            name: 'Business',
            description: 'For large enterprises with advanced needs',
            monthlyPrice: 149,
            annualPrice: 1430,
            maxUsers: 10000,
            maxApps: 20,
            features: [
                'Up to 10,000 users',
                'Up to 20 applications',
                'Unlimited API access',
                '24/7 phone & email support',
                '99.95% uptime SLA',
                'Enterprise security suite',
                'White-label solution',
                'Advanced analytics',
                'Dedicated account manager',
                'Custom integrations',
            ],
        },
        {
            id: 'enterprise',
            name: 'Enterprise',
            description: 'Unlimited scale with custom solutions',
            monthlyPrice: 0,
            annualPrice: 0,
            features: [
                'Unlimited users',
                'Unlimited applications',
                'Custom API limits',
                'Dedicated support team',
                '99.99% uptime SLA',
                'Custom security policies',
                'Full white-label',
                'Custom reporting',
                'On-premise deployment option',
                'SLA guarantees',
                'Custom contracts',
            ],
        },
    ];

    const getPrice = (plan: Plan) => {
        if (plan.id === 'enterprise') return 'Custom';
        const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
        return price === 0 ? 'Free' : `₦${price.toLocaleString('en-NG')}`;
    };

    const getSavings = (plan: Plan) => {
        if (plan.id === 'starter' || plan.id === 'enterprise') return null;
        const monthlyCost = plan.monthlyPrice * 12;
        const annualCost = plan.annualPrice;
        const savings = monthlyCost - annualCost;
        const percentage = Math.round((savings / monthlyCost) * 100);
        return { amount: savings, percentage };
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-4xl font-bold text-slate-900 mb-4">
                    Pricing & Plans
                </h1>
                <p className="text-lg text-slate-600">
                    Choose the perfect plan for your business needs. All plans include core features with flexible scaling options.
                </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
                <span className={`text-sm font-semibold ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-500'}`}>
                    Monthly
                </span>
                <button
                    onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 ${billingCycle === 'annual' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-slate-300'
                        }`}
                >
                    <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${billingCycle === 'annual' ? 'translate-x-7' : 'translate-x-1'
                            }`}
                    />
                </button>
                <span className={`text-sm font-semibold ${billingCycle === 'annual' ? 'text-slate-900' : 'text-slate-500'}`}>
                    Annual
                </span>
                {billingCycle === 'annual' && (
                    <span className="ml-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold">
                        Save up to 20%
                    </span>
                )}
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {plans.map((plan) => {
                    const savings = billingCycle === 'annual' ? getSavings(plan) : null;
                    return (
                        <div
                            key={plan.id}
                            className={`relative bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${plan.isPopular
                                    ? 'border-emerald-500 scale-105'
                                    : 'border-slate-100'
                                }`}
                        >
                            {/* Popular Badge */}
                            {plan.isPopular && (
                                <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-1 text-xs font-bold rounded-bl-xl">
                                    MOST POPULAR
                                </div>
                            )}

                            {/* Gradient Top Bar */}
                            <div className={`h-2 bg-gradient-to-r ${plan.id === 'starter' ? 'from-blue-500 to-cyan-600' :
                                    plan.id === 'professional' ? 'from-emerald-500 to-teal-600' :
                                        plan.id === 'business' ? 'from-purple-500 to-pink-600' :
                                            'from-amber-500 to-orange-600'
                                }`} />

                            <div className="p-6">
                                {/* Plan Name & Description */}
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                                    {plan.name}
                                </h3>
                                <p className="text-sm text-slate-600 mb-6">
                                    {plan.description}
                                </p>

                                {/* Price */}
                                <div className="mb-6">
                                    <div className="flex items-baseline gap-1 mb-2">
                                        <span className="text-4xl font-extrabold text-slate-900">
                                            {getPrice(plan)}
                                        </span>
                                        {plan.id !== 'enterprise' && plan.id !== 'starter' && (
                                            <span className="text-slate-600 text-sm">
                                                /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                                            </span>
                                        )}
                                    </div>
                                    {savings && (
                                        <p className="text-xs text-emerald-600 font-semibold">
                                            Save ₦{savings.amount.toLocaleString('en-NG')} ({savings.percentage}%)
                                        </p>
                                    )}
                                </div>

                                {/* CTA Button */}
                                <button className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 mb-6 ${plan.isPopular
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg hover:scale-105'
                                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                                    }`}>
                                    {plan.id === 'enterprise' ? 'Contact Sales' : 'Get Started'}
                                </button>

                                {/* Features */}
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        What's included:
                                    </p>
                                    {plan.features.map((feature, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <Icon
                                                icon="solar:check-circle-bold"
                                                className="text-emerald-600 flex-shrink-0 mt-0.5"
                                                width="18"
                                            />
                                            <span className="text-sm text-slate-700">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Enterprise Contact Section */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 text-white text-center">
                <h2 className="text-3xl font-bold mb-3">Need a Custom Solution?</h2>
                <p className="text-lg mb-6 text-emerald-50">
                    Get in touch with our sales team to discuss enterprise plans, volume discounts, and custom implementations.
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                    <button className="px-8 py-3 bg-white text-emerald-600 font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300">
                        Contact Sales
                    </button>
                    <button className="px-8 py-3 bg-emerald-600/30 backdrop-blur-sm text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-emerald-600/40 transition-all duration-300">
                        Schedule Demo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PricingPlans;
