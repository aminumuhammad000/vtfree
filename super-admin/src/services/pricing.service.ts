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
    feature_id: string;
    name: string;
    slug: string;
    description?: string;
    icon_name: string;
    base_price: number;
    is_active: boolean;
    category: 'billpayment' | 'finance' | 'utility' | 'communication';
    display_order: number;
    requires_api: boolean;
    created_at: Date;
    updated_at: Date;
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

    createFeature: async (data: {
        feature_id: string;
        name: string;
        slug: string;
        description?: string;
        icon_name: string;
        base_price: number;
        category: 'billpayment' | 'finance' | 'utility' | 'communication';
        is_active?: boolean;
    }): Promise<AppFeature> => {
        const response = await api.post('/super-admin/features', data);
        return response.data.data.feature;
    },

    updateFeature: async (id: string, data: Partial<AppFeature>): Promise<boolean> => {
        const response = await api.patch(`/super-admin/features/${id}`, data);
        return response.data.success;
    },

    deleteFeature: async (id: string): Promise<boolean> => {
        const response = await api.delete(`/super-admin/features/${id}`);
        return response.data.success;
    },

    getBuildPrices: async (): Promise<Record<string, number>> => {
        const response = await api.get('/super-admin/pricing/build-prices');
        return response.data.data;
    },

    updateBuildPrice: async (key: string, value: number): Promise<boolean> => {
        const response = await api.post('/super-admin/pricing/build-price', { key, value });
        return response.data.success;
    }
};
