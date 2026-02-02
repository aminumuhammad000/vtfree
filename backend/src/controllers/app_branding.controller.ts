import { Request, Response } from 'express';
import CreatedApp from '../models/created_app.model.js';
import path from 'path';
import fs from 'fs';
import { cloudinaryService } from '../services/cloudinary.service.js';

/**
 * GET /api/app-admin/branding
 * Fetch current app branding configuration
 */
export const getBranding = async (req: Request, res: Response) => {
    try {
        const app_id = (req as any).user.app_id;

        const app = await CreatedApp.findOne({ app_id });

        if (!app) {
            return res.status(404).json({
                success: false,
                message: 'App not found'
            });
        }

        // Return branding configuration with defaults
        const branding = {
            app_id: app.app_id,
            app_name: app.app_name,
            app_display_name: app.branding.app_display_name || app.app_name,
            app_tagline: app.branding.app_tagline || '',
            logo_url: app.branding.logo_url || '/default-logo.png',
            colors: {
                primary: app.branding.primary_color || '#16a34a',
                secondary: app.branding.secondary_color || '#22c55e',
                accent: app.branding.accent_color || '#4ade80',
                background: app.branding.background_color || '#f8fafc',
                sidebarStart: app.branding.sidebar_bg_start || '#052e16',
                sidebarEnd: app.branding.sidebar_bg_end || '#14532d',
            },
            last_updated: app.branding.last_updated,
        };

        res.json({
            success: true,
            data: branding
        });
    } catch (error) {
        console.error('Get branding error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * PUT /api/app-admin/branding
 * Update app branding configuration
 */
export const updateBranding = async (req: Request, res: Response) => {
    try {
        const app_id = (req as any).user.app_id;
        const {
            app_display_name,
            app_tagline,
            colors
        } = req.body;

        // Validate color formats (basic hex validation)
        const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (colors) {
            const colorKeys = ['primary', 'secondary', 'accent', 'background', 'sidebarStart', 'sidebarEnd'];
            for (const key of colorKeys) {
                if (colors[key] && !hexColorRegex.test(colors[key])) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid color format for ${key}. Must be a valid hex color.`
                    });
                }
            }
        }

        const app = await CreatedApp.findOne({ app_id });

        if (!app) {
            return res.status(404).json({
                success: false,
                message: 'App not found'
            });
        }

        // Update branding fields
        if (app_display_name !== undefined) {
            app.branding.app_display_name = app_display_name;
        }
        if (app_tagline !== undefined) {
            app.branding.app_tagline = app_tagline;
        }
        if (colors) {
            if (colors.primary) app.branding.primary_color = colors.primary;
            if (colors.secondary) app.branding.secondary_color = colors.secondary;
            if (colors.accent) app.branding.accent_color = colors.accent;
            if (colors.background) app.branding.background_color = colors.background;
            if (colors.sidebarStart) app.branding.sidebar_bg_start = colors.sidebarStart;
            if (colors.sidebarEnd) app.branding.sidebar_bg_end = colors.sidebarEnd;
        }

        app.branding.last_updated = new Date();
        await app.save();

        // Return updated branding
        const branding = {
            app_id: app.app_id,
            app_name: app.app_name,
            app_display_name: app.branding.app_display_name || app.app_name,
            app_tagline: app.branding.app_tagline || '',
            logo_url: app.branding.logo_url || '/default-logo.png',
            colors: {
                primary: app.branding.primary_color,
                secondary: app.branding.secondary_color,
                accent: app.branding.accent_color,
                background: app.branding.background_color,
                sidebarStart: app.branding.sidebar_bg_start,
                sidebarEnd: app.branding.sidebar_bg_end,
            },
            last_updated: app.branding.last_updated,
        };

        res.json({
            success: true,
            message: 'Branding updated successfully',
            data: branding
        });
    } catch (error) {
        console.error('Update branding error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * POST /api/app-admin/branding/logo
 * Upload app logo
 */
export const uploadLogo = async (req: Request, res: Response) => {
    try {
        const app_id = (req as any).user.app_id;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const app = await CreatedApp.findOne({ app_id });

        if (!app) {
            return res.status(404).json({
                success: false,
                message: 'App not found'
            });
        }

        // Upload to Cloudinary
        const uploadResult = await cloudinaryService.uploadImage(req.file.path, `vtfree/logos/${app_id}`);

        // Delete old logo from Cloudinary if it was a Cloudinary URL
        if (app.branding.logo_url && app.branding.logo_url.includes('cloudinary.com')) {
            const publicId = cloudinaryService.getPublicIdFromUrl(app.branding.logo_url);
            if (publicId) {
                await cloudinaryService.deleteImage(publicId);
            }
        } else if (app.branding.logo_url) {
            // Delete old local logo if exists
            const oldLogoPath = path.join(process.cwd(), 'uploads', app.branding.logo_url.replace('/uploads/', ''));
            if (fs.existsSync(oldLogoPath)) {
                fs.unlinkSync(oldLogoPath);
            }
        }

        // Save new logo URL
        const logoUrl = uploadResult.secure_url;
        app.branding.logo_url = logoUrl;
        app.branding.last_updated = new Date();
        await app.save();

        // Clean up local file after upload
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.json({
            success: true,
            message: 'Logo uploaded successfully',
            data: {
                logo_url: logoUrl
            }
        });
    } catch (error) {
        console.error('Upload logo error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
