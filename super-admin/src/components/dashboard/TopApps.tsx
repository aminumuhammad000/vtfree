import React from 'react';
import { Icon } from '@iconify/react';

interface AppStats {
    _id: string;
    app_name: string;
    total_transactions: number;
    total_revenue: number;
}

interface TopAppsProps {
    data: AppStats[];
}

const TopApps: React.FC<TopAppsProps> = ({ data }) => {
    return (
        <div className="relative bg-gradient-to-br from-white to-slate-50/50 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-slate-100 overflow-hidden group h-full">
            {/* Decorative gradient */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-purple-400/10 to-purple-600/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <Icon icon="solar:star-bold-duotone" width="20" height="20" className="text-purple-600" />
                    </div>
                    Top Performing Apps
                </h2>
                <div className="space-y-5">
                    {data.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No data available</p>
                    ) : (
                        data.map((app, index) => (
                            <div key={app._id} className="flex justify-between items-center group/item hover:bg-slate-50/50 -mx-2 px-2 py-2 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className={`
                    w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold
                    ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                            index === 1 ? 'bg-slate-100 text-slate-700' :
                                                index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'}
                  `}>
                                        {index + 1}
                                    </span>
                                    <span className="text-slate-700 font-medium">{app.app_name}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-900">₦{(app.total_revenue || 0).toLocaleString()}</p>
                                    <p className="text-xs text-slate-500">{app.total_transactions} txns</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default TopApps;
