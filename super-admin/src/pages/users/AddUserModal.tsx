import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'react-hot-toast';
import { getApps } from '../../api/superAdminApi';
import { UserService } from '../../services/user.service';

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddUserModal = ({ isOpen, onClose, onSuccess }: AddUserModalProps) => {
    const [userType, setUserType] = useState<'owner' | 'admin'>('owner');
    const [loading, setLoading] = useState(false);
    const [apps, setApps] = useState<any[]>([]);
    const [selectedApp, setSelectedApp] = useState<any>(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        company_name: '',
        password: '',
        app_id: '',
        role: 'admin'
    });

    useEffect(() => {
        if (userType === 'admin' && isOpen) {
            const fetchApps = async () => {
                try {
                    const response = await getApps();
                    if (response.data.success) {
                        setApps(response.data.data.apps);
                    }
                } catch (error) {
                    console.error('Failed to fetch apps', error);
                    toast.error('Failed to load apps');
                }
            };
            fetchApps();
        }
    }, [userType, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAppChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const appId = e.target.value;
        const app = apps.find(a => a.app_id === appId);
        setSelectedApp(app);
        setFormData({ ...formData, app_id: appId });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (userType === 'owner') {
                await UserService.createOwner({
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email,
                    phone_number: formData.phone_number,
                    company_name: formData.company_name,
                    password: formData.password
                });
                toast.success('VTFree User created successfully');
            } else {
                await UserService.createAdmin({
                    app_id: formData.app_id,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role
                });
                toast.success('Admin User created successfully');
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Create user error:', error);
            toast.error(error.response?.data?.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-slate-900">Add New User</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <Icon icon="solar:close-circle-bold" width="24" />
                    </button>
                </div>

                <div className="p-6">
                    {/* User Type Selection */}
                    <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                        <button
                            type="button"
                            onClick={() => setUserType('owner')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${userType === 'owner' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            VTFree User
                        </button>
                        <button
                            type="button"
                            onClick={() => setUserType('admin')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${userType === 'admin' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Admin User
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    required
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    placeholder="John"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    required
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    placeholder="Doe"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                placeholder="john@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input
                                type="password"
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                placeholder="••••••••"
                            />
                        </div>

                        {userType === 'owner' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone_number"
                                        required
                                        value={formData.phone_number}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        placeholder="+234..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Company Name (Optional)</label>
                                    <input
                                        type="text"
                                        name="company_name"
                                        value={formData.company_name}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        placeholder="Tech Solutions Ltd"
                                    />
                                </div>
                            </>
                        )}

                        {userType === 'admin' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Select App</label>
                                    <select
                                        name="app_id"
                                        required
                                        value={formData.app_id}
                                        onChange={handleAppChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    >
                                        <option value="">Select an App</option>
                                        {apps.map(app => (
                                            <option key={app.app_id} value={app.app_id}>
                                                {app.app_name} ({app.app_id})
                                            </option>
                                        ))}
                                    </select>
                                    {selectedApp && (
                                        <p className="mt-1 text-xs text-slate-500 font-mono">
                                            Package: <span className="font-semibold text-slate-700">{selectedApp.package_name}</span>
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="support">Support</option>
                                        <option value="owner">Owner</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <div className="pt-4 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading && <Icon icon="eos-icons:loading" width="20" />}
                                <span>Create User</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddUserModal;
