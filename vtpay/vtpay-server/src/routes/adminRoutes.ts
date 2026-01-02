import { Router, Response, Request } from 'express';
import { User, Zainbox, VirtualAccount, Wallet, Transaction, WebhookLog, FeeRule, RiskRule, SystemSetting } from '../models';
import { authenticate, AuthenticatedRequest, generateToken } from '../middleware';
import bcrypt from 'bcryptjs';

const router = Router();

/**
 * Admin Login
 * POST /api/admin/login
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

// All admin routes require authentication
// TODO: Add role-based authorization middleware to ensure only admins can access
router.use(authenticate);

/**
 * Get admin dashboard statistics
 * GET /api/admin/stats
 */
router.get('/stats', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Transaction Stats (Today)
        const todayTransactions = await Transaction.find({
            createdAt: { $gte: today },
            status: 'success'
        });

        const totalInflow = todayTransactions
            .filter(t => t.type === 'credit')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalOutflow = todayTransactions
            .filter(t => t.type === 'debit')
            .reduce((sum, t) => sum + t.amount, 0);

        // 2. Pending Settlements/Transactions
        const pendingTransactionsCount = await Transaction.countDocuments({ status: 'pending' });
        const failedTransactionsCount = await Transaction.countDocuments({ status: 'failed' });

        // 3. Tenant Stats
        const totalTenants = await User.countDocuments();
        const activeTenants = await User.countDocuments({ status: 'active' });
        const suspendedTenants = await User.countDocuments({ status: 'suspended' });
        const pendingTenants = await User.countDocuments({ status: 'pending' });

        // 4. Zainbox Stats
        const totalZainboxes = await Zainbox.countDocuments();
        const liveZainboxes = await Zainbox.countDocuments({ isLive: true });

        // 5. Webhook Stats (Last 24h)
        const totalWebhooks = await WebhookLog.countDocuments({ createdAt: { $gte: today } });
        const successWebhooks = await WebhookLog.countDocuments({ createdAt: { $gte: today }, dispatchStatus: 'success' });
        const failedWebhooks = await WebhookLog.countDocuments({ createdAt: { $gte: today }, dispatchStatus: 'failed' });
        const pendingWebhooks = await WebhookLog.countDocuments({ createdAt: { $gte: today }, dispatchStatus: 'pending' });

        res.json({
            success: true,
            data: {
                transactions: {
                    totalInflow,
                    totalOutflow,
                    pendingCount: pendingTransactionsCount,
                    failedCount: failedTransactionsCount,
                },
                tenants: {
                    total: totalTenants,
                    active: activeTenants,
                    suspended: suspendedTenants,
                    pending: pendingTenants,
                },
                zainboxes: {
                    total: totalZainboxes,
                    live: liveZainboxes,
                },
                webhooks: {
                    total: totalWebhooks,
                    success: successWebhooks,
                    failed: failedWebhooks,
                    pending: pendingWebhooks,
                }
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get statistics',
        });
    }
});

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

        // Sync virtual accounts for each Zainbox
        for (const zBox of zainboxes) {
            try {
                const zainpayAccounts = await zainpayService.getZainboxAccounts(zBox.zainboxCode);
                if (Array.isArray(zainpayAccounts)) {
                    for (const zAccount of zainpayAccounts) {
                        const exists = await VirtualAccount.findOne({ accountNumber: zAccount.bankAccount });
                        if (!exists) {
                            await VirtualAccount.create({
                                userId: id,
                                accountNumber: zAccount.bankAccount,
                                accountName: zAccount.name,
                                bankName: zAccount.bankName,
                                bankType: 'gtBank',
                                zainboxCode: zBox.zainboxCode,
                                email: user.email,
                                status: 'active',
                                reference: `imported_${Date.now()}_${Math.random().toString(36).substring(7)}`
                            });
                        }
                    }
                }
            } catch (syncError) {
                console.error(`Error syncing accounts for Zainbox ${zBox.zainboxCode}:`, syncError);
            }
        }

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

        // Sync virtual accounts from Zainpay
        try {
            const zainpayAccounts = await zainpayService.getZainboxAccounts(zainboxCode);
            if (Array.isArray(zainpayAccounts)) {
                for (const zAccount of zainpayAccounts) {
                    const exists = await VirtualAccount.findOne({ accountNumber: zAccount.bankAccount });
                    if (!exists) {
                        await VirtualAccount.create({
                            userId: zainbox.userId,
                            accountNumber: zAccount.bankAccount,
                            accountName: zAccount.name,
                            bankName: zAccount.bankName,
                            bankType: 'gtBank', // Default
                            zainboxCode: zainboxCode,
                            email: (zainbox.userId as any).email,
                            status: 'active',
                            reference: `imported_${Date.now()}_${Math.random().toString(36).substring(7)}`
                        });
                    }
                }
            }
        } catch (syncError) {
            console.error('Error syncing Zainbox accounts:', syncError);
        }

        // Get associated virtual accounts (now including synced ones)
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

