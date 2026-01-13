import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import LogsPage from '../../components/logs/LogsPage';
import { getLogs } from 'api/superAdminApi';

type LogType = 'audit' | 'api' | 'error' | 'security' | 'payment';

const ConsolidatedLogs = () => {
    const [activeTab, setActiveTab] = useState<LogType>('audit');
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, [activeTab]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await getLogs(activeTab);
            if (response.data.success) {
                const mappedLogs = response.data.data.logs.map((l: any) => ({
                    id: l._id,
                    timestamp: new Date(l.created_at).toLocaleString(),
                    level: l.level || 'info',
                    action: l.action,
                    user: l.user_email || 'System',
                    ipAddress: l.ip_address || 'N/A',
                    details: l.details,
                    endpoint: l.endpoint,
                    statusCode: l.status_code,
                }));
                setLogs(mappedLogs);
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActiveLogs = () => {
        return logs;
    };

    const getActiveTitle = () => {
        switch (activeTab) {
            case 'audit': return 'Audit Logs';
            case 'api': return 'API Logs';
            case 'error': return 'Error Logs';
            case 'security': return 'Security Logs';
            case 'payment': return 'Payment Logs';
            default: return 'Audit Logs';
        }
    };

    const getActiveDescription = () => {
        switch (activeTab) {
            case 'audit': return 'Complete audit trail of all user and admin activities';
            case 'api': return 'Monitor all API requests made by users\' applications';
            case 'error': return 'View system errors, provider errors, and application issues';
            case 'security': return 'Track security events, failed logins, and suspicious activities';
            case 'payment': return 'Detailed history of all payment processing events';
            default: return '';
        }
    };

    const getActiveIcon = () => {
        switch (activeTab) {
            case 'audit': return 'solar:document-text-bold';
            case 'api': return 'solar:code-bold';
            case 'error': return 'solar:danger-circle-bold';
            case 'security': return 'solar:shield-bold';
            case 'payment': return 'solar:card-bold';
            default: return 'solar:document-text-bold';
        }
    };

    const tabs: { id: LogType, label: string, icon: string }[] = [
        { id: 'audit', label: 'Audit', icon: 'solar:document-text-bold' },
        { id: 'api', label: 'API', icon: 'solar:code-bold' },
        { id: 'error', label: 'Errors', icon: 'solar:danger-circle-bold' },
        { id: 'security', label: 'Security', icon: 'solar:shield-bold' },
        { id: 'payment', label: 'Payments', icon: 'solar:card-bold' },
    ];

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-200 ${activeTab === tab.id
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                    >
                        <Icon icon={tab.icon} width="20" />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Logs Content */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <LogsPage
                    title={getActiveTitle()}
                    description={getActiveDescription()}
                    logs={getActiveLogs() as any}
                    icon={getActiveIcon()}
                />
            </div>
        </div>
    );
};

export default ConsolidatedLogs;
