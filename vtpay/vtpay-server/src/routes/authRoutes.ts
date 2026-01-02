import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User, Wallet, Zainbox } from '../models';
import { generateToken } from '../middleware/auth';
import { walletService, emailService, zainpayService } from '../services';
import config from '../config';

const router = Router();

/**
 * Register a new user
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, firstName, lastName, fullName, phone } = req.body;

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
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: 'User with this email already exists',
            });
            return;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create user
        const user = new User({
            email: email.toLowerCase(),
            passwordHash,
            firstName: finalFirstName,
            lastName: finalLastName,
            fullName: fullName || `${finalFirstName} ${finalLastName}`,
            phone,
            kycLevel: 0, // 0: Registered (Email Unverified)
            status: 'active', // Active but limited by kycLevel
            verificationToken,
        });
        await user.save();

        // Create wallet for user
        await walletService.createWallet(user._id.toString());

        // Create Zainbox for user
        try {
            const zainboxName = user.businessName || `${user.fullName}'s Zainbox`;
            const callbackUrl = config.webhookBaseUrl
                ? `${config.webhookBaseUrl}/api/webhooks/zainpay`
                : 'https://vtpay-server.onrender.com/api/webhooks/zainpay';

            const zainboxPayload = {
                name: zainboxName,
                emailNotification: user.email,
                tags: "vtpay_user",
                callbackUrl: callbackUrl
            };

            console.log('Creating Zainbox for user:', zainboxPayload);
            const zainboxResponse = await zainpayService.createZainbox(zainboxPayload);
            console.log('Zainbox created response:', zainboxResponse);

            if (zainboxResponse.code === '00' && zainboxResponse.data) {
                // The response data might be an array or object depending on the API
                const zainboxData = Array.isArray(zainboxResponse.data) ? zainboxResponse.data[0] : zainboxResponse.data;

                if (zainboxData) {
                    const newZainbox = new Zainbox({
                        userId: user._id,
                        name: zainboxData.name,
                        emailNotification: zainboxData.emailNotification,
                        tags: zainboxData.tags,
                        callbackUrl: zainboxData.callbackUrl,
                        codeName: zainboxData.codeName,
                        zainboxCode: zainboxData.zainboxCode,
                        isLive: zainboxData.isLive,
                    });
                    await newZainbox.save();
                    console.log('Zainbox saved to DB:', newZainbox._id);
                }
            }
        } catch (error) {
            console.error('Failed to create Zainbox:', error);
            // Continue registration even if Zainbox creation fails
        }

        // Send verification email
        await emailService.sendVerificationEmail(user.email, verificationToken);

        // Generate token (can login immediately but with limited access)
        const token = generateToken(user._id.toString(), user.email);

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
    } catch (error) {
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
router.get('/verify-email', async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.query;

        if (!token) {
            res.status(400).json({
                success: false,
                message: 'Verification token is required',
            });
            return;
        }

        const user = await User.findOne({ verificationToken: token });

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
    } catch (error) {
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
router.post('/login', async (req: Request, res: Response): Promise<void> => {
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
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
            return;
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
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
        const token = generateToken(user._id.toString(), user.email);

        // Get wallet
        const wallet = await Wallet.findOne({ userId: user._id });

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
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
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
        });
    }
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
router.get('/me', async (req: Request, res: Response): Promise<void> => {
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

        // Token verification should be done by auth middleware
        res.json({
            success: true,
            message: 'Profile retrieved',
            data: { user: (req as any).user },
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile',
        });
    }
});

export default router;
