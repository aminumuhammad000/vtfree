import api from './api';

export interface CreateVirtualAccountData {
    bankType: 'moniepoint' | 'fcmb' | 'fidelity';
}

export interface VTPayAccount {
    id: string;
    accountNumber: string;
    accountName: string;
    bankName: string;
    status: string;
    reference: string;
    metadata?: {
        bankType: string;
    };
}

export interface VTPayResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export const vtpayService = {
    /**
     * Create a new VTPay virtual account
     */
    createVirtualAccount: async (data: CreateVirtualAccountData): Promise<VTPayResponse<VTPayAccount>> => {
        try {
            console.log('🏦 Creating VTPay virtual account:', data);
            const response = await api.post<VTPayResponse<VTPayAccount>>('/vtpay/virtual-accounts', data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Failed to create VTPay account:', error.response?.data || error.message);
            throw error.response?.data || { success: false, message: 'Failed to create virtual account' };
        }
    },

    /**
     * Get user's virtual accounts
     */
    getVirtualAccounts: async (): Promise<VTPayResponse<VTPayAccount[]>> => {
        try {
            console.log('🔍 Fetching VTPay virtual accounts...');
            const response = await api.get<VTPayResponse<VTPayAccount[]>>('/vtpay/virtual-accounts');
            return response.data;
        } catch (error: any) {
            console.error('❌ Failed to fetch VTPay accounts:', error.response?.data || error.message);
            throw error.response?.data || { success: false, message: 'Failed to fetch virtual accounts' };
        }
    },

    /**
     * Get account balance
     */
    getAccountBalance: async (accountNumber: string): Promise<any> => {
        try {
            const response = await api.get(`/vtpay/virtual-accounts/${accountNumber}/balance`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { success: false, message: 'Failed to fetch balance' };
        }
    },

    /**
     * Get account transactions
     */
    getTransactions: async (accountNumber: string): Promise<any> => {
        try {
            const response = await api.get(`/vtpay/virtual-accounts/${accountNumber}/transactions`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { success: false, message: 'Failed to fetch transactions' };
        }
    }
};
