import api from './api';

export interface CreateVirtualAccountData {
    bankType: 'palmpay'; // VTStack only supports PalmPay
    bvn?: string;
}

export interface VTStackAccount {
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

export interface VTStackResponse<T> {
    success: boolean;
    message: string;
    data: T;
    gateway?: string;
}

export const vtstackService = {
    /**
     * Create a new VTStack virtual account
     */
    createVirtualAccount: async (data: CreateVirtualAccountData): Promise<VTStackResponse<VTStackAccount>> => {
        try {
            console.log('🏦 Creating VTStack virtual account:', data);
            const response = await api.post<VTStackResponse<VTStackAccount>>('/vtstack/virtual-accounts', data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Failed to create VTStack account:', error.response?.data || error.message);
            throw error.response?.data || { success: false, message: 'Failed to create virtual account' };
        }
    },

    /**
     * Get user's virtual accounts
     */
    getVirtualAccounts: async (): Promise<VTStackResponse<VTStackAccount[]>> => {
        try {
            console.log('🔍 Fetching VTStack virtual accounts...');
            const response = await api.get<VTStackResponse<VTStackAccount[]>>('/vtstack/virtual-accounts');
            return response.data;
        } catch (error: any) {
            console.error('❌ Failed to fetch VTStack accounts:', error.response?.data || error.message);
            throw error.response?.data || { success: false, message: 'Failed to fetch virtual accounts' };
        }
    },

    /**
     * Get account balance
     */
    getAccountBalance: async (accountNumber: string): Promise<any> => {
        try {
            const response = await api.get(`/vtstack/virtual-accounts/${accountNumber}/balance`);
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
            const response = await api.get(`/vtstack/virtual-accounts/${accountNumber}/transactions`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { success: false, message: 'Failed to fetch transactions' };
        }
    }
};

// Keep backward compatibility exports
export const vtpayService = vtstackService;
export type VTPayAccount = VTStackAccount;
export type VTPayResponse<T> = VTStackResponse<T>;
