import { User, CreatedApp } from '../models/index.js';
import { EmailService } from '../services/email.service.js';
import { ApiResponse } from '../utils/response.js';
import bcrypt from 'bcryptjs';
import { configService } from '../services/config.service.js';
export class UserController {
    static async getProfile(req, res) {
        try {
            const user = await User.findById(req.user?.id).select('-password_hash');
            if (!user) {
                return ApiResponse.error(res, 'User not found', 404);
            }
            return ApiResponse.success(res, user, 'Profile retrieved successfully');
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
    static async updateProfile(req, res) {
        try {
            const allowedUpdates = [
                'first_name', 'last_name', 'address', 'city', 'state',
                'date_of_birth', 'phone_number', 'bvn', 'nin', 'kyc_status'
            ];
            const updates = Object.keys(req.body)
                .filter(key => allowedUpdates.includes(key))
                .reduce((obj, key) => {
                obj[key] = req.body[key];
                return obj;
            }, {});
            const user = await User.findByIdAndUpdate(req.user?.id, { ...updates, updated_at: new Date() }, { new: true }).select('-password_hash');
            return ApiResponse.success(res, user, 'Profile updated successfully');
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
    static async uploadKYC(req, res) {
        try {
            const { kyc_document_id_front_url, kyc_document_id_back_url } = req.body;
            const autoApprove = await configService.get('KYC_AUTO_APPROVE', 'false');
            const kycStatus = autoApprove === 'true' ? 'verified' : 'pending';
            const user = await User.findByIdAndUpdate(req.user?.id, {
                kyc_document_id_front_url,
                kyc_document_id_back_url,
                kyc_status: kycStatus,
                updated_at: new Date()
            }, { new: true }).select('-password_hash');
            return ApiResponse.success(res, user, 'KYC documents uploaded successfully');
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
    static async getAllUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            // Build search query
            const search = req.query.search;
            const matchStage = {};
            if (search) {
                matchStage.$or = [
                    { first_name: { $regex: search, $options: 'i' } },
                    { last_name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phone_number: { $regex: search, $options: 'i' } }
                ];
            }
            // Filter by app_id if present in user token (for App Admins)
            if (req.user?.app_id) {
                matchStage.app_id = req.user.app_id;
            }
            const users = await User.aggregate([
                { $match: matchStage },
                { $sort: { created_at: -1 } },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'wallets',
                        localField: '_id',
                        foreignField: 'user_id',
                        as: 'wallet'
                    }
                },
                {
                    $addFields: {
                        wallet_balance: { $ifNull: [{ $arrayElemAt: ['$wallet.balance', 0] }, 0] }
                    }
                },
                {
                    $project: {
                        password_hash: 0,
                        wallet: 0
                    }
                }
            ]);
            const total = await User.countDocuments(matchStage);
            return ApiResponse.paginated(res, users, {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }, 'Users retrieved successfully');
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
    static async getUserById(req, res) {
        try {
            const user = await User.findById(req.params.id).select('-password_hash');
            if (!user) {
                return ApiResponse.error(res, 'User not found', 404);
            }
            // Fetch wallet balance manually since we're not using aggregation here for simplicity
            // (or we could import Wallet model, but let's assume we can import it or use aggregation)
            // To keep it consistent with getAllUsers, let's use aggregation or a separate query.
            // Since we need to import Wallet, let's just use aggregation for consistency.
            const matchStage = { _id: user._id };
            if (req.user?.app_id) {
                matchStage.app_id = req.user.app_id;
            }
            const userWithWallet = await User.aggregate([
                { $match: matchStage },
                {
                    $lookup: {
                        from: 'wallets',
                        localField: '_id',
                        foreignField: 'user_id',
                        as: 'wallet'
                    }
                },
                {
                    $addFields: {
                        wallet_balance: { $ifNull: [{ $arrayElemAt: ['$wallet.balance', 0] }, 0] }
                    }
                },
                {
                    $project: {
                        password_hash: 0,
                        wallet: 0
                    }
                }
            ]);
            if (!userWithWallet.length) {
                return ApiResponse.error(res, 'User not found', 404);
            }
            return ApiResponse.success(res, userWithWallet[0], 'User retrieved successfully');
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
    static async updateUser(req, res) {
        try {
            const allowedUpdates = ['first_name', 'last_name', 'email', 'phone_number', 'status', 'kyc_status'];
            const updates = Object.keys(req.body)
                .filter(key => allowedUpdates.includes(key))
                .reduce((obj, key) => {
                obj[key] = req.body[key];
                return obj;
            }, {});
            const query = { _id: req.params.id };
            if (req.user?.app_id) {
                query.app_id = req.user.app_id;
            }
            const oldUser = await User.findOne(query);
            if (!oldUser) {
                return ApiResponse.error(res, 'User not found', 404);
            }
            const user = await User.findOneAndUpdate(query, { ...updates, updated_at: new Date() }, { new: true }).select('-password_hash');
            if (!user) {
                return ApiResponse.error(res, 'User not found', 404);
            }
            // Detection logic for "Approving" the user
            const isStatusActivating = updates.status === 'active' && oldUser.status !== 'active';
            const isKYCVerifying = updates.kyc_status === 'verified' && oldUser.kyc_status !== 'verified';
            if (isStatusActivating || isKYCVerifying) {
                try {
                    // If KYC approved, automatically activate the account if it was inactive
                    if (isKYCVerifying && user.status === 'inactive') {
                        user.status = 'active';
                        await user.save();
                        console.log(`✅ User ${user.email} automatically activated upon KYC approval`);
                    }
                    // Fetch App Details for branding
                    const app = await CreatedApp.findOne({ app_id: user.app_id });
                    if (app) {
                        console.log(`📧 Sending branded approval email to ${user.email} for App: ${app.app_name}`);
                        await EmailService.sendKYCApproval(user.email, `${user.first_name} ${user.last_name}`, app);
                    }
                }
                catch (error) {
                    console.error('❌ Error in after-approval hooks:', error);
                }
            }
            return ApiResponse.success(res, user, 'User updated successfully');
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
    static async deleteUser(req, res) {
        try {
            const query = { _id: req.params.id };
            if (req.user?.app_id) {
                query.app_id = req.user.app_id;
            }
            const user = await User.findOneAndDelete(query);
            if (!user) {
                return ApiResponse.error(res, 'User not found', 404);
            }
            return ApiResponse.success(res, null, 'User deleted successfully');
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
    static async deleteProfile(req, res) {
        try {
            const user = await User.findByIdAndUpdate(req.user?.id, { status: 'deleted', updated_at: new Date() }, { new: true });
            if (!user) {
                return ApiResponse.error(res, 'User not found', 404);
            }
            return ApiResponse.success(res, null, 'Profile deactivated successfully');
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
    static async setTransactionPin(req, res) {
        try {
            const { pin } = req.body;
            if (!pin || !/^\d{4}$/.test(String(pin))) {
                return ApiResponse.error(res, 'PIN must be a 4-digit number', 400);
            }
            const user = await User.findById(req.user?.id);
            if (!user)
                return ApiResponse.error(res, 'User not found', 404);
            if (user.transaction_pin) {
                return ApiResponse.error(res, 'Transaction PIN already set. Use update endpoint.', 400);
            }
            const hash = await bcrypt.hash(String(pin), 10);
            user.transaction_pin = hash;
            user.updated_at = new Date();
            await user.save();
            return ApiResponse.success(res, null, 'Transaction PIN set successfully');
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
    static async updateTransactionPin(req, res) {
        try {
            const { current_pin, new_pin } = req.body;
            if (!new_pin || !/^\d{4}$/.test(String(new_pin))) {
                return ApiResponse.error(res, 'New PIN must be a 4-digit number', 400);
            }
            const user = await User.findById(req.user?.id);
            if (!user)
                return ApiResponse.error(res, 'User not found', 404);
            if (!user.transaction_pin) {
                const hash = await bcrypt.hash(String(new_pin), 10);
                user.transaction_pin = hash;
                user.updated_at = new Date();
                await user.save();
                return ApiResponse.success(res, null, 'Transaction PIN set successfully');
            }
            if (!current_pin || !/^\d{4}$/.test(String(current_pin))) {
                return ApiResponse.error(res, 'Current PIN is required and must be 4 digits', 400);
            }
            const ok = await bcrypt.compare(String(current_pin), user.transaction_pin);
            if (!ok) {
                return ApiResponse.error(res, 'Current PIN is incorrect', 400);
            }
            user.transaction_pin = await bcrypt.hash(String(new_pin), 10);
            user.updated_at = new Date();
            await user.save();
            return ApiResponse.success(res, null, 'Transaction PIN updated successfully');
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
    static async getReferrals(req, res) {
        try {
            const userId = req.user?.id;
            // Find all users who were referred by this user
            const referrals = await User.find({ referred_by: userId })
                .select('first_name last_name email phone_number created_at kyc_status referral_bonus_claimed')
                .sort({ created_at: -1 });
            return ApiResponse.success(res, referrals, 'Referrals retrieved successfully');
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
}
