import api from './api';

export interface IBDataPlan {
    id: string;
    network: string;
    type: 'data' | 'airtime' | 'cable' | 'utility';
    plan_name: string;
    base_price: number;
    profit_percentage: number;
    selling_price: number;
    status: 'active' | 'inactive';
}

export interface AppFeature {
    _id: string;
    name: string;
    description: string;
    price: number;
    category: 'Publishing' | 'Add-on' | 'Service';
    billing_cycle: 'monthly' | 'yearly' | 'one-time';
    icon: string;
    status: 'active' | 'inactive';
}

export const PricingService = {
    getIBDataPlans: async (type?: string): Promise<IBDataPlan[]> => {
        const response = await api.get('/super-admin/pricing/ibdata-plans', { params: { type } });
        return response.data.data || [];
    },

    updatePlanProfit: async (data: {
        planId: string;
        profitPercentage: number;
        type: string;
        name: string;
        basePrice: number;
        network: string;
    }): Promise<boolean> => {
        const response = await api.post('/super-admin/pricing/update-profit', data);
        return response.data.success;
    },

    syncIBDataPlans: async (): Promise<string> => {
        const response = await api.post('/super-admin/pricing/sync-ibdata');
        return response.data.message;
    },

    getIBDataBalance: async (): Promise<number> => {
        const response = await api.get('/super-admin/pricing/ibdata-balance');
        return response.data.data.balance;
    },

    getFeatures: async (): Promise<AppFeature[]> => {
        const response = await api.get('/super-admin/features');
        return response.data.data.features || [];
    },

    updateFeature: async (id: string, data: Partial<AppFeature>): Promise<boolean> => {
        const response = await api.patch(`/super-admin/features/${id}`, data);
        return response.data.success;
    },

    deleteFeature: async (id: string): Promise<boolean> => {
        const response = await api.delete(`/super-admin/features/${id}`);
        return response.data.success;
    }
};
