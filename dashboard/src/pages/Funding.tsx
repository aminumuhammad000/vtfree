import React from 'react';
import Layout from '../components/Layout';
import FundingPanel from '../components/finance/FundingPanel';

const Funding: React.FC = () => {
    return (
        <Layout>
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-2 tracking-tight">Funding & Balances</h1>
                            <p className="text-sm sm:text-lg text-slate-600 font-medium">Manage provider balances and withdrawal accounts</p>
                        </div>
                        <div className="hidden sm:block">
                            <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg px-6 py-4 text-white overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
                                <div className="relative flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <svg className="w-5 h-5 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-100 opacity-80">Finance</p>
                                        <p className="text-lg font-black">System Liquidity</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <FundingPanel />
                </div>
            </div>
        </Layout>
    );
};

export default Funding;
