import { VTPayService } from '../services/vtpay.service.js';
import { ApiResponse } from '../utils/response.js';
export class PayoutController {
    /**
     * Get list of banks from VTPay
     */
    static async getBanksList(req, res) {
        try {
            const result = await VTPayService.getBanksList();
            if (result.status === 'success') {
                return ApiResponse.success(res, result.data, 'Banks list retrieved successfully');
            }
            return ApiResponse.error(res, result.message || 'Failed to fetch banks', 400);
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
    /**
     * Validate bank account
     */
    static async validateAccount(req, res) {
        try {
            const { bank_code, account_number } = req.body;
            if (!bank_code || !account_number) {
                return ApiResponse.error(res, 'Bank code and account number are required', 400);
            }
            const result = await VTPayService.validateAccount(bank_code, account_number);
            if (result.status === 'success') {
                return ApiResponse.success(res, result.data, 'Account validated successfully');
            }
            // Return error from VTPay
            return ApiResponse.error(res, result.message || 'Account validation failed', 400, result.data);
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
    /**
     * Get VTPay balance
     */
    static async getVTPayBalance(req, res) {
        try {
            const result = await VTPayService.getBalance();
            if (result.status === 'success') {
                return ApiResponse.success(res, result.data, 'V TPaybalance retrieved successfully');
            }
            return ApiResponse.error(res, result.message || 'Failed to fetch balance', 400);
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
}
