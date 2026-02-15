import api from './api';

export interface User {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    status: 'active' | 'suspended' | 'pending';
    wallet_balance?: number;
    created_at: string;
    role?: string;
    last_login?: string;
    app_id?: string;
    apps?: any[];
    ibdata_balance?: number;
    owner_id?: string;
}

export interface UserResponse {
    success: boolean;
    data: {
        owners?: User[];
        admins?: User[];
        owner?: User;
        admin?: User;
    };
}

export const UserService = {
    getOwners: async (): Promise<User[]> => {
        const response = await api.get<UserResponse>('/super-admin/owners');
        return response.data.data.owners || [];
    },

    getAdmins: async (): Promise<User[]> => {
        const response = await api.get<UserResponse>('/super-admin/admins');
        return response.data.data.admins || [];
    },

    createOwner: async (data: any): Promise<User> => {
        const response = await api.post<any>('/super-admin/owners', data);
        return response.data.data.owner;
    },

    createAdmin: async (data: any): Promise<User> => {
        const response = await api.post<any>('/super-admin/admins', data);
        return response.data.data.admin;
    },

    getOwnerById: async (id: string): Promise<User | null> => {
        const response = await api.get<UserResponse>(`/super-admin/owners/${id}`);
        return response.data.data.owner || null;
    },

    getAdminById: async (id: string): Promise<User | null> => {
        const response = await api.get<UserResponse>(`/super-admin/admins/${id}`);
        return response.data.data.admin || null;
    },

    updateOwnerStatus: async (id: string, status: string): Promise<boolean> => {
        // This endpoint might need to be implemented in the backend if not already there
        const response = await api.patch(`/super-admin/owners/${id}/status`, { status });
        return response.data.success;
    },

    updateAdminStatus: async (id: string, status: string): Promise<boolean> => {
        // This endpoint might need to be implemented in the backend if not already there
        const response = await api.patch(`/super-admin/admins/${id}/status`, { status });
        return response.data.success;
    },

    creditOwnerWallet: async (id: string, amount: number, reason?: string): Promise<any> => {
        const response = await api.post(`/super-admin/owners/${id}/credit`, { amount, reason });
        return response.data;
    },

    deleteOwner: async (id: string): Promise<boolean> => {
        const response = await api.delete(`/super-admin/owners/${id}`);
        return response.data.success;
    },

    deleteAdmin: async (id: string): Promise<boolean> => {
        const response = await api.delete(`/super-admin/admins/${id}`);
        return response.data.success;
    },
};
