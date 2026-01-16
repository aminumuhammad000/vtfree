import api from './api';

export interface WalletData {
  _id: string;
  user_id: string;
  balance: number;
  currency: string;
  last_transaction_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WalletResponse {
  success: boolean;
  data: WalletData;
  message: string;
}

export const walletService = {
  /**
   * Get user wallet balance
   */
  getWallet: async (): Promise<WalletResponse> => {
    try {
      const response = await api.get<WalletResponse>('/wallet');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, message: 'Failed to fetch wallet' };
    }
  },

  /**
   * Fund wallet (initiate payment)
   */
  fundWallet: async (amount: number, gateway?: string): Promise<any> => {
    try {
      const response = await api.post('/wallet/fund', {
        amount,
        gateway,
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, message: 'Wallet funding failed' };
    }
  },

  /**
   * Get wallet transactions
   */
  getWalletTransactions: async (page: number = 1, limit: number = 20): Promise<any> => {
    try {
      const response = await api.get('/wallet/transactions', {
        params: { page, limit },
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, message: 'Failed to fetch wallet transactions' };
    }
  },

  /**
   * Transfer funds to another user
   */
  transferFunds: async (recipient: string, amount: number, note?: string): Promise<any> => {
    try {
      const response = await api.post('/wallet/transfer', {
        recipient,
        amount,
        note,
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, message: 'Transfer failed' };
    }
  },

  /**
   * Adjust balance (admin only)
   */
  adjustBalance: async (userId: string, amount: number, reason: string): Promise<any> => {
    try {
      const response = await api.put('/wallet/adjust', {
        user_id: userId,
        amount,
        reason,
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, message: 'Balance adjustment failed' };
    }
  },
};
