import { useState } from 'react';
import { Icon } from '@iconify/react';

interface Log {
    id: string;
    timestamp: string;
    level: 'info' | 'warning' | 'error' | 'success';
    action: string;
    user?: string;
    ipAddress?: string;
    details: string;
    endpoint?: string;
    statusCode?: number;
}

interface LogsPageProps {
    title: string;
    description: string;
    logs: Log[];
    icon: string;
}

const LogsPage = ({ title, description, logs, icon }: LogsPageProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterLevel, setFilterLevel] = useState<'all' | 'info' | 'warning' | 'error' | 'success'>('all');

    const filteredLogs = logs.filter((log) => {
        const matchesSearch =
            log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (log.user && log.user.toLowerCase().includes(searchQuery.toLowerCase())) ||
            log.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
        return matchesSearch && matchesLevel;
    });

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'error':
                return 'bg-red-50 text-red-600 border-red-200';
            case 'warning':
                return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'info':
                return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'success':
                return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            default:
                return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    const getLevelIcon = (level: string) => {
        switch (level) {
            case 'error':
                return 'solar:danger-circle-bold';
            case 'warning':
                return 'solar:danger-triangle-bold';
            case 'info':
                return 'solar:info-circle-bold';
            case 'success':
                return 'solar:check-circle-bold';
            default:
                return 'solar:info-circle-bold';
        }
    };

    return (
        <div className="px-6 py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
                            <Icon icon={icon} width="24" />
                        </div>
                        <h1 className="text-4xl font-bold text-slate-900">{title}</h1>
                    </div>
                    <p className="text-slate-600">{description}</p>
                </div>

                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300">
                        <Icon icon="solar:download-bold" width="20" />
                        <span>Export Logs</span>
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 font-semibold rounded-xl border-2 border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all duration-300">
                        <Icon icon="solar:refresh-bold" width="20" />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Icon
                            icon="solar:magnifer-linear"
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            width="20"
                        />
                        <input
                            type="text"
                            placeholder="Search logs by action, user, or details..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>

                    {/* Level Filter */}
                    <select
                        value={filterLevel}
                        onChange={(e) => setFilterLevel(e.target.value as any)}
                        className="px-5 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white font-semibold text-sm"
                    >
                        <option value="all">All Levels</option>
                        <option value="info">Info</option>
                        <option value="success">Success</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error</option>
                    </select>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                    <h2 className="text-2xl font-bold text-slate-900">Activity Logs</h2>
                    <p className="text-slate-600 text-sm mt-1">
                        Showing {filteredLogs.length} log entries
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Timestamp
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Level
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Action
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    User / IP
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Details
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLogs.map((log) => (
                                <tr
                                    key={log.id}
                                    className="hover:bg-slate-50 transition-colors duration-200"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Icon icon="solar:clock-circle-linear" width="16" />
                                            <span className="text-sm font-medium">{log.timestamp}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <span
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${getLevelColor(
                                                    log.level
                                                )}`}
                                            >
                                                <Icon icon={getLevelIcon(log.level)} width="14" />
                                                {log.level.charAt(0).toUpperCase() + log.level.slice(1)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-semibold text-slate-900 mb-1">
                                                {log.action}
                                            </p>
                                            {log.endpoint && (
                                                <p className="text-xs text-slate-500 font-mono">
                                                    {log.endpoint}
                                                </p>
                                            )}
                                            {log.statusCode && (
                                                <span className="text-xs text-slate-500">
                                                    Status: {log.statusCode}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            {log.user && (
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Icon icon="solar:user-linear" width="14" />
                                                    <span className="text-sm font-medium text-slate-900">
                                                        {log.user}
                                                    </span>
                                                </div>
                                            )}
                                            {log.ipAddress && (
                                                <div className="flex items-center gap-2">
                                                    <Icon icon="solar:global-linear" width="14" />
                                                    <span className="text-xs text-slate-600 font-mono">
                                                        {log.ipAddress}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-slate-600 max-w-md truncate">
                                            {log.details}
                                        </p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Empty State */}
                {filteredLogs.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                            <Icon icon="solar:document-bold" width="40" className="text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No logs found</h3>
                        <p className="text-slate-600">
                            Try adjusting your search or filter settings
                        </p>
                    </div>
                )}

                {/* Footer */}
                {filteredLogs.length > 0 && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-sm text-slate-600">
                            Showing <span className="font-semibold">{filteredLogs.length}</span> of{' '}
                            <span className="font-semibold">{logs.length}</span> log entries
                        </p>
                        <button className="text-emerald-600 font-semibold text-sm hover:text-emerald-700 transition-colors">
                            Load More →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LogsPage;
