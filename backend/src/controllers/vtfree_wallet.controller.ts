import { Request, Response } from 'express';
import VTfreeUser from '../models/vtfree_user.model.js';
import VTfreeTransaction from '../models/vtfree_transaction.model.js';
import { logger } from '../config/bootstrap.js';

export const getWallet = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const user = await VTfreeUser.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Fetch recent transactions
        const transactions = await VTfreeTransaction.find({ user_id: userId })
            .sort({ created_at: -1 })
            .limit(20);

        res.json({
            success: true,
            data: {
                balance: user.wallet_balance,
                virtual_account: user.virtual_account,
                transactions
            }
        });
    } catch (error: any) {
        logger.error('Get wallet error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const fundWallet = async (req: Request, res: Response) => {
    // This might be for manual funding simulation or payment gateway initialization
    // For now, returning a mock success or implementing a basic logic
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount' });
        }

        // This endpoint might be used for testing or initializing a gateway transaction
        // Since the main flow is Virtual Account, we can just return a message or handle manual funding if enabled

        return res.status(400).json({
            success: false,
            message: 'Please use the Virtual Account transfer method to fund your wallet.'
        });

    } catch (error: any) {
        logger.error('Fund wallet error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
