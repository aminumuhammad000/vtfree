import { Request, Response } from 'express';
import VTfreeUser from '../models/vtfree_user.model.js';
import VTfreeTransaction from '../models/vtfree_transaction.model.js';
import { v4 as uuidv4 } from 'uuid';

export const getWallet = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        console.log(`[getWallet] Looking up wallet for userId: ${userId}`);
        const user = await VTfreeUser.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const transactions = await VTfreeTransaction.find({ user_id: userId })
            .sort({ created_at: -1 })
            .limit(20);

        return res.status(200).json({
            success: true,
            data: {
                balance: user.wallet_balance,
                transactions,
            },
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// DEV ONLY: Fund wallet for testing
export const fundWallet = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
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
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
