import { Request, Response } from 'express';
import CreatedApp from '../../models/created_app.model.js';

export const getAppConfigs = async (req: Request, res: Response) => {
    try {
        const app_id = (req as any).user.app_id;
        const app = await CreatedApp.findOne({ app_id });

        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found' });
        }

        res.json({
            success: true,
            data: {
                branding: app.branding,
                services: app.services,
                status: app.status
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateAppConfig = async (req: Request, res: Response) => {
    try {
        const app_id = (req as any).user.app_id;
        const { branding, services } = req.body;

        const app = await CreatedApp.findOne({ app_id });

        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found' });
        }

        // Update fields if provided
        if (branding) {
            app.branding = { ...app.branding, ...branding };
        }

        // Services might require more validation in a real scenario (e.g. paying for upgrades)
        // For now preventing service updates via this endpoint or strictly validating
        // if (services) app.services = services; 

        await app.save();

        res.json({
            success: true,
            message: 'App configuration updated successfully',
            data: {
                branding: app.branding
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
