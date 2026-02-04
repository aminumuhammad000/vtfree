import { User } from '../models/index.js';
import { ApiResponse } from '../utils/response.js';
export class PaymentController {
    /**
     * Deactivate user's virtual account
     * @param req Express request object
     * @param res Express response object
     */
    static async deactivateVirtualAccount(req, res) {
        try {
            const userId = req.user?.id;
            // Find user and update virtual account status
            const user = await User.findById(userId);
            if (!user || !user.virtual_account) {
                return ApiResponse.error(res, 'No active virtual account found', 404);
            }
            user.virtual_account.status = 'inactive';
            await user.save();
            return ApiResponse.success(res, null, 'Virtual account deactivated successfully');
        }
        catch (error) {
            console.error('Error deactivating virtual account:', error);
            return ApiResponse.error(res, 'Failed to deactivate virtual account');
        }
    }
    /**
     * Get list of supported banks
     */
    static async getBanks(_req, res) {
        return ApiResponse.success(res, 'Banks retrieved successfully', []);
    }
    static async initiatePayment(req, res) {
        return ApiResponse.error(res, 'Payment initiation via this route is deprecated. Please use VTPay.', 400);
    }
    /**
     * Verify payment status
     */
    static async verifyPayment(req, res) {
        return ApiResponse.error(res, 'Payment verification via this route is deprecated.', 400);
    }
    /**
     * Create Virtual Account
     */
    static async createVirtualAccount(req, res) {
        return ApiResponse.error(res, 'Please use VTPay dedicated endpoint for virtual accounts.', 400);
    }
    /**
     * Get user's virtual account
     */
    static async getVirtualAccount(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return ApiResponse.error(res, 'User not authenticated', 401);
            }
            const user = await User.findById(userId);
            if (!user) {
                return ApiResponse.error(res, 'User not found', 404);
            }
            if (!user.virtual_account || !user.virtual_account.account_number) {
                return ApiResponse.success(res, null, 'No virtual account found');
            }
            return ApiResponse.success(res, user.virtual_account, 'Virtual account retrieved successfully');
        }
        catch (error) {
            console.error('Get virtual account error:', error);
            return ApiResponse.error(res, error.message || 'Failed to get virtual account', 500);
        }
    }
}
