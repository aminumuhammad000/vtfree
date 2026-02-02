import api from './api';

export interface Feature {
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
    created_at: string;
    updated_at: string;
}

export interface FeatureResponse {
    success: boolean;
    message?: string;
    data?: Feature | Feature[];
}

export const FeatureService = {
    /**
     * Get all active features
     */
    getActiveFeatures: async (): Promise<Feature[]> => {
        try {
            const response = await api.get<FeatureResponse>('/features');
            if (response.data.success && Array.isArray(response.data.data)) {
                return response.data.data;
            }
            return [];
        } catch (error: any) {
            console.error('Error fetching features:', error);
            throw error.response?.data || { success: false, message: 'Failed to fetch features' };
        }
    },

    /**
     * Get a single feature by ID or slug
     */
    getFeature: async (identifier: string): Promise<Feature | null> => {
        try {
            const response = await api.get<FeatureResponse>(`/features/${identifier}`);
            if (response.data.success && response.data.data) {
                return response.data.data as Feature;
            }
            return null;
        } catch (error: any) {
            console.error('Error fetching feature:', error);
            throw error.response?.data || { success: false, message: 'Failed to fetch feature' };
        }
    }
};
