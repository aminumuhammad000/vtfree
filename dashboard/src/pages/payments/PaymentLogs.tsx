import React from 'react';
import Layout from '../../components/Layout';

const PaymentLogs: React.FC = () => {
    return (
        <Layout>
            <div className="p-6 space-y-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Logs</h1>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
                    Payment Logs module coming soon...
                </div>
            </div>
        </Layout>
    );
};

export default PaymentLogs;