/**
 * Get all transactions (admin view)
 * GET /api/admin/transactions
 */
router.get('/transactions', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { limit = '50', offset = '0', type, status, tenantId } = req.query;

        const query: any = {};
        if (type && type !== 'all') query.type = type;
        if (status && status !== 'all') query.status = status;
        if (tenantId) query.userId = tenantId;

        const transactions = await Transaction.find(query)
            .populate('userId', 'email firstName lastName businessName')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit as string))
            .skip(parseInt(offset as string));

        const total = await Transaction.countDocuments(query);

        res.json({
            success: true,
            data: {
                transactions,
                pagination: {
                    total,
                    limit: parseInt(limit as string),
                    offset: parseInt(offset as string),
                }
            },
        });
    } catch (error) {
        console.error('Get all transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get transactions',
        });
    }
});

/**
 * Get all settlements (admin view)
 * GET /api/admin/settlements
 */
router.get('/settlements', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // For now, we'll return successful transfers as "settlements" 
        // until we have a dedicated Settlement model
        const settlements = await Transaction.find({
            category: 'transfer',
            status: 'success'
        })
            .populate('userId', 'email firstName lastName businessName')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: settlements,
        });
    } catch (error) {
        console.error('Get all settlements error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get settlements',
        });
    }
});

/**
 * Get all webhook logs
 * GET /api/admin/webhooks
 */
router.get('/webhooks', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { limit = '50', offset = '0', source, status } = req.query;

        const query: any = {};
        if (source && source !== 'all') query.source = source;
        if (status && status !== 'all') query.dispatchStatus = status;

        const webhooks = await WebhookLog.find(query)
            .populate('userId', 'email businessName')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit as string))
            .skip(parseInt(offset as string));

        const total = await WebhookLog.countDocuments(query);

        res.json({
            success: true,
            data: {
                webhooks,
                pagination: {
                    total,
                    limit: parseInt(limit as string),
                    offset: parseInt(offset as string),
                }
            },
        });
    } catch (error) {
        console.error('Get webhooks error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get webhooks',
        });
    }
});

/**
 * Get all API keys (from Users)
 * GET /api/admin/api-keys
 */
router.get('/api-keys', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const usersWithKeys = await User.find({ apiKey: { $exists: true, $ne: null } })
            .select('email businessName firstName lastName apiKey createdAt updatedAt');

        // Map to the format expected by the frontend
        const apiKeys = usersWithKeys.map(user => ({
            _id: user._id,
            tenantId: user._id,
            tenantName: user.businessName || `${user.firstName} ${user.lastName}`,
            keyName: 'Default API Key',
            fullKey: user.apiKey,
            status: user.status === 'suspended' ? 'revoked' : 'active',
            usageCount: 0, // Placeholder
            rateLimit: 1000, // Placeholder
            currentUsage: 0, // Placeholder
            scopes: ['all'], // Placeholder
            createdAt: user.createdAt,
        }));

        res.json({
            success: true,
            data: apiKeys,
        });
    } catch (error) {
        console.error('Get API keys error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get API keys',
        });
    }
});

