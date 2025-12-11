import { Router, Request, Response } from 'express';
import { zainpayService } from '../services';

const router = Router();

/**
 * Get list of banks
 * GET /api/banks
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const response = await zainpayService.getBankList();

        if (response.code !== '00') {
            res.status(400).json({
                success: false,
                message: response.description || 'Failed to get bank list',
            });
            return;
        }

        res.json({
            success: true,
            data: response.data,
        });
    } catch (error) {
        console.error('Get bank list error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get bank list',
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

        const response = await zainpayService.nameEnquiry(
            bankCode as string,
            accountNumber as string
        );

        if (response.code !== '00') {
            res.status(400).json({
                success: false,
                message: response.description || 'Failed to verify account',
            });
            return;
        }

        res.json({
            success: true,
            data: response.data,
        });
    } catch (error) {
        console.error('Name enquiry error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify account',
        });
    }
});

export default router;
