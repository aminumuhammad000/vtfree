import React, { useEffect, useState } from 'react';
import { FiEdit2, FiPlus, FiRefreshCw, FiSave, FiTrash2, FiX } from 'react-icons/fi';
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">System Configurations</h2>
                <div className="flex gap-2">
                    <button
                        onClick={fetchConfigs}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                        <FiPlus /> Add Config
                    </button>
                </div>
            </div>

            {isAdding && (
                <div className="bg-green-50 border border-green-100 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-4">Add New Configuration</h3>
                    <form onSubmit={handleAddConfig} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-green-800 mb-1">Key (Uppercase)</label>
                            <input
                                type="text"
                                value={newConfig.key}
                                onChange={e => setNewConfig({ ...newConfig, key: e.target.value.toUpperCase() })}
                                className="w-full px-3 py-2 border border-green-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="MY_CONFIG_KEY"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-green-800 mb-1">Group</label>
                            <input
                                type="text"
                                value={newConfig.group}
                                onChange={e => setNewConfig({ ...newConfig, group: e.target.value.toUpperCase() })}
                                className="w-full px-3 py-2 border border-green-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="GENERAL"
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-green-800 mb-1">Value</label>
                            <input
                                type="text"
                                value={newConfig.value}
                                onChange={e => setNewConfig({ ...newConfig, value: e.target.value })}
                                className="w-full px-3 py-2 border border-green-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Config Value"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-green-800 mb-1">Description</label>
                            <input
                                type="text"
                                value={newConfig.description}
                                onChange={e => setNewConfig({ ...newConfig, description: e.target.value })}
                                className="w-full px-3 py-2 border border-green-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="What is this config for?"
                            />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="px-4 py-2 text-green-700 hover:bg-green-100 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                            >
                                Save Config
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {Object.entries(groupedConfigs).map(([group, groupConfigs]) => (
                <div key={group} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                        <h3 className="font-bold text-slate-700">{group}</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {groupConfigs.map(config => (
                            <div key={config._id} className="p-6 hover:bg-slate-50 transition-colors">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-sm">
                                                {config.key}
                                            </span>
                                            {config.description && (
                                                <span className="text-sm text-slate-500 truncate">
                                                    - {config.description}
                                                </span>
                                            )}
                                        </div>

                                        {editingKey === config.key ? (
                                            <div className="mt-2 flex gap-2">
                                                <input
                                                    type="text"
                                                    value={editValue}
                                                    onChange={e => setEditValue(e.target.value)}
                                                    className="flex-1 px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => handleSaveEdit(config.key)}
                                                    className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                                    title="Save"
                                                >
                                                    <FiSave />
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="p-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
                                                    title="Cancel"
                                                >
                                                    <FiX />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="mt-1 font-mono text-sm text-slate-600 break-all">
                                                {config.value ? (
                                                    config.key.includes('PASSWORD') || config.key.includes('SECRET') || config.key.includes('KEY') ?
                                                        '••••••••••••••••' : config.value
                                                ) : (
                                                    <span className="text-slate-400 italic">Not set</span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {config.is_editable && editingKey !== config.key && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(config)}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <FiEdit2 />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(config.key)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Clear Value"
                                            >
                                                <FiTrash2 />
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
                <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
                    No configurations found.
                </div>
            )}
        </div>
    );
};

export default SystemConfig;
