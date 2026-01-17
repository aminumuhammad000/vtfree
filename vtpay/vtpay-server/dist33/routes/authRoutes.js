"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const services_1 = require("../services");
const config_1 = __importDefault(require("../config"));
const router = (0, express_1.Router)();
/**
 * Register a new user
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, fullName, phone, businessName } = req.body;
        // Validate required fields
        // If fullName is provided, we can derive firstName and lastName if they are missing
        let finalFirstName = firstName;
        let finalLastName = lastName;
        if (fullName && (!firstName || !lastName)) {
            const names = fullName.trim().split(' ');
            finalFirstName = names[0];
            finalLastName = names.slice(1).join(' ') || '';
        }
        if (!email || !password || !finalFirstName || !phone) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields',
            });
            return;
        }
        // Check if user already exists
        const existingUser = await models_1.User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: 'User with this email already exists',
            });
            return;
        }
        // Hash password
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        // Generate verification token
        const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
        // Create user
        const user = new models_1.User({
            email: email.toLowerCase(),
            passwordHash,
            firstName: finalFirstName,
            lastName: finalLastName,
            fullName: fullName || `${finalFirstName} ${finalLastName}`,
            phone,
            businessName,
            kycLevel: 0, // 0: Registered (Email Unverified)
            status: 'active', // Active but limited by kycLevel
            verificationToken,
        });
        await user.save();
        // Create wallet for user
        await services_1.walletService.createWallet(user._id.toString());
        // Create Zainbox for user
        try {
            const zainboxName = user.businessName || `${user.fullName}'s Zainbox`;
            const callbackUrl = config_1.default.webhookBaseUrl
                ? `${config_1.default.webhookBaseUrl}/api/webhooks/zainpay`
                : 'https://vtpay-server.onrender.com/api/webhooks/zainpay';
            const zainboxPayload = {
                name: zainboxName,
                emailNotification: user.email,
                tags: "vtpay_user",
                callbackUrl: callbackUrl
            };
            console.log('Creating Zainbox for user:', zainboxPayload);
            const zainboxResponse = await services_1.zainpayService.createZainbox(zainboxPayload);
            console.log('Zainbox created response:', zainboxResponse);
            if (zainboxResponse.code === '00' && zainboxResponse.data) {
                // The response data might be an array or object depending on the API
                const zainboxData = Array.isArray(zainboxResponse.data) ? zainboxResponse.data[0] : zainboxResponse.data;
                if (zainboxData) {
                    const zainboxCode = zainboxData.zainboxCode;
                    // Check if this zainboxCode already exists in DB
                    let existingZainbox = await models_1.Zainbox.findOne({ zainboxCode });
                    if (existingZainbox) {
                        // Update existing
                        existingZainbox.userId = user._id;
                        existingZainbox.name = zainboxData.name;
                        existingZainbox.emailNotification = zainboxData.emailNotification;
                        existingZainbox.tags = zainboxData.tags;
                        existingZainbox.callbackUrl = zainboxData.callbackUrl;
                        existingZainbox.codeName = zainboxData.codeName;
                        existingZainbox.isLive = zainboxData.isLive;
                        await existingZainbox.save();
                        console.log('Existing Zainbox updated and assigned to user:', existingZainbox._id);
                    }
                    else {
                        // Create new
                        const newZainbox = new models_1.Zainbox({
                            userId: user._id,
                            name: zainboxData.name,
                            emailNotification: zainboxData.emailNotification,
                            tags: zainboxData.tags,
                            callbackUrl: zainboxData.callbackUrl,
                            codeName: zainboxData.codeName,
                            zainboxCode: zainboxCode,
                            isLive: zainboxData.isLive,
                        });
                        await newZainbox.save();
                        console.log('New Zainbox created and saved to DB:', newZainbox._id);
                    }
                }
            }
        }
        catch (error) {
            console.error('Failed to create Zainbox:', error);
            // Continue registration even if Zainbox creation fails
        }
        // Send verification email
        await services_1.emailService.sendVerificationEmail(user.email, verificationToken);
        // Generate token (can login immediately but with limited access)
        const token = (0, auth_1.generateToken)(user._id.toString(), user.email);
        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please check your email to verify your account.',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    fullName: user.fullName,
                    phone: user.phone,
                    kycLevel: user.kycLevel,
                    status: user.status,
                },
                token,
            },
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
        });
    }
});
/**
 * Verify email
 * GET /api/auth/verify-email
 */
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            res.status(400).json({
                success: false,
                message: 'Verification token is required',
            });
            return;
        }
        const user = await models_1.User.findOne({ verificationToken: token });
        if (!user) {
            res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token',
            });
            return;
        }
        // Update user status
        user.kycLevel = 1; // 1: Email Verified
        user.verificationToken = undefined;
        await user.save();
        res.json({
            success: true,
            message: 'Email verified successfully',
        });
    }
    catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Email verification failed',
        });
    }
});
/**
 * Login user
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: 'Email and password are required',
            });
            return;
        }
        // Find user
        const user = await models_1.User.findOne({ email: email.toLowerCase() });
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
            return;
        }
        // Check password
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
            return;
        }
        // Check if user is active
        if (user.status !== 'active') {
            res.status(403).json({
                success: false,
                message: 'Account is not active',
            });
            return;
        }
        // Generate token
        const token = (0, auth_1.generateToken)(user._id.toString(), user.email);
        // Get wallet
        const wallet = await models_1.Wallet.findOne({ userId: user._id });
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    businessName: user.businessName,
                    phone: user.phone,
                    kycLevel: user.kycLevel,
                    status: user.status,
                },
                wallet: wallet ? {
                    id: wallet._id,
                    balance: wallet.balance,
                    lockedBalance: wallet.lockedBalance,
                    currency: wallet.currency,
                } : null,
                token,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
        });
    }
});
/**
 * Get current user profile
 * GET /api/auth/profile
 */
