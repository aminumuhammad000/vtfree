import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// API response type
interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
}

// User/Tenant types
export interface Tenant {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    phone: string;
    bvn?: string;
    businessName?: string;
    kycLevel: number;
    status: 'active' | 'suspended' | 'pending';
    apiKey?: string;
    createdAt: string;
    updatedAt: string;
}

// Zainbox types
export interface Zainbox {
    _id: string;
    userId: string;
    name: string;
    emailNotification: string;
    tags: string;
    callbackUrl: string;
    codeName: string;
    zainboxCode: string;
    isLive: boolean;
    createdAt: string;
    updatedAt: string;
}

// Tenant/User APIs
export const tenantApi = {
    getAll: async (): Promise<Tenant[]> => {
        // Note: We'll need to create an admin endpoint in the backend
        const response = await api.get<ApiResponse<Tenant[]>>('/admin/tenants');
        return response.data.data || [];
    },

    getById: async (id: string): Promise<Tenant> => {
        const response = await api.get<ApiResponse<Tenant>>(`/admin/tenants/${id}`);
        return response.data.data!;
    },

    updateStatus: async (id: string, status: string): Promise<void> => {
        await api.patch(`/admin/tenants/${id}/status`, { status });
    },

    updateLimits: async (id: string, limits: any): Promise<void> => {
        await api.patch(`/admin/tenants/${id}/limits`, limits);
    },
};

// Zainbox APIs
export const zainboxApi = {
    getAll: async (): Promise<Zainbox[]> => {
        // Admin endpoint to get all zainboxes
        const response = await api.get<ApiResponse<Zainbox[]>>('/admin/zainboxes');
        return response.data.data || [];
    },

    getById: async (zainboxCode: string): Promise<any> => {
        const response = await api.get<ApiResponse<any>>(`/zainbox/${zainboxCode}`);
        return response.data.data!;
    },

    create: async (data: {
        name: string;
        emailNotification: string;
        tags: string;
        callbackUrl: string;
    }): Promise<Zainbox> => {
        const response = await api.post<ApiResponse<Zainbox>>('/zainbox', data);
        return response.data.data!;
    },
};

export default api;
