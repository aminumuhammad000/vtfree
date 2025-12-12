import CreatedApp from '../models/created_app.model.js';
import { AppCreationService } from '../services/app_creation.service.js';
export const createApp = async (req, res) => {
    try {
        const { app_name, package_name, platforms, branding } = req.body;
        const owner_id = req.user.id; // Fixed: use .id instead of .user_id
        const owner_email = req.user.email;
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
    }
    catch (error) {
        console.error('Create app error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
export const getMyApps = async (req, res) => {
    try {
        const owner_id = req.user.user_id;
        const apps = await CreatedApp.find({ owner_id }).sort({ created_at: -1 });
        res.json({
            success: true,
            data: { apps }
        });
    }
    catch (error) {
        console.error('Get apps error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
export const getAppDetails = async (req, res) => {
    try {
        const { appId } = req.params;
        const owner_id = req.user.user_id;
        const app = await CreatedApp.findOne({ app_id: appId, owner_id });
        if (!app) {
            return res.status(404).json({ success: false, message: 'App not found' });
        }
        res.json({
            success: true,
            data: { app }
        });
    }
    catch (error) {
        console.error('Get app details error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
