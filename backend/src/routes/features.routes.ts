import express from 'express';
import Feature from '../models/Feature.js';
import { authenticate as authenticateToken, authenticateSuperAdmin as requireSuperAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * GET /api/v1/features
 * Get all active features (public/authenticated)
 */
router.get('/', async (req, res) => {
    try {
        const features = await Feature.find({ is_active: true })
            .sort({ display_order: 1, name: 1 })
            .select('-__v');

        res.json({
            success: true,
            data: features
        });
    } catch (error: any) {
        console.error('Error fetching features:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch features',
            error: error.message
        });
    }
});

/**
 * GET /api/v1/features/:id
 * Get a single feature by ID or slug
 */
router.get('/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        const feature = await Feature.findOne({
            $or: [
                { feature_id: identifier },
                { slug: identifier }
            ]
        }).select('-__v');

        if (!feature) {
            return res.status(404).json({
                success: false,
                message: 'Feature not found'
            });
        }

        res.json({
            success: true,
            data: feature
        });
    } catch (error: any) {
        console.error('Error fetching feature:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch feature',
            error: error.message
        });
    }
});

/**
 * GET /api/v1/features/admin/all
 * Get all features including inactive (Super Admin only)
 */
router.get('/admin/all', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const features = await Feature.find()
            .sort({ display_order: 1, name: 1 })
            .select('-__v');

        res.json({
            success: true,
            data: features
        });
    } catch (error: any) {
        console.error('Error fetching all features:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch features',
            error: error.message
        });
    }
});

/**
 * POST /api/v1/features
 * Create a new feature (Super Admin only)
 */
router.post('/', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const featureData = req.body;

        const feature = new Feature(featureData);
        await feature.save();

        res.status(201).json({
            success: true,
            message: 'Feature created successfully',
            data: feature
        });
    } catch (error: any) {
        console.error('Error creating feature:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create feature',
            error: error.message
        });
    }
});

/**
 * PATCH /api/v1/features/:id
 * Update a feature (Super Admin only)
 */
router.patch('/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const feature = await Feature.findOneAndUpdate(
            { feature_id: id },
            { ...updates, updated_at: new Date() },
            { new: true, runValidators: true }
        );

        if (!feature) {
            return res.status(404).json({
                success: false,
                message: 'Feature not found'
            });
        }

        res.json({
            success: true,
            message: 'Feature updated successfully',
            data: feature
        });
    } catch (error: any) {
        console.error('Error updating feature:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update feature',
            error: error.message
        });
    }
});

/**
 * DELETE /api/v1/features/:id
 * Delete a feature (Super Admin only) - Soft delete by setting is_active to false
 */
router.delete('/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const feature = await Feature.findOneAndUpdate(
            { feature_id: id },
            { is_active: false, updated_at: new Date() },
            { new: true }
        );

        if (!feature) {
            return res.status(404).json({
                success: false,
                message: 'Feature not found'
            });
        }

        res.json({
            success: true,
            message: 'Feature deleted successfully'
        });
    } catch (error: any) {
        console.error('Error deleting feature:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete feature',
            error: error.message
        });
    }
});

export default router;
