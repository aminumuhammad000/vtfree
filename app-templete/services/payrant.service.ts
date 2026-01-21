import api from './api';

export interface CreateVirtualAccountData {
  documentType: string;
  documentNumber: string;
  virtualAccountName: string;
  customerName: string;
  email: string;
  accountReference: string;
  recreate?: boolean;
}

export interface VirtualAccountResponse {
  account_number: string;
  account_name: string;
  bank_name: string;
  account_reference: string;
  provider: string;
  status: string;
  virtualAccountName?: string;
  virtualAccountNo?: string;
  identityType?: string;
  licenseNumber?: string;
  customerName?: string;
}

// Type guard to check if an object is a VirtualAccountResponse
export function isVirtualAccountResponse(obj: any): obj is VirtualAccountResponse {
  return (
    obj &&
    typeof obj === 'object' &&
    'account_number' in obj &&
    'account_name' in obj &&
    'bank_name' in obj &&
    'account_reference' in obj &&
    'provider' in obj &&
    'status' in obj
  );
}

export interface PayrantWebhookPayload {
  status: string;
  transaction: {
    reference: string;
    amount: number;
    net_amount: number;
    fee: number;
    currency: string;
    timestamp: string;
    user_id: number;
    account_details: {
      account_number: string;
      account_name: string;
    };
    payer_details: {
      account_number: string;
      account_name: string;
      bank_name: string;
    };
    metadata: any;
  };
}

export const payrantService = {
  /**
   * Create a new Payrant virtual account
   */
  createVirtualAccount: async (data: CreateVirtualAccountData): Promise<VirtualAccountResponse> => {
    try {
      console.log('🏦 Creating Payrant virtual account...');

      const response = await api.post<VirtualAccountResponse>('/payment/payrant/create-virtual-account', data);

      console.log('✅ Virtual account created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create virtual account:', error);

      if (error.response?.data) {
        throw error.response.data;
      }

      throw {
        success: false,
        message: error.message || 'Failed to create virtual account. Please try again.',
      };
    }
  },

  /**
   * Get user's virtual account details
   */
  getVirtualAccount: async (): Promise<VirtualAccountResponse[] | { exists: boolean } | null> => {
    try {
      console.log('🔍 [Payrant Service] Fetching virtual account...');

      type ApiResponse = {
        success: boolean;
        message: string;
        data?: {
          data?: VirtualAccountResponse | VirtualAccountResponse[] | { exists: boolean };
        };
      };

      const response = await api.get<ApiResponse>('/payment/payrant/virtual-account');

      if (!response.data.success) {
        return { exists: false };
      }

      const responseData = response.data.data?.data;

      // Handle array of accounts
      if (Array.isArray(responseData)) {
        return responseData;
      }

      // Handle single account object
      if (responseData && isVirtualAccountResponse(responseData)) {
        return [responseData];
      }

      // Handle case where data is in the root
      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      if (response.data.data && isVirtualAccountResponse(response.data.data as any)) {
        return [response.data.data as VirtualAccountResponse];
      }

      if (responseData && 'exists' in responseData && responseData.exists === false) {
        return { exists: false };
      }

      return { exists: false };
    } catch (error: any) {
      console.error('❌ Failed to fetch virtual account:', error);
      if (error.response?.status === 404) return null;
      throw {
        success: false,
        message: error.message || 'Failed to fetch virtual account.',
      };
    }
  },
};
