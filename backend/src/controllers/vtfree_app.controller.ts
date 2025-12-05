import { Request, Response } from 'express';
import CreatedApp from '../models/created_app.model.js';
import AppAdmin from '../models/app_admin.model.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { AppCreationService } from '../services/app_creation.service.js';
export const createApp = async (req: Request, res: Response) => {
    try {
        const { app_name, package_name, platforms, branding } = req.body;
        const owner_id = (req as any).user.id; // Fixed: use .id instead of .user_id
        const owner_email = (req as any).user.email;

        const result = await AppCreationService.createNewApp({
            owner_id,
            owner_email,
            app_name,
            package_name,
            platforms,
            branding
        });

        res.status(201).json({
            success: true,
            message: 'App created successfully',
            data: result
        });
    } catch (error: any) {
        console.error('Create app error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export const getMyApps = async (req: Request, res: Response) => {
    try {
        const owner_id = (req as any).user.user_id;
        const apps = await CreatedApp.find({ owner_id }).sort({ created_at: -1 });

        res.json({
            success: true,
            data: { apps }
        });
    } catch (error) {
        console.error('Get apps error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAppDetails = async (req: Request, res: Response) => {
    try {
        const { appId } = req.params;
        const owner_id = (req as any).user.user_id;

        const app = await CreatedApp.findOne({ app_id: appId, owner_id });
        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found' });
        }

        res.json({
            success: true,
            data: { app }
        });
    } catch (error) {
        console.error('Get app details error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
