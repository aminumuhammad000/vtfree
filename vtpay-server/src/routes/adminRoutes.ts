import { Router, Response } from 'express';
import { User, Zainbox, VirtualAccount, Wallet } from '../models';
import { authenticate, AuthenticatedRequest } from '../middleware';

const router = Router();

// All admin routes require authentication
// TODO: Add role-based authorization middleware to ensure only admins can access
router.use(authenticate);

/**
 * Get all tenants (users)
 * GET /api/admin/tenants
 */
router.get('/tenants', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });

        res.json({
            success: true,
            data: users,
        });
    } catch (error) {
        console.error('Get tenants error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get tenants',
        });
    }
});

/**
 * Get tenant by ID
 * GET /api/admin/tenants/:id
 */
router.get('/tenants/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-passwordHash');

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'Tenant not found',
            });
            return;
        }

        // Get associated data
        const wallet = await Wallet.findOne({ userId: id });
        const zainboxes = await Zainbox.find({ userId: id });
        const virtualAccounts = await VirtualAccount.find({ userId: id });

        res.json({
            success: true,
            data: {
                user,
                wallet,
                zainboxes,
                virtualAccounts,
            },
        });
    } catch (error) {
        console.error('Get tenant by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get tenant',
        });
    }
});

/**
 * Update tenant status
 * PATCH /api/admin/tenants/:id/status
 */
router.patch('/tenants/:id/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'suspended', 'pending'].includes(status)) {
            res.status(400).json({
                success: false,
                message: 'Invalid status. Must be active, suspended, or pending',
            });
            return;
        }

        const user = await User.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).select('-passwordHash');

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'Tenant not found',
            });
            return;
        }

        res.json({
            success: true,
            message: `Tenant status updated to ${status}`,
            data: user,
        });
    } catch (error) {
        console.error('Update tenant status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update tenant status',
        });
    }
});

/**
 * Get all zainboxes (admin view)
 * GET /api/admin/zainboxes
 */
router.get('/zainboxes', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const zainboxes = await Zainbox.find()
            .populate('userId', 'email firstName lastName businessName')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: zainboxes,
        });
    } catch (error) {
        console.error('Get all zainboxes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get zainboxes',
        });
    }
});

/**
 * Get zainbox by code (admin view with full details)
 * GET /api/admin/zainboxes/:zainboxCode
 */
router.get('/zainboxes/:zainboxCode', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { zainboxCode } = req.params;

        const zainbox = await Zainbox.findOne({ zainboxCode })
            .populate('userId', 'email firstName lastName businessName');

        if (!zainbox) {
            res.status(404).json({
                success: false,
                message: 'Zainbox not found',
            });
            return;
        }

        // Get associated virtual accounts
        const virtualAccounts = await VirtualAccount.find({ zainboxCode });

        res.json({
            success: true,
            data: {
                zainbox,
                virtualAccounts,
            },
        });
    } catch (error) {
        console.error('Get zainbox by code error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get zainbox',
        });
    }
});

export default router;
