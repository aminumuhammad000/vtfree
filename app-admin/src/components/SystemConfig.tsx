import { useEffect, useState } from 'react';
import {
    FiEdit2,
    FiRefreshCw,
    FiSave,
    FiTrash2,
    FiX,
    FiSettings,
    FiMail,
    FiMessageSquare,
    FiCreditCard,
    FiGlobe,
    FiShield,
    FiLock,
    FiEye,
    FiEyeOff,
    FiChevronRight
} from 'react-icons/fi';
import { deleteConfig, getAllConfigs, updateConfig } from '../api/adminApi';
import { useToast } from '../hooks/ToastContext';

interface SystemConfig {
    _id: string;
    key: string;
    value: string;
    description?: string;
    group: string;
    is_editable: boolean;
    updated_at: string;
}

const SystemConfig = () => {
    const { showSuccess, showError, showWarning } = useToast();
    const [configs, setConfigs] = useState<SystemConfig[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [activeGroup, setActiveGroup] = useState<string>('ALL');
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            setLoading(true);
            const response = await getAllConfigs();
            if (response.data.success) {
                setConfigs(response.data.data);
            }
        } catch (error) {
            showError('Failed to fetch configurations');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (config: SystemConfig) => {
        setEditingKey(config.key);
        setEditValue(config.value);
    };

    const handleCancelEdit = () => {
        setEditingKey(null);
        setEditValue('');
    };

    const handleSaveEdit = async (key: string) => {
        try {
            const response = await updateConfig(key, { value: editValue });
            if (response.data.success) {
                showSuccess('Configuration updated successfully');
                setEditingKey(null);
                fetchConfigs();
            }
        } catch (error) {
            showError('Failed to update configuration');
        }
    };

    const handleDelete = async (key: string) => {
        if (key.startsWith('VTPAY_')) {
            showWarning('Default gateway configuration cannot be cleared');
            return;
        }
        if (!window.confirm(`Are you sure you want to clear the value for ${key}?`)) return;
        try {
            const response = await deleteConfig(key);
            if (response.data.success) {
                showSuccess('Configuration cleared successfully');
                fetchConfigs();
            }
        } catch (error) {
            showError('Failed to clear configuration');
        }
    };

    const toggleSecret = (key: string) => {
        setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const excludedGroups = ['EMAIL', 'PAYMENT', 'SMS', 'SYSTEM'];
    const groupedConfigs = configs.reduce((acc, config) => {
        const group = config.group || 'GENERAL';
        if (excludedGroups.includes(group.toUpperCase())) return acc;

        if (!acc[group]) acc[group] = [];
        acc[group].push(config);
        return acc;
    }, {} as Record<string, SystemConfig[]>);

    const groups = ['ALL', ...Object.keys(groupedConfigs).sort()];

    const getGroupIcon = (group: string) => {
        switch (group.toUpperCase()) {
            case 'EMAIL': return <FiMail />;
            case 'SMS': return <FiMessageSquare />;
            case 'PAYMENT': return <FiCreditCard />;
            case 'GENERAL': return <FiGlobe />;
            case 'SECURITY': return <FiShield />;
            default: return <FiSettings />;
        }
    };

    const displayedConfigs = activeGroup === 'ALL'
        ? groupedConfigs
        : { [activeGroup]: groupedConfigs[activeGroup] || [] };

    const isSecret = (key: string) => {
        const secretKeywords = ['PASSWORD', 'SECRET', 'KEY', 'TOKEN', 'AUTH'];
        return secretKeywords.some(keyword => key.toUpperCase().includes(keyword));
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2">
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">System Variables</h2>
                    <p className="text-sm sm:text-lg text-slate-500 font-medium">Global environment and operational parameters for the platform core.</p>
                </div>
                <button
                    onClick={fetchConfigs}
                    disabled={loading}
                    className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-200 rounded-[2rem] text-slate-600 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50 group"
                >
                    <FiRefreshCw className={`w-4 h-4 text-green-600 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    <span>Refresh Registry</span>
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-10">
                {/* Sidebar Navigation */}
                <div className="lg:w-80 flex-shrink-0">
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden sticky top-8">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Configuration Groups</h3>
                        </div>
                        <nav className="p-4 space-y-2">
                            {groups.map(group => (
                                <button
                                    key={group}
                                    onClick={() => setActiveGroup(group)}
                                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all group ${activeGroup === group
                                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    <span className={`text-lg ${activeGroup === group ? 'text-green-400' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                        {getGroupIcon(group)}
                                    </span>
                                    <span className="capitalize tracking-tight">{group === 'ALL' ? 'All Parameters' : group.toLowerCase()}</span>
                                    {group !== 'ALL' && (
                                        <span className={`ml-auto text-[10px] px-3 py-1 rounded-full font-black ${activeGroup === group ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {groupedConfigs[group]?.length || 0}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 space-y-10">
                    {Object.entries(displayedConfigs).map(([group, groupConfigs]) => (
                        <div key={group} className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
                            <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-green-600 text-xl">
                                        {getGroupIcon(group)}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 uppercase tracking-[0.15em] text-xs">{group}</h3>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{groupConfigs.length} Active Parameters</p>
                                    </div>
                                </div>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {groupConfigs.map(config => (
                                    <div key={config._id} className="p-8 hover:bg-slate-50/30 transition-colors group/row">
                                        <div className="flex flex-col gap-6">
                                            <div className="flex items-start justify-between gap-6">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <span className="font-mono font-black text-slate-900 text-[11px] bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                                                            {config.key}
                                                        </span>
                                                        {config.key.startsWith('VTPAY_') && (
                                                            <span className="px-3 py-1 bg-green-100 text-green-700 text-[9px] font-black rounded-full uppercase tracking-[0.15em]">
                                                                System Default
                                                            </span>
                                                        )}
                                                        {isSecret(config.key) && (
                                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 text-[9px] font-black rounded-full uppercase tracking-[0.15em]">
                                                                <FiLock className="w-3 h-3" /> Sensitive
                                                            </span>
                                                        )}
                                                    </div>
                                                    {config.description && (
                                                        <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-3xl">
                                                            {config.description}
                                                        </p>
                                                    )}
                                                </div>

                                                {config.is_editable && editingKey !== config.key && (
                                                    <div className="flex items-center gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleEdit(config)}
                                                            className="p-3 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-2xl transition-all shadow-sm bg-white border border-slate-100"
                                                            title="Edit Parameter"
                                                        >
                                                            <FiEdit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(config.key)}
                                                            className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all shadow-sm bg-white border border-slate-100"
                                                            title="Clear Value"
                                                        >
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="relative">
                                                {editingKey === config.key ? (
                                                    <div className="flex flex-col sm:flex-row gap-4 animate-in zoom-in-95 duration-300">
                                                        <input
                                                            type="text"
                                                            value={editValue}
                                                            onChange={e => setEditValue(e.target.value)}
                                                            className="flex-1 px-5 py-4 bg-white border-2 border-green-500 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 font-mono text-sm shadow-xl shadow-green-100/20"
                                                            autoFocus
                                                        />
                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={() => handleSaveEdit(config.key)}
                                                                className="flex-1 sm:flex-none px-8 py-4 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                                                            >
                                                                <FiSave className="w-4 h-4" /> Save Changes
                                                            </button>
                                                            <button
                                                                onClick={handleCancelEdit}
                                                                className="flex-1 sm:flex-none px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                                                            >
                                                                <FiX className="w-4 h-4" /> Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="relative group/value">
                                                        <div className="font-mono text-sm text-slate-700 break-all bg-slate-50 border border-slate-100 p-5 rounded-[1.5rem] pr-14 shadow-inner">
                                                            {config.value ? (
                                                                isSecret(config.key) && !showSecrets[config.key] ?
                                                                    <span className="text-slate-300 tracking-[0.4em] font-black">••••••••••••••••</span> :
                                                                    <span className="text-slate-900 font-bold">{config.value}</span>
                                                            ) : (
                                                                <span className="text-slate-400 italic flex items-center gap-3 font-medium">
                                                                    <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse"></span>
                                                                    Parameter not initialized
                                                                </span>
                                                            )}
                                                        </div>
                                                        {config.value && isSecret(config.key) && (
                                                            <button
                                                                onClick={() => toggleSecret(config.key)}
                                                                className="absolute right-5 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-sm"
                                                            >
                                                                {showSecrets[config.key] ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {configs.length === 0 && !loading && (
                        <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 shadow-xl shadow-slate-200/50">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                                <FiSettings className="w-12 h-12 text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900">No Parameters Found</h3>
                            <p className="text-sm text-slate-500 mt-3 max-w-xs mx-auto font-medium">The system configuration registry is currently empty or unavailable.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SystemConfig;
