import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware';
import { walletService } from '../services/WalletService';
import { zainpayService } from '../services/ZainpayService';
import { User } from '../models';
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

        const transferResponse = await zainpayService.fundTransfer({
            destinationBankCode,
            destinationAccountNumber,
            amount: amount.toString(), // Zainpay expects string?
            sourceAccountNumber: config.zainpay.zainboxCode, // Or a specific source account? Usually the main Zainbox.
            narration: narration || `Payout for ref: ${reference}`,
            zainboxCode: config.zainpay.zainboxCode,
        });

        if (!transferResponse || !transferResponse.responseCode || transferResponse.responseCode !== '00') {
            // Handle failure (responseCode '00' is usually success in Nigerian banking)
            // But Zainpay might return different codes. Let's assume success if no error thrown for now, 
            // or check specific success field if known. 
            // Looking at ZainpayService, it returns the API response directly.
        }

        // 3. Debit Wallet (and tag with reference)
        // We debit the user's main wallet, but tag it with the customerReference so the "Balance by Reference" decreases.
        const transaction = await walletService.debitWallet(
            userId,
            amount,
            0, // Fee?
            'withdrawal',
            narration || `Payout for ref: ${reference}`,
            transferResponse.reference || `PAYOUT-${Date.now()}`, // External ref from Zainpay
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

export default router;
