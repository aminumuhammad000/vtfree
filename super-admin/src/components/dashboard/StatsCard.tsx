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
}

const StatsCard: React.FC<StatsCardProps> = ({
    label,
    value,
    icon,
    bgGradient,
    lightBg,
    textColor,
    isCurrency,
}) => {
    return (
        <div className="group relative bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden hover-lift">
            {/* Gradient accent bar at top */}
            <div className={`h-1.5 bg-gradient-to-r ${bgGradient}`}></div>

            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    {/* Icon with gradient background and glow */}
                    <div className={`relative ${lightBg} p-4 rounded-xl ${textColor} group-hover:scale-110 transition-transform duration-300`}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300`}></div>
                        <div className="relative">
                            <Icon icon={icon} width="24" height="24" />
                        </div>
                    </div>

                    {/* Badge */}
                    <span className={`text-xs font-bold ${textColor} ${lightBg} px-3 py-1.5 rounded-full opacity-80`}>
                        Live
                    </span>
                </div>

                {/* Value and Label */}
                <div className="space-y-2">
                    <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {isCurrency && typeof value === 'number'
                            ? `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
