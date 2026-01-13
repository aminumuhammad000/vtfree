import React, { useEffect, useState } from 'react';
import { FiEdit2, FiPlus, FiRefreshCw, FiSave, FiTrash2, FiX, FiSettings, FiMail, FiMessageSquare, FiCreditCard, FiGlobe, FiShield } from 'react-icons/fi';
import { createConfig, deleteConfig, getAllConfigs, updateConfig } from '../api/adminApi';
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
    const { showToast } = useToast();
    const [configs, setConfigs] = useState<SystemConfig[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [newConfig, setNewConfig] = useState({ key: '', value: '', description: '', group: 'GENERAL' });
    const [activeGroup, setActiveGroup] = useState<string>('ALL');

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
            showToast('Failed to fetch configurations', 'error');
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
                showToast('Configuration updated successfully', 'success');
                setEditingKey(null);
                fetchConfigs();
            }
        } catch (error) {
            showToast('Failed to update configuration', 'error');
        }
    };

    const handleDelete = async (key: string) => {
        if (key.startsWith('VTPAY_')) {
            showToast('Default gateway configuration cannot be cleared', 'warning');
            return;
        }
        if (!window.confirm(`Are you sure you want to clear the value for ${key}?`)) return;
        try {
            const response = await deleteConfig(key);
            if (response.data.success) {
                showToast('Configuration cleared successfully', 'success');
                fetchConfigs();
            }
        } catch (error) {
            showToast('Failed to clear configuration', 'error');
        }
    };

    const handleAddConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await createConfig(newConfig);
            if (response.data.success) {
                showToast('Configuration added successfully', 'success');
                setIsAdding(false);
                setNewConfig({ key: '', value: '', description: '', group: 'GENERAL' });
                fetchConfigs();
            }
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to add configuration', 'error');
        }
    };

    // Group configs by group name
    const groupedConfigs = configs.reduce((acc, config) => {
        const group = config.group || 'GENERAL';
        if (!acc[group]) acc[group] = [];
        acc[group].push(config);
        return acc;
    }, {} as Record<string, SystemConfig[]>);

    const groups = ['ALL', ...Object.keys(groupedConfigs).sort()];

    const getGroupIcon = (group: string) => {
        switch (group.toUpperCase()) {
            case 'EMAIL': return <FiMail className="w-4 h-4" />;
            case 'SMS': return <FiMessageSquare className="w-4 h-4" />;
            case 'PAYMENT': return <FiCreditCard className="w-4 h-4" />;
            case 'GENERAL': return <FiGlobe className="w-4 h-4" />;
            case 'SECURITY': return <FiShield className="w-4 h-4" />;
            default: return <FiSettings className="w-4 h-4" />;
        }
    };

    const displayedConfigs = activeGroup === 'ALL'
        ? groupedConfigs
        : { [activeGroup]: groupedConfigs[activeGroup] || [] };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Configurations</h2>
                    <p className="text-slate-500 mt-1">Manage global system settings and variables</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchConfigs}
                        className="p-2.5 text-slate-600 hover:bg-white hover:shadow-md hover:text-green-600 rounded-xl transition-all duration-200 border border-transparent hover:border-slate-100"
                        title="Refresh"
                    >
                        <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-slate-200 hover:shadow-xl hover:-translate-y-0.5 font-medium"
                    >
                        <FiPlus className="w-5 h-5" />
                        <span>Add Config</span>
                    </button>
                </div>
            </div>

            {isAdding && (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl shadow-slate-100/50 animate-in fade-in slide-in-from-top-4 duration-300 mb-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Add New Configuration</h3>
                            <p className="text-slate-500 text-sm mt-1">Create a new system variable</p>
                        </div>
                        <button
                            onClick={() => setIsAdding(false)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleAddConfig} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Key (Uppercase)</label>
                            <input
                                type="text"
                                value={newConfig.key}
                                onChange={e => setNewConfig({ ...newConfig, key: e.target.value.toUpperCase() })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-mono text-sm"
                                placeholder="MY_CONFIG_KEY"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Group</label>
                            <input
                                type="text"
                                value={newConfig.group}
                                onChange={e => setNewConfig({ ...newConfig, group: e.target.value.toUpperCase() })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-mono text-sm"
                                placeholder="GENERAL"
                                required
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Value</label>
                            <input
                                type="text"
                                value={newConfig.value}
                                onChange={e => setNewConfig({ ...newConfig, value: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-mono text-sm"
                                placeholder="Config Value"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Description</label>
                            <input
                                type="text"
                                value={newConfig.description}
                                onChange={e => setNewConfig({ ...newConfig, description: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                                placeholder="What is this config for?"
                            />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="px-6 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all shadow-lg shadow-green-200 font-medium"
                            >
                                Save Config
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:w-64 flex-shrink-0">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-semibold text-slate-900">Settings Groups</h3>
                        </div>
                        <nav className="p-2 space-y-1">
                            {groups.map(group => (
                                <button
                                    key={group}
                                    onClick={() => setActiveGroup(group)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeGroup === group
                                        ? 'bg-green-50 text-green-700 shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    {getGroupIcon(group)}
                                    <span className="capitalize">{group === 'ALL' ? 'All Settings' : group.toLowerCase()}</span>
                                    {group !== 'ALL' && (
                                        <span className="ml-auto text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                            {groupedConfigs[group]?.length || 0}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 space-y-6">
                    {Object.entries(displayedConfigs).map(([group, groupConfigs]) => (
                        <div key={group} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50/50 px-8 py-4 border-b border-slate-100 flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm text-green-600">
                                    {getGroupIcon(group)}
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg tracking-tight">{group}</h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {groupConfigs.map(config => (
                                    <div key={config._id} className="p-6 hover:bg-slate-50/80 transition-colors group">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                            <div className="flex-1 min-w-0 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg text-sm border border-slate-200">
                                                        {config.key}
                                                    </span>
                                                    {config.key.startsWith('VTPAY_') && (
                                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                                            Default Gateway
                                                        </span>
                                                    )}
                                                    {config.description && (
                                                        <span className="text-sm text-slate-500 truncate border-l border-slate-200 pl-3">
                                                            {config.description}
                                                        </span>
                                                    )}
                                                </div>

                                                {editingKey === config.key ? (
                                                    <div className="flex gap-3 animate-in fade-in duration-200">
                                                        <input
                                                            type="text"
                                                            value={editValue}
                                                            onChange={e => setEditValue(e.target.value)}
                                                            className="flex-1 px-4 py-2.5 bg-white border border-green-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 font-mono text-sm shadow-sm"
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={() => handleSaveEdit(config.key)}
                                                            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-sm font-medium flex items-center gap-2"
                                                            title="Save"
                                                        >
                                                            <FiSave className="w-4 h-4" /> Save
                                                        </button>
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors font-medium flex items-center gap-2"
                                                            title="Cancel"
                                                        >
                                                            <FiX className="w-4 h-4" /> Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="font-mono text-sm text-slate-600 break-all bg-slate-50/50 p-4 rounded-xl border border-slate-100/50">
                                                        {config.value ? (
                                                            config.key.includes('PASSWORD') || config.key.includes('SECRET') || config.key.includes('KEY') ?
                                                                <span className="text-slate-400 tracking-widest">••••••••••••••••</span> :
                                                                <span className="text-slate-700">{config.value}</span>
                                                        ) : (
                                                            <span className="text-slate-400 italic flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                                                Not set
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {config.is_editable && editingKey !== config.key && (
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    <button
                                                        onClick={() => handleEdit(config)}
                                                        className="p-2.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(config.key)}
                                                        className="p-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Clear Value"
                                                    >
                                                        <FiTrash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {configs.length === 0 && !loading && (
                        <div className="text-center py-16 text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
                            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FiRefreshCw className="w-6 h-6 text-slate-400" />
                            </div>
                            <p className="text-lg font-medium text-slate-900">No configurations found</p>
                            <p className="text-sm text-slate-500 mt-1">Get started by adding a new system variable</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SystemConfig;
