import VTfreeUser from '../models/vtfree_user.model.js';
import VTfreeTransaction from '../models/vtfree_transaction.model.js';
import { v4 as uuidv4 } from 'uuid';
export const getWallet = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`[getWallet] 🔍 Requesting wallet for userId: ${userId}`);
        const user = await VTfreeUser.findById(userId);
        if (!user) {
            console.log(`[getWallet] ❌ User not found: ${userId}`);
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        console.log(`[getWallet] ✅ User found: ${user.email}, Balance: ${user.wallet_balance}`);
        const transactions = await VTfreeTransaction.find({ user_id: userId })
            .sort({ created_at: -1 })
            .limit(20);
        // Ensure balance is a number and return it
        const balance = typeof user.wallet_balance === 'number' ? user.wallet_balance : 0;
        return res.status(200).json({
            success: true,
            data: {
                balance: balance,
                transactions,
            },
        });
    }
    catch (error) {
        console.error(`[getWallet] 💥 Error:`, error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
// DEV ONLY: Fund wallet for testing
export const fundWallet = async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount' });
        }
        const user = await VTfreeUser.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        // Create transaction
        const reference = `FUND-${uuidv4()}`;
        const transaction = await VTfreeTransaction.create({
            user_id: userId,
            type: 'credit',
            amount,
            reference,
            description: 'Wallet Funding (Test)',
            status: 'success',
        });
        // Update balance
        user.wallet_balance += amount;
        await user.save();
        return res.status(200).json({
            success: true,
            message: 'Wallet funded successfully',
            data: {
                balance: user.wallet_balance,
                transaction,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
