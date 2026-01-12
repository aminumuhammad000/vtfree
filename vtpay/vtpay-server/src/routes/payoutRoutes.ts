import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware';
import { walletService } from '../services/WalletService';
import { zainpayService } from '../services/ZainpayService';
import { User, Zainbox } from '../models';
import mongoose from 'mongoose';
import config from '../config';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Initiate Payout (Reference-Based)
 * POST /api/payout
 */
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const {
            amount,
            reference,
            destinationBankCode,
            destinationAccountNumber,
            narration
        } = req.body;

        if (!amount || !reference || !destinationBankCode || !destinationAccountNumber) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields',
            });
            return;
        }

        // 1. Check Balance by Reference
        const availableBalance = await walletService.getBalanceByReference(userId, reference);
        if (availableBalance < amount) {
            res.status(400).json({
                success: false,
                message: 'Insufficient balance for this reference',
                data: {
                    availableBalance,
                    requestedAmount: amount,
                },
            });
            return;
        }

        // 2. Initiate Transfer via Zainpay
        // Note: Zainpay expects amount in Naira or Kobo? 
        // Based on previous code, Zainpay usually works with Kobo, but let's assume input amount is Kobo for consistency with WalletService.
        // If input is Naira, we should convert. Let's assume input is Kobo (frontend should handle).

        // Get user's Zainbox
        const userZainbox = await Zainbox.findOne({ userId: new mongoose.Types.ObjectId(userId) });
        if (!userZainbox) {
            res.status(400).json({
                success: false,
                message: 'No Zainbox found for user. Please contact support.',
            });
            return;
        }

        const txnRef = `PAYOUT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const zainpayResponse = await zainpayService.fundTransfer({
            destinationBankCode,
            destinationAccountNumber,
            amount: amount.toString(),
            sourceAccountNumber: userZainbox.zainboxCode, // Using Zainbox code as source for now, or specific virtual account?
            sourceBankCode: '',
            narration: narration || `Payout for ref: ${reference}`,
            zainboxCode: userZainbox.zainboxCode,
            txnRef,
        });

        if (!zainpayResponse || zainpayResponse.code !== '00') {
            // Handle failure
            res.status(400).json({
                success: false,
                message: zainpayResponse?.description || 'Transfer failed',
                data: zainpayResponse
            });
            return;
        }

        // 3. Debit Wallet (and tag with reference)
        // We debit the user's main wallet, but tag it with the customerReference so the "Balance by Reference" decreases.
        const transaction = await walletService.debitWallet(
            userId,
            amount,
            0, // Fee?
            'withdrawal',
            narration || `Payout for ref: ${reference}`,
            txnRef,
            {
                destinationBankCode,
                destinationAccountNumber,
                zainpayResponse,
            },
            reference // customerReference
        );

        res.json({
            success: true,
            message: 'Payout initiated successfully',
            data: {
                transaction,
                zainpayResponse,
            },
        });

    } catch (error: any) {
        console.error('Payout error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to initiate payout',
        });
    }
});

/**
 * Get Balance by Reference
 * GET /api/payout/balance/:reference
 */
router.get('/balance/:reference', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const { reference } = req.params;

        const balance = await walletService.getBalanceByReference(userId, reference);

        res.json({
            success: true,
            data: {
                reference,
                balance,
            },
        });
    } catch (error) {
        console.error('Get balance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get balance',
        });
    }
});

/**
 * Get Saved Bank Details
 * GET /api/payout/saved-account
 */
router.get('/saved-account', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const user = await User.findById(userId);

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        res.json({
            success: true,
            data: user.savedBankDetails || null,
        });
    } catch (error) {
        console.error('Get saved account error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get saved account',
        });
    }
});

/**
 * Save Bank Details
 * POST /api/payout/saved-account
 */
router.post('/saved-account', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const { bankCode, bankName, accountNumber, accountName } = req.body;

        if (!bankCode || !bankName || !accountNumber || !accountName) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields',
            });
            return;
        }

        const user = await User.findByIdAndUpdate(
            userId,
            {
                savedBankDetails: {
                    bankCode,
                    bankName,
                    accountNumber,
                    accountName,
                },
            },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Bank details saved successfully',
            data: user?.savedBankDetails,
        });
    } catch (error) {
        console.error('Save bank details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save bank details',
        });
    }
});

export default router;
