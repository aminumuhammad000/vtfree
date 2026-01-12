import { Router, Response } from 'express';
import crypto from 'crypto';
import { User } from '../models';
import { authenticate, AuthenticatedRequest } from '../middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Get current API Key
 * GET /api/developer/apikey
 */
router.get('/apikey', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
            data: {
                apiKey: user.apiKey || null,
            },
        });
    } catch (error) {
        console.error('Get API key error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get API key',
        });
    }
});

/**
 * Generate/Regenerate API Key
 * POST /api/developer/apikey
 */
router.post('/apikey', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const { Zainbox } = await import('../models');

        // Check if user has a Zainbox
        const zainbox = await Zainbox.findOne({ userId });
        if (!zainbox) {
            res.status(400).json({
                success: false,
                message: 'You must create a Zainbox before you can generate an API key.',
            });
            return;
        }

        const user = await User.findById(userId);

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        // Generate a new API key
        const randomPart = crypto.randomBytes(24).toString('hex');
        // If KYC level is less than 3 (Approved), generate a test key
        const prefix = user.kycLevel < 3 ? 'sk_test_' : 'sk_live_';
        const newApiKey = `${prefix}${randomPart}`;

        user.apiKey = newApiKey;
        await user.save();

        res.json({
            success: true,
            message: 'API key generated successfully',
            data: {
                apiKey: newApiKey,
            },
        });
    } catch (error) {
        console.error('Generate API key error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate API key',
        });
    }
});

export default router;