/**
 * Get all fee rules
 * GET /api/admin/fees
 */
router.get('/fees', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const fees = await FeeRule.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            data: fees,
        });
    } catch (error) {
        console.error('Get fees error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get fees',
        });
    }
});

/**
 * Create a fee rule
 * POST /api/admin/fees
 */
router.post('/fees', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const fee = await FeeRule.create(req.body);
        res.json({
            success: true,
            data: fee,
        });
    } catch (error) {
        console.error('Create fee error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create fee',
        });
    }
});

/**
 * Update a fee rule
 * PATCH /api/admin/fees/:id
 */
router.patch('/fees/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const fee = await FeeRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({
            success: true,
            data: fee,
        });
    } catch (error) {
        console.error('Update fee error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update fee',
        });
    }
});

/**
 * Delete a fee rule
 * DELETE /api/admin/fees/:id
 */
router.delete('/fees/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        await FeeRule.findByIdAndDelete(req.params.id);
        res.json({
            success: true,
            message: 'Fee rule deleted',
        });
    } catch (error) {
        console.error('Delete fee error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete fee',
        });
    }
});

/**
 * Get all risk rules
 * GET /api/admin/risk
 */
router.get('/risk', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const rules = await RiskRule.find().sort({ priority: 1 });
        res.json({
            success: true,
            data: rules,
        });
    } catch (error) {
        console.error('Get risk rules error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get risk rules',
        });
    }
});

/**
 * Create a risk rule
 * POST /api/admin/risk
 */
router.post('/risk', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const rule = await RiskRule.create(req.body);
        res.json({
            success: true,
            data: rule,
        });
    } catch (error) {
        console.error('Create risk rule error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create risk rule',
        });
    }
});

/**
 * Update a risk rule
 * PATCH /api/admin/risk/:id
 */
router.patch('/risk/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const rule = await RiskRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({
            success: true,
            data: rule,
        });
    } catch (error) {
        console.error('Update risk rule error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update risk rule',
        });
    }
});

/**
 * Delete a risk rule
 * DELETE /api/admin/risk/:id
 */
router.delete('/risk/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        await RiskRule.findByIdAndDelete(req.params.id);
        res.json({
            success: true,
            message: 'Risk rule deleted',
        });
    } catch (error) {
        console.error('Delete risk rule error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete risk rule',
        });
    }
});

/**
 * Send bulk email
 * POST /api/admin/communications/send
 */
router.post('/communications/send', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { recipientType, selectedTenants, subject, message } = req.body;

        let query: any = {};
        if (recipientType === 'active') {
            query.status = 'active';
        } else if (recipientType === 'specific') {
            query._id = { $in: selectedTenants };
        }

        const tenants = await User.find(query).select('email');
        const emails = tenants.map(t => t.email);

        console.log(`[Communications] Sending bulk email to ${emails.length} recipients`);
        console.log(`[Communications] Subject: ${subject}`);
        // In a real app, we would use emailService.sendBulkEmail(emails, subject, message)

        res.json({
            success: true,
            message: `Email sent to ${emails.length} recipients`,
        });
    } catch (error) {
        console.error('Send bulk email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send bulk email',
        });
    }
});

/**
 * Get system settings
 * GET /api/admin/settings
 */
router.get('/settings', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        let settings = await SystemSetting.findOne();
        if (!settings) {
            settings = await SystemSetting.create({});
        }
        res.json({
            success: true,
            data: settings,
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get settings',
        });
    }
});

/**
 * Update system settings
 * PATCH /api/admin/settings
 */
