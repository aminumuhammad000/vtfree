import { Router, Request, Response } from 'express';
import { payrantService } from '../services/PayrantService';

const router = Router();

/**
 * Get list of banks
 * GET /api/banks
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('GET /api/banks - Fetching bank list from Payrant...');
        const banks = await payrantService.getBanksList();

        console.log(`Successfully fetched ${banks.length} banks`);

        // Transform to frontend expectation if needed, or send as is
        // Payrant returns { bankCode, bankName, bankUrl, bgUrl }
        // Frontend likely expects { code, name } or uses bankCode/bankName mapping

        // Let's map it to be safe for existing frontend if it used { code, name }
        // But checking Frontend code (Step 263), it uses:
        // banks.find(b => b.code === transferData.bankCode)
        // So it expects `code` and `name`.

        const mappedBanks = banks.map(b => ({
            code: b.bankCode,
            name: b.bankName,
            bankUrl: b.bankUrl,
            bgUrl: b.bgUrl
        }));

        res.json({
            success: true,
            data: mappedBanks,
        });
    } catch (error: any) {
        console.error('Get bank list error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to get bank list',
            error: error.message
        });
    }
});

/**
 * Validate bank account (Name Enquiry)
 * GET /api/banks/verify
 */
router.get('/verify', async (req: Request, res: Response): Promise<void> => {
    try {
        const { bankCode, accountNumber } = req.query;

        if (!bankCode || !accountNumber) {
            res.status(400).json({
                success: false,
                message: 'bankCode and accountNumber are required',
            });
            return;
        }

        console.log(`Verifying account ${accountNumber} at bank ${bankCode}...`);

        const result = await payrantService.validateAccount(
            bankCode as string,
            accountNumber as string
        );

        res.json({
            success: true,
            data: {
                accountName: result.account_name,
                accountNumber: result.account_number,
                bankCode: result.bank_code,
                verified: result.verified
            },
        });
    } catch (error: any) {
        console.error('Name enquiry error:', error.message);
        const message = error.response?.data?.message || error.message || 'Failed to verify account';
        res.status(400).json({
            success: false,
            message: message,
        });
    }
});

export default router;
