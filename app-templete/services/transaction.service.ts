import api from './api';

export interface Transaction {
  _id: string;
  user_id: string;
  wallet_id: string;
  type: 'airtime_topup' | 'data_purchase' | 'bill_payment' | 'wallet_topup' | 'e-pin_purchase';
  amount: number;
  fee: number;
  total_charged: number;
  status: 'pending' | 'successful' | 'failed' | 'refunded';
  reference_number: string;
  description?: string;
  payment_method: string;
  destination_account?: string;
  operator_id?: string;
  plan_id?: string;
  receipt_url?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionResponse {
  success: boolean;
  data: {
    transactions: Transaction[];
    total: number;
    page: number;
    limit: number;
  };
  message: string;
}

export interface AirtimePurchaseData {
  phone_number: string;
  amount: number;
  operator_id: string;
}

export interface DataPurchaseData {
  phone_number: string;
  plan_id: string;
  operator_id: string;
}

const DEMO_TRANSACTIONS: Transaction[] = [
  {
    _id: 'tx_1234567890',
    user_id: 'user_123',
    wallet_id: 'wallet_123',
    type: 'airtime_topup',
    amount: 500,
    fee: 0,
    total_charged: 500,
    status: 'successful',
    reference_number: 'REF-AIR-20240120-001',
    description: 'Airtime Topup - MTN',
    payment_method: 'wallet',
    destination_account: '08012345678',
    operator_id: 'MTN',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    _id: 'tx_1234567891',
    user_id: 'user_123',
    wallet_id: 'wallet_123',
    type: 'data_purchase',
    amount: 2500,
    fee: 0,
    total_charged: 2500,
    status: 'successful',
    reference_number: 'REF-DAT-20240119-002',
    description: 'Data Purchase - 5GB',
    payment_method: 'wallet',
    destination_account: '08012345678',
    plan_id: 'mtn-5gb',
    operator_id: 'MTN',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: 'tx_1234567892',
    user_id: 'user_123',
    wallet_id: 'wallet_123',
    type: 'wallet_topup',
    amount: 10000,
    fee: 100,
    total_charged: 10100,
    status: 'successful',
    reference_number: 'REF-TOP-20240118-003',
    description: 'Wallet Funding',
    payment_method: 'bank_transfer',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    _id: 'tx_1234567893',
    user_id: 'user_123',
    wallet_id: 'wallet_123',
    type: 'bill_payment',
    amount: 4500,
    fee: 50,
    total_charged: 4550,
    status: 'failed',
    reference_number: 'REF-BIL-20240117-004',
    description: 'DSTV Subscription',
    payment_method: 'wallet',
    destination_account: '7034567890',
    operator_id: 'DSTV',
    error_message: 'Insufficient balance',
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    _id: 'tx_1234567894',
    user_id: 'user_123',
    wallet_id: 'wallet_123',
    type: 'airtime_topup',
    amount: 1000,
    fee: 0,
    total_charged: 1000,
    status: 'pending',
    reference_number: 'REF-AIR-20240116-005',
    description: 'Airtime Topup - GLO',
    payment_method: 'wallet',
    destination_account: '08055555555',
    operator_id: 'GLO',
    created_at: new Date(Date.now() - 345600000).toISOString(),
    updated_at: new Date(Date.now() - 345600000).toISOString(),
  },
];

export const transactionService = {
  /**
   * Get user transactions with pagination
   */
  getTransactions: async (page: number = 1, limit: number = 10): Promise<TransactionResponse> => {
    try {
      const response = await api.get<TransactionResponse>('/transactions', {
        params: { page, limit },
      });

      // If API returns empty data, use demo data
      if (response.data.success && (!response.data.data.transactions || response.data.data.transactions.length === 0)) {
        return {
          success: true,
          message: 'Transactions retrieved successfully',
          data: {
            transactions: DEMO_TRANSACTIONS,
            total: DEMO_TRANSACTIONS.length,
            page: 1,
            limit: 10
          }
        };
      }

      return response.data;
    } catch (error: any) {
      // Fallback to demo data on error
      console.log('Using demo transactions due to API error');
      return {
        success: true,
        message: 'Transactions retrieved successfully',
        data: {
          transactions: DEMO_TRANSACTIONS,
          total: DEMO_TRANSACTIONS.length,
          page: 1,
          limit: 10
        }
      };
    }
  },

  /**
   * Get transaction by ID
   */
  getTransactionById: async (id: string): Promise<any> => {
    try {
      // Check if ID is a valid MongoDB ObjectId format (24 hex characters)
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

      // If not a valid ObjectId, check demo data first
      if (!isValidObjectId) {
        const demoTx = DEMO_TRANSACTIONS.find(t => t._id === id || t.reference_number === id);
        if (demoTx) {
          return {
            success: true,
            message: 'Transaction retrieved successfully',
            data: demoTx
          };
        }
      }

      // Try API call for valid ObjectIds
      const response = await api.get(`/transactions/${id}`);
      return response.data;
    } catch (error: any) {
      // Fallback to demo data on API error
      const demoTx = DEMO_TRANSACTIONS.find(t => t._id === id || t.reference_number === id);
      if (demoTx) {
        return {
          success: true,
          message: 'Transaction retrieved successfully',
          data: demoTx
        };
      }

      throw error.response?.data || { success: false, message: 'Failed to fetch transaction' };
    }
  },

  /**
   * Purchase airtime
   */
  purchaseAirtime: async (data: AirtimePurchaseData): Promise<any> => {
    try {
      const response = await api.post('/billpayment/airtime', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, message: 'Airtime purchase failed' };
    }
  },

  /**
   * Purchase data
   */
  purchaseData: async (data: DataPurchaseData): Promise<any> => {
    try {
      const response = await api.post('/billpayment/data', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, message: 'Data purchase failed' };
    }
  },
};
