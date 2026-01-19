import { Router, Request, Response } from 'express';
import { zainpayService } from '../services';

const router = Router();

/**
 * Get list of banks
 * GET /api/banks
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('GET /api/banks - Fetching bank list from Zainpay...');
        const response = await zainpayService.getBankList();

        if (response.code !== '00') {
            console.error('Zainpay Error in getBankList:', response);
            res.status(400).json({
                success: false,
                message: response.description || 'Failed to get bank list',
            });
            return;
        }

        console.log(`Successfully fetched ${response.data?.length || 0} banks`);
        res.json({
            success: true,
            data: response.data,
        });
    } catch (error: any) {
        console.error('Get bank list error:', error.message);
        if (error.response) {
            console.error('Zainpay API Status:', error.response.status);
            console.error('Zainpay API Data:', error.response.data);
        }
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
    } catch (error: any) {
        console.error('Name enquiry error:', error.message);
        if (error.response) {
            console.error('Zainpay API Status:', error.response.status);
            console.error('Zainpay API Data:', error.response.data);
        }
        res.status(500).json({
            success: false,
            message: 'Failed to verify account',
        });
    }
});

export default router;
