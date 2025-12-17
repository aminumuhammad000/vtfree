import React from 'react';
import { Icon } from '@iconify/react';

interface StatsCardProps {
    label: string;
    value: number | string;
    icon: string;
    bgGradient: string;
    lightBg: string;
    textColor: string;
    isCurrency?: boolean;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

const StatsCard: React.FC<StatsCardProps> = ({
    label,
    value,
    icon,
    bgGradient,
    lightBg,
    textColor,
    isCurrency,
    trend,
}) => {
    return (
        <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 overflow-hidden transition-all duration-300 hover:-translate-y-1">
            {/* Gradient accent bar at top */}
            <div className={`h-2 bg-gradient-to-r ${bgGradient}`}></div>

            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    {/* Icon with gradient background */}
                    <div className={`relative ${lightBg} p-4 rounded-xl ${textColor} group-hover:scale-110 transition-transform duration-300`}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300`}></div>
                        <div className="relative">
                            <Icon icon={icon} width="28" height="28" />
                        </div>
                    </div>

                    {/* Trend Badge */}
                    {trend && (
                        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${trend.isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                            }`}>
                            <Icon
                                icon={trend.isPositive ? 'solar:arrow-up-bold' : 'solar:arrow-down-bold'}
                                width="14"
                                height="14"
                            />
                            <span>{Math.abs(trend.value)}%</span>
                        </div>
                    )}
                </div>

                {/* Value and Label */}
                <div className="space-y-2">
                    <p className="text-4xl font-extrabold text-slate-900 tracking-tight">
                        {isCurrency && typeof value === 'number'
                            ? `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                            : typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                    <p className={`text-sm font-semibold ${textColor} uppercase tracking-wide`}>{label}</p>
                </div>

                {/* Decorative gradient orb */}
                <div className={`absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-br ${bgGradient} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity duration-500`}></div>
            </div>
        </div>
    );
};

export default StatsCard;
