import { Router, Response } from 'express';
import { User, Zainbox } from '../models';
import { authenticate, AuthenticatedRequest, requireAdmin } from '../middleware';
import { zainpayService } from '../services/ZainpayService';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Create a new Zainbox (Admin Only)
 * POST /api/zainbox
 */
router.post('/', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const { name, emailNotification, tags, callbackUrl } = req.body;

        const user = await User.findById(userId);
        if (!user || user.status !== 'active') {
            res.status(403).json({
                success: false,
                message: 'Your account must be active to create a Zainbox.',
            });
            return;
        }

        if (user.kycLevel < 3) {
            res.status(403).json({
                success: false,
                message: 'Your KYC must be approved before you can create a Zainbox.',
            });
            return;
        }

        if (!name || !emailNotification || !tags || !callbackUrl) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields: name, emailNotification, tags, callbackUrl',
            });
            return;
        }

        // Call Zainpay API to create Zainbox
        console.log('Creating Zainbox on Zainpay with payload:', { name, emailNotification, tags, callbackUrl });
        const zainpayResponse = await zainpayService.createZainbox({
            name,
            emailNotification,
            tags,
            callbackUrl,
        });

        console.log('Zainpay response:', JSON.stringify(zainpayResponse, null, 2));

        if (zainpayResponse.code !== '00' || !zainpayResponse.data) {
            res.status(400).json({
                success: false,
                message: zainpayResponse.description || 'Failed to create Zainbox on Zainpay',
            });
            return;
        }

        // Handle both array and single object responses
        let createdZainboxData: any;
        if (Array.isArray(zainpayResponse.data)) {
            createdZainboxData = zainpayResponse.data.find((z: any) => z.name === name) || zainpayResponse.data[0];
        } else {
            createdZainboxData = zainpayResponse.data;
        }

        if (!createdZainboxData || !createdZainboxData.zainboxCode || !createdZainboxData.codeName) {
            console.error('Invalid Zainbox data received:', createdZainboxData);
            res.status(500).json({
                success: false,
                message: 'Zainbox created but returned incomplete data from Zainpay',
            });
            return;
        }

        // Save to local DB
        const zainbox = new Zainbox({
            userId,
            name: createdZainboxData.name || name,
            emailNotification: createdZainboxData.emailNotification || emailNotification,
            tags: createdZainboxData.tags || tags,
            callbackUrl: createdZainboxData.callbackUrl || callbackUrl,
            codeName: createdZainboxData.codeName,
            zainboxCode: createdZainboxData.zainboxCode,
            isLive: createdZainboxData.isLive || false,
        });

        await zainbox.save();

        res.status(201).json({
            success: true,
            message: 'Zainbox created successfully',
            data: zainbox,
        });

    } catch (error: any) {
        console.error('Create Zainbox error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create Zainbox',
        });
    }
});

/**
 * List all Zainboxes for the user
 * GET /api/zainbox
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const zainboxes = await Zainbox.find({ userId });

        res.json({
            success: true,
            data: zainboxes,
        });
    } catch (error) {
        console.error('List Zainboxes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to list Zainboxes',
        });
    }
});

/**
 * Get Zainbox Profile (Sync with Zainpay)
 * GET /api/zainbox/:zainboxCode
 */
router.get('/:zainboxCode', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const { zainboxCode } = req.params;

        const zainbox = await Zainbox.findOne({ userId, zainboxCode });

        if (!zainbox) {
            res.status(404).json({
                success: false,
                message: 'Zainbox not found',
            });
            return;
        }

        // Fetch latest profile from Zainpay
        const profileResponse = await zainpayService.getZainboxProfile(zainboxCode);

        if (profileResponse.code === '00' && profileResponse.data) {
            // Update local DB if needed
            // For now just return the combined data
            res.json({
                success: true,
                data: {
                    local: zainbox,
                    remote: profileResponse.data
                }
            });
        } else {
            res.json({
                success: true,
                message: 'Local data retrieved, failed to fetch remote profile',
                data: {
                    local: zainbox,
                    remote: null
                }
            });
        }

    } catch (error) {
        console.error('Get Zainbox Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get Zainbox profile',
        });
    }
});

export default router;