router.get('/profile', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Not authenticated',
            });
            return;
        }
        const user = await models_1.User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }
        res.json({
            success: true,
            message: 'Profile retrieved',
            data: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: user.fullName,
                businessName: user.businessName,
                phone: user.phone,
                kycLevel: user.kycLevel,
                status: user.status,
                role: user.role
            },
        });
    }
    catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile',
        });
    }
});
/**
 * Get current user profile (Legacy alias)
 * GET /api/auth/me
 */
router.get('/me', auth_1.authenticate, async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Profile retrieved',
            data: { user: req.user },
        });
    }
    catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile',
        });
    }
});
/**
 * Update user profile
 * PUT /api/auth/profile
 */
router.put('/profile', auth_1.authenticate, async (req, res) => {
    try {
        // This route requires authentication middleware to be applied
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({
                success: false,
                message: 'Not authenticated',
            });
            return;
        }
        // Get user ID from token (assuming middleware attached it to req.user)
        // Since we don't have the middleware applied here explicitly in this file,
        // we rely on the router usage in index.ts or app.ts where it might be applied.
        // However, typically we decode the token here if middleware isn't guaranteed.
        // But for consistency with /me, we assume req.user is populated OR we need to verify token.
        // Let's assume standard auth middleware is used on this route in index.ts.
        // Wait, looking at index.ts (from memory/context), auth middleware is usually applied.
        // But let's look at how /me is implemented. It just checks header but doesn't decode?
        // Ah, line 292: `data: { user: (req as any).user }`.
        // This implies `authenticate` middleware IS running before this.
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not found in request',
            });
            return;
        }
        const { firstName, lastName, businessName, phone } = req.body;
        const user = await models_1.User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }
        // Update fields
        if (firstName)
            user.firstName = firstName;
        if (lastName)
            user.lastName = lastName;
        if (businessName)
            user.businessName = businessName;
        if (phone)
            user.phone = phone;
        // Update fullName if names changed
        if (firstName || lastName) {
            user.fullName = `${user.firstName} ${user.lastName}`;
        }
        await user.save();
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: user.fullName,
                businessName: user.businessName,
                phone: user.phone,
                kycLevel: user.kycLevel,
                status: user.status,
                role: user.role
            },
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
        });
    }
});
/**
 * Change password
 * PUT /api/auth/change-password
 */
router.put('/change-password', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            res.status(400).json({
                success: false,
                message: 'Current and new passwords are required',
            });
            return;
        }
        const user = await models_1.User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }
        // Check current password
        const isMatch = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            res.status(400).json({
                success: false,
                message: 'Incorrect current password',
            });
            return;
        }
        // Hash new password
        const salt = await bcryptjs_1.default.genSalt(10);
        user.passwordHash = await bcryptjs_1.default.hash(newPassword, salt);
        await user.save();
        res.json({
            success: true,
            message: 'Password updated successfully',
        });
    }
    catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update password',
        });
    }
});
exports.default = router;
//# sourceMappingURL=authRoutes.js.map