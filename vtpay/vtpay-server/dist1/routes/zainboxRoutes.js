"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const middleware_1 = require("../middleware");
const ZainpayService_1 = require("../services/ZainpayService");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(middleware_1.authenticate);
/**
 * Create a new Zainbox (Admin Only)
 * POST /api/zainbox
 */
router.post('/', middleware_1.requireAdmin, async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, emailNotification, tags, callbackUrl } = req.body;
        const user = await models_1.User.findById(userId);
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
        // Check if user already has a Zainbox
        const existingZainbox = await models_1.Zainbox.findOne({ userId });
        if (existingZainbox) {
            res.status(400).json({
                success: false,
                message: 'User already has a Zainbox assigned.',
                data: existingZainbox
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
        const zainpayResponse = await ZainpayService_1.zainpayService.createZainbox({
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
        let createdZainboxData;
        if (Array.isArray(zainpayResponse.data)) {
            createdZainboxData = zainpayResponse.data.find((z) => z.name === name) || zainpayResponse.data[0];
        }
        else {
            createdZainboxData = zainpayResponse.data;
        }
        if (!createdZainboxData || !createdZainboxData.codeName) {
            console.error('Invalid Zainbox data received:', createdZainboxData);
            res.status(500).json({
                success: false,
                message: 'Zainbox created but returned incomplete data from Zainpay',
            });
            return;
        }
        // Save to local DB
        const zainboxCode = createdZainboxData.zainboxCode || createdZainboxData.codeName;
        let zainbox = await models_1.Zainbox.findOne({ zainboxCode });
        if (zainbox) {
            // Update existing
            zainbox.userId = new mongoose_1.default.Types.ObjectId(userId);
            zainbox.name = createdZainboxData.name || name;
            zainbox.emailNotification = createdZainboxData.emailNotification || emailNotification;
            zainbox.tags = createdZainboxData.tags || tags;
            zainbox.callbackUrl = createdZainboxData.callbackUrl || callbackUrl;
            zainbox.codeName = createdZainboxData.codeName;
            zainbox.isLive = createdZainboxData.isLive || false;
            await zainbox.save();
            console.log('Existing Zainbox updated:', zainbox._id);
        }
        else {
            // Create new
            zainbox = new models_1.Zainbox({
                userId,
                name: createdZainboxData.name || name,
                emailNotification: createdZainboxData.emailNotification || emailNotification,
                tags: createdZainboxData.tags || tags,
                callbackUrl: createdZainboxData.callbackUrl || callbackUrl,
                codeName: createdZainboxData.codeName,
                zainboxCode: zainboxCode,
                isLive: createdZainboxData.isLive || false,
            });
            await zainbox.save();
            console.log('New Zainbox created:', zainbox._id);
        }
        res.status(201).json({
            success: true,
            message: 'Zainbox created successfully',
            data: zainbox,
        });
    }
    catch (error) {
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
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const zainboxes = await models_1.Zainbox.find({ userId });
        res.json({
            success: true,
            data: zainboxes,
        });
    }
    catch (error) {
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
router.get('/:zainboxCode', async (req, res) => {
    try {
        const userId = req.user.id;
        const { zainboxCode } = req.params;
        const zainbox = await models_1.Zainbox.findOne({ userId, zainboxCode });
        if (!zainbox) {
            res.status(404).json({
                success: false,
                message: 'Zainbox not found',
            });
            return;
        }
        // Fetch latest profile from Zainpay
        const profileResponse = await ZainpayService_1.zainpayService.getZainboxProfile(zainboxCode);
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
        }
        else {
            res.json({
                success: true,
                message: 'Local data retrieved, failed to fetch remote profile',
                data: {
                    local: zainbox,
                    remote: null
                }
            });
        }
    }
    catch (error) {
        console.error('Get Zainbox Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get Zainbox profile',
        });
    }
});
exports.default = router;
//# sourceMappingURL=zainboxRoutes.js.map