import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { createApp, getUsers } from '../../api/superAdminApi';

interface RegisterAppModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

interface User {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
}

const RegisterAppModal = ({ onClose, onSuccess }: RegisterAppModalProps) => {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [formData, setFormData] = useState({
        app_name: '',
        package_name: '',
        owner_id: '',
        description: '',
        admin_email: '',
        admin_password: '',
        admin_settings: {
            panel_title: '',
            primary_color: '#3B82F6', // Blue-500
            support_email: '',
            support_phone: ''
        }
    });
    const [error, setError] = useState('');

    useEffect(() => {
        // Fetch potential owners
        const fetchUsers = async () => {
            try {
                const response = await getUsers({ limit: 100 }); // Fetch first 100 users for now
                if (response.data.success) {
                    setUsers(response.data.data.users);
                }
            } catch (err) {
                console.error('Failed to fetch users', err);
            }
        };
        fetchUsers();
    }, []);

    const handleOwnerChange = (userId: string) => {
        const owner = users.find(u => u._id === userId);
        setFormData(prev => ({
            ...prev,
            owner_id: userId,
            admin_email: owner?.email || '', // Default admin email to owner email
            admin_settings: {
                ...prev.admin_settings,
                support_email: owner?.email || prev.admin_settings.support_email,
                panel_title: prev.app_name ? `${prev.app_name} Admin` : prev.admin_settings.panel_title
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.app_name || !formData.owner_id || !formData.admin_email || !formData.admin_password) {
            setError('App Name, Owner, Admin Email and Admin Password are required');
            return;
        }

        try {
            setLoading(true);
            await createApp(formData);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to register app');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
                    <h3 className="text-lg font-bold text-slate-900">Register New App</h3>
                    <button
                        onClick={onClose}
                        type="button"
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                    >
                        <Icon icon="solar:close-circle-bold" width="24" height="24" className="text-slate-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                            <Icon icon="solar:danger-circle-bold" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                            <Icon icon="solar:smartphone-bold" className="text-blue-500" />
                            App Information
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">App Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="e.g. My VTU App"
                                    value={formData.app_name}
                                    onChange={(e) => {
                                        const name = e.target.value;
                                        // Auto-generate package name and panel title if not manually edited
                                        const suggestedPackage = `com.vtfree.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
                                        setFormData(prev => ({
                                            ...prev,
                                            app_name: name,
                                            package_name: prev.package_name === '' || prev.package_name.startsWith('com.vtfree.') ? suggestedPackage : prev.package_name,
                                            admin_settings: {
                                                ...prev.admin_settings,
                                                panel_title: prev.admin_settings.panel_title === '' || prev.admin_settings.panel_title.includes('Admin') ? `${name} Admin` : prev.admin_settings.panel_title
                                            }
                                        }));
                                    }}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Package Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm"
                                    placeholder="com.example.app"
                                    value={formData.package_name}
                                    onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                                />
                                <p className="text-xs text-slate-400">Unique identifier · also used as <strong>App ID</strong> for admin login</p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Owner <span className="text-red-500">*</span></label>
                            <select
                                required
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                value={formData.owner_id}
                                onChange={(e) => handleOwnerChange(e.target.value)}
                            >
                                <option value="">Select an owner</option>
                                {users.map(user => (
                                    <option key={user._id} value={user._id}>
                                        {user.first_name} {user.last_name} ({user.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Description</label>
                            <textarea
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none h-20"
                                placeholder="Brief description of the app functionality..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                            <Icon icon="solar:shield-user-bold" className="text-purple-500" />
                            Admin Access
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Admin Email <span className="text-red-500">*</span></label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                    placeholder="admin@app.com"
                                    value={formData.admin_email}
                                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Admin Password <span className="text-red-500">*</span></label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                    placeholder="••••••••"
                                    value={formData.admin_password}
                                    onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                            <Icon icon="solar:settings-bold" className="text-emerald-500" />
                            Admin Panel Setup
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Panel Title</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                    placeholder="e.g. My App Admin"
                                    value={formData.admin_settings.panel_title}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        admin_settings: { ...formData.admin_settings, panel_title: e.target.value }
                                    })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Primary Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        className="h-[46px] w-[60px] p-1 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                                        value={formData.admin_settings.primary_color}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            admin_settings: { ...formData.admin_settings, primary_color: e.target.value }
                                        })}
                                    />
                                    <input
                                        type="text"
                                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                        value={formData.admin_settings.primary_color}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            admin_settings: { ...formData.admin_settings, primary_color: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Support Email</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                    placeholder="support@myapp.com"
                                    value={formData.admin_settings.support_email}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        admin_settings: { ...formData.admin_settings, support_email: e.target.value }
                                    })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Support Phone</label>
                                <input
                                    type="tel"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                    placeholder="+234..."
                                    value={formData.admin_settings.support_phone}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        admin_settings: { ...formData.admin_settings, support_phone: e.target.value }
                                    })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white border-t border-slate-100 py-4 -mx-6 px-6 -mb-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <Icon icon="svg-spinners:ring-resize" />}
                            Create App
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterAppModal;