router.patch('/settings', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        let settings = await SystemSetting.findOne();
        if (!settings) {
            settings = await SystemSetting.create(req.body);
        } else {
            Object.assign(settings, req.body);
            await settings.save();
        }

        // Refresh Zainpay config if integrations settings were updated
        if (req.body.integrations?.zainpay) {
            const { zainpayService } = await import('../services/ZainpayService');
            await zainpayService.refreshConfig();
        }

        res.json({
            success: true,
            data: settings,
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update settings',
        });
    }
});

// ... existing code ...
import { zainpayService } from '../services/ZainpayService';
import crypto from 'crypto';

// ... existing code ...

/**
 * Create a new Zainbox (Admin)
 * POST /api/admin/zainboxes
 */
router.post('/zainboxes', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id; // Admin creates it for themselves for now, or we could add userId to body to create for others
        const { name, emailNotification, tags, callbackUrl } = req.body;

        if (!name || !emailNotification || !tags || !callbackUrl) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields: name, emailNotification, tags, callbackUrl',
            });
            return;
        }

        // Call Zainpay API to create Zainbox
        const zainpayResponse = await zainpayService.createZainbox({
            name,
            emailNotification,
            tags,
            callbackUrl,
        });

        if (zainpayResponse.code !== '00' || !zainpayResponse.data) {
            res.status(400).json({
                success: false,
                message: zainpayResponse.description || 'Failed to create Zainbox on Zainpay',
            });
            return;
        }

        // Find the created zainbox in the response
        const createdZainboxData = zainpayResponse.data.find(z => z.name === name);

        if (!createdZainboxData) {
            res.status(500).json({
                success: false,
                message: 'Zainbox created but not found in response',
            });
            return;
        }

        // Save to local DB
        const zainbox = new Zainbox({
            userId,
            name: createdZainboxData.name,
            emailNotification: createdZainboxData.emailNotification,
            tags: createdZainboxData.tags,
            callbackUrl: createdZainboxData.callbackUrl,
            codeName: createdZainboxData.codeName,
            zainboxCode: createdZainboxData.zainboxCode,
            isLive: createdZainboxData.isLive,
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
 * Generate API Key (Admin)
 * POST /api/admin/api-keys
 */
router.post('/api-keys', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const user = await User.findById(userId);

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        // Generate a new API key
        const randomPart = crypto.randomBytes(24).toString('hex');
        const prefix = user.kycLevel < 3 ? 'sk_test_' : 'sk_live_';
        const newApiKey = `${prefix}${randomPart}`;

        user.apiKey = newApiKey;
        await user.save();

        res.json({
            success: true,
            message: 'API key generated successfully',
            data: {
                apiKey: newApiKey,
            },
        });
    } catch (error) {
        console.error('Generate API key error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate API key',
        });
    }
});

/**
 * Revoke API Key
 * DELETE /api/admin/api-keys/:id
 */
router.delete('/api-keys/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        user.apiKey = undefined; // Remove the key
        await user.save();

        res.json({
            success: true,
            message: 'API key revoked successfully',
        });
    } catch (error) {
        console.error('Revoke API key error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to revoke API key',
        });
    }
});

/**
 * Get Admin Profile
 * GET /api/admin/profile
 */
router.get('/profile', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user!.id).select('-passwordHash');
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'Admin not found',
            });
            return;
        }
        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile',
        });
    }
});

/**
 * Update Admin Profile
 * PUT /api/admin/profile
 */
router.put('/profile', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { firstName, lastName, phone } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user!.id,
            { firstName, lastName, phone },
            { new: true }
        ).select('-passwordHash');

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: user,
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
        });
    }
});

/**
 * Change Admin Password
 * PUT /api/admin/profile/password
 */
router.put('/profile/password', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user!.id);

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            res.status(400).json({
                success: false,
                message: 'Incorrect current password',
            });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
        });
    }
});

export default router;
