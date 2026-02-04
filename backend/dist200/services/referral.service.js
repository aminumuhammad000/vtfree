// services/referral.service.ts
import { User } from '../models/index.js';
import CreatedApp from '../models/created_app.model.js';
import { WalletService } from './wallet.service.js';
import { Types } from 'mongoose';
export class ReferralService {
    /**
     * Process referral bonus when a user completes their first successful transaction
     * @param userId - The user who completed the transaction
     * @returns true if bonus was awarded, false otherwise
     */
    static async processFirstTransactionReferral(userId) {
        try {
            const uid = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
            // Get user details
            const user = await User.findById(uid);
            if (!user) {
                console.log('User not found for referral processing');
                return false;
            }
            // Check if user was referred by someone
            if (!user.referred_by) {
                console.log('User has no referrer');
                return false;
            }
            // Check if bonus already claimed
            if (user.referral_bonus_claimed) {
                console.log('Referral bonus already claimed for this user');
                return false;
            }
            // Get app settings to check if referral is enabled
            if (!user.app_id) {
                console.log('User has no app_id');
                return false;
            }
            const appData = await CreatedApp.findOne({ app_id: user.app_id });
            if (!appData?.referral_settings?.enabled || appData.referral_settings.amount <= 0) {
                console.log('Referral program not enabled or invalid amount');
                return false;
            }
            // Credit the referrer's wallet
            await WalletService.credit(user.referred_by, appData.referral_settings.amount, `Referral Bonus: ${user.first_name} ${user.last_name}`, 'referral_bonus', user.app_id);
            // Mark bonus as claimed
            user.referral_bonus_claimed = true;
            await user.save();
            console.log(`Referral bonus of ₦${appData.referral_settings.amount} awarded to referrer`);
            return true;
        }
        catch (error) {
            console.error('Error processing referral bonus:', error);
            return false;
        }
    }
}
