import api from './api';

export interface User {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    status: 'active' | 'suspended' | 'pending';
    wallet_balance?: number;
    created_at: string;
    role?: string;
    last_login?: string;
    app_id?: string;
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
    }
};
