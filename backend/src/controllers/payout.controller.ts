import { Response } from 'express';
import { VTPayService } from '../services/vtpay.service.js';
import { payrantService } from '../services/payrant.service.js';
import { configService } from '../services/config.service.js';
import { AuthRequest } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';

export class PayoutController {
    /**
     * Get active payout service
     */
    private static async getActiveService() {
        const defaultGateway = await configService.get('DEFAULT_PAYMENT_GATEWAY') || 'vtpay';
        if (defaultGateway === 'payrant') {
            return payrantService;
        }
        return VTPayService;
    }

    /**
     * Get list of banks from active gateway
     */
    static async getBanksList(req: AuthRequest, res: Response) {
        try {
            const service = await this.getActiveService();
            const result = await service.getBanksList();

            // VTPay returns { status, data: { banks } }
            // Payrant returns banks array directly
            const banks = Array.isArray(result) ? result : (result.data?.banks || result.banks || []);

            return ApiResponse.success(res, banks, 'Banks list retrieved successfully');
        } catch (error: any) {
            return ApiResponse.error(res, error.message, 500);
        }
    }

    /**
     * Validate bank account
     */
    static async validateAccount(req: AuthRequest, res: Response) {
        try {
            const { bank_code, account_number } = req.body;

            if (!bank_code || !account_number) {
                return ApiResponse.error(res, 'Bank code and account number are required', 400);
            }

            const service = await this.getActiveService();
            const result = await service.validateAccount(bank_code, account_number);

            // Normalize response
            const accountName = result.account_name || result.data?.account_name || result.accountName;

            if (accountName) {
                return ApiResponse.success(res, {
                    verified: true,
                    account_name: accountName
                }, 'Account validated successfully');
            }

            return ApiResponse.error(res, 'Account validation failed', 400);
        } catch (error: any) {
            return ApiResponse.error(res, error.message, 500);
        }
    }

    /**
     * Get balance from active gateway
     */
    static async getVTPayBalance(req: AuthRequest, res: Response) {
        try {
            const service = await this.getActiveService();

            // Check if service has getBalance method
            if (typeof (service as any).getBalance !== 'function') {
                return ApiResponse.success(res, { balance: 0, currency: 'NGN' }, 'Balance not supported for this gateway');
            }

            const result = await (service as any).getBalance();

            if (result.status === 'success') {
                return ApiResponse.success(res, result.data, 'Balance retrieved successfully');
            }

            return ApiResponse.error(res, result.message || 'Failed to fetch balance', 400);
        } catch (error: any) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
}
