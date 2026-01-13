import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import SuperAdmin from '../models/super_admin.model.js';
import CreatedApp from '../models/created_app.model.js';
import VTfreeUser from '../models/vtfree_user.model.js';
import { Transaction } from '../models/transaction.model.js';
import PlatformTransaction from '../models/platform_transaction.model.js';
import { User } from '../models/user.model.js';

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const admin = await SuperAdmin.findOne({ email });
        if (!admin) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            {
                user_id: admin._id,
                email: admin.email,
                type: 'super_admin',
                role: admin.role
            },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
            data: {
                admin: {
                    _id: admin._id,
                    email: admin.email,
                    role: admin.role,
                },
                token,
            },
        });
    } catch (error) {
        console.error('Super admin login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAllApps = async (req: Request, res: Response) => {
    try {
        const apps = await CreatedApp.find().sort({ created_at: -1 }).populate('owner_id', 'email first_name last_name');
        res.json({ success: true, data: { apps } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const { app_id, owner_id, search } = req.query;
        let query: any = {};

        if (app_id) {
            query.app_id = app_id;
        }

        if (owner_id) {
            // Find all apps owned by this user
            const apps = await CreatedApp.find({ owner_id });
            const appIds = apps.map(app => app.app_id);
            query.app_id = { $in: appIds };
        }

        if (search) {
            query.$or = [
                { first_name: { $regex: search, $options: 'i' } },
                { last_name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone_number: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query).sort({ created_at: -1 });

        // Enrich with app details
        const enrichedUsers = await Promise.all(users.map(async (user) => {
            const app = await CreatedApp.findOne({ app_id: user.app_id }).populate('owner_id', 'first_name last_name email');
            return {
                ...user.toObject(),
                app_name: app?.app_name || 'Unknown App',
                owner_name: app?.owner_id ? `${(app.owner_id as any).first_name} ${(app.owner_id as any).last_name}` : 'Unknown Owner'
            };
        }));

        res.json({ success: true, data: { users: enrichedUsers } });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAllOwners = async (req: Request, res: Response) => {
    try {
        const owners = await VTfreeUser.find().sort({ created_at: -1 }).select('-password');
        res.json({ success: true, data: { owners } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const total_users = await VTfreeUser.countDocuments();
        const total_transactions = await Transaction.countDocuments();
        const active_users = await User.countDocuments({ status: 'active' });

        const revenueResult = await PlatformTransaction.aggregate([
            { $match: { status: 'success' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const revenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        // Recent Transactions (Last 5)
        const recent_transactions = await Transaction.find()
            .sort({ created_at: -1 })
            .limit(5)
            .populate('user_id', 'first_name last_name email');

        // Top Apps (Last 5 created for now, or could be by transaction volume)
        const top_apps = await CreatedApp.find()
            .sort({ created_at: -1 })
            .limit(5)
            .populate('owner_id', 'first_name last_name');

        // Daily Stats (Last 7 days revenue)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const daily_stats = await PlatformTransaction.aggregate([
            {
                $match: {
                    status: 'success',
                    created_at: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
                    total: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            data: {
                total_users,
                total_transactions,
                revenue,
                active_users,
                recent_transactions,
                top_apps,
                daily_stats
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getUserWallets = async (req: Request, res: Response) => {
    try {
        const { Wallet } = await import('../models/wallet.model.js');
        const wallets = await Wallet.find()
            .populate('user_id', 'first_name last_name email status')
            .sort({ balance: -1 });

        res.json({ success: true, data: { wallets } });
    } catch (error) {
        console.error('Get user wallets error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAllWithdrawals = async (req: Request, res: Response) => {
    try {
        const { Withdrawal } = await import('../models/withdrawal.model.js');
        const withdrawals = await Withdrawal.find()
            .populate('user_id', 'first_name last_name email')
            .sort({ created_at: -1 });

        res.json({ success: true, data: { withdrawals } });
    } catch (error) {
        console.error('Get withdrawals error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateWithdrawalStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;
        const { Withdrawal } = await import('../models/withdrawal.model.js');

        const withdrawal = await Withdrawal.findByIdAndUpdate(
            id,
            { status, reason, updated_at: new Date() },
            { new: true }
        );

        if (!withdrawal) {
            return res.status(404).json({ success: false, message: 'Withdrawal not found' });
        }

        res.json({ success: true, message: 'Withdrawal status updated', data: { withdrawal } });
    } catch (error) {
        console.error('Update withdrawal status error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAllTransactions = async (req: Request, res: Response) => {
    try {
        const transactions = await Transaction.find().sort({ created_at: -1 });
        res.json({ success: true, data: { transactions } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAllPayments = async (req: Request, res: Response) => {
    try {
        const payments = await PlatformTransaction.find().sort({ created_at: -1 }).populate('user_id', 'email first_name last_name');
        res.json({ success: true, data: { payments } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Plans Management
export const getAllPlans = async (req: Request, res: Response) => {
    try {
        const { Plan } = await import('../models/plan.model.js');
        const plans = await Plan.find().sort({ created_at: -1 });
        res.json({ success: true, data: { plans } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const createPlan = async (req: Request, res: Response) => {
    try {
        const { Plan } = await import('../models/plan.model.js');
        const plan = new Plan(req.body);
        await plan.save();
        res.json({ success: true, data: { plan } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updatePlan = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { Plan } = await import('../models/plan.model.js');
        const plan = await Plan.findByIdAndUpdate(id, req.body, { new: true });
        res.json({ success: true, data: { plan } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deletePlan = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { Plan } = await import('../models/plan.model.js');
        await Plan.findByIdAndDelete(id);
        res.json({ success: true, message: 'Plan deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Features Management
export const getAllFeatures = async (req: Request, res: Response) => {
    try {
        const { Feature } = await import('../models/feature.model.js');
        const features = await Feature.find().sort({ created_at: -1 });
        res.json({ success: true, data: { features } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const createFeature = async (req: Request, res: Response) => {
    try {
        const { Feature } = await import('../models/feature.model.js');
        const feature = new Feature(req.body);
        await feature.save();
        res.json({ success: true, data: { feature } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateFeature = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { Feature } = await import('../models/feature.model.js');
        const feature = await Feature.findByIdAndUpdate(id, req.body, { new: true });
        res.json({ success: true, data: { feature } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteFeature = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { Feature } = await import('../models/feature.model.js');
        await Feature.findByIdAndDelete(id);
        res.json({ success: true, message: 'Feature deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// System Settings Management
export const getSystemSettings = async (req: Request, res: Response) => {
    try {
        const { configService } = await import('../services/config.service.js');

        const settings = {
            general: {
                companyName: await configService.get('COMPANY_NAME', 'VTPay Systems'),
                supportEmail: await configService.get('SUPPORT_EMAIL', 'support@vtpay.com'),
                timezone: await configService.get('TIMEZONE', 'Africa/Lagos'),
                currency: await configService.get('CURRENCY', 'NGN'),
                maintenanceMode: (await configService.get('MAINTENANCE_MODE', 'false')) === 'true',
            },
            notifications: {
                emailAlerts: (await configService.get('EMAIL_ALERTS', 'true')) === 'true',
                slackIntegration: (await configService.get('SLACK_INTEGRATION', 'false')) === 'true',
                webhookRetries: parseInt(await configService.get('WEBHOOK_RETRIES', '3')),
                dailyReports: (await configService.get('DAILY_REPORTS', 'true')) === 'true',
            },
            security: {
                twoFactorAuth: (await configService.get('TWO_FACTOR_AUTH', 'true')) === 'true',
                sessionTimeout: parseInt(await configService.get('SESSION_TIMEOUT', '30')),
                passwordExpiry: parseInt(await configService.get('PASSWORD_EXPIRY', '90')),
                ipWhitelist: await configService.get('IP_WHITELIST', ''),
            },
            integrations: {
                zainpay: {
                    apiKey: await configService.get('ZAINPAY_API_KEY', ''),
                    secretKey: await configService.get('ZAINPAY_SECRET_KEY', ''),
                    baseUrl: await configService.get('ZAINPAY_BASE_URL', 'https://api.zainpay.ng'),
                    isLive: (await configService.get('ZAINPAY_IS_LIVE', 'false')) === 'true',
                }
            }
        };

        res.json({ success: true, data: settings });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSystemSettings = async (req: Request, res: Response) => {
    try {
        const { configService } = await import('../services/config.service.js');
        const settings = req.body;

        if (settings.general) {
            if (settings.general.companyName !== undefined) await configService.set('COMPANY_NAME', settings.general.companyName);
            if (settings.general.supportEmail !== undefined) await configService.set('SUPPORT_EMAIL', settings.general.supportEmail);
            if (settings.general.timezone !== undefined) await configService.set('TIMEZONE', settings.general.timezone);
            if (settings.general.currency !== undefined) await configService.set('CURRENCY', settings.general.currency);
            if (settings.general.maintenanceMode !== undefined) await configService.set('MAINTENANCE_MODE', String(settings.general.maintenanceMode));
        }

        if (settings.notifications) {
            if (settings.notifications.emailAlerts !== undefined) await configService.set('EMAIL_ALERTS', String(settings.notifications.emailAlerts));
            if (settings.notifications.slackIntegration !== undefined) await configService.set('SLACK_INTEGRATION', String(settings.notifications.slackIntegration));
            if (settings.notifications.webhookRetries !== undefined) await configService.set('WEBHOOK_RETRIES', String(settings.notifications.webhookRetries));
            if (settings.notifications.dailyReports !== undefined) await configService.set('DAILY_REPORTS', String(settings.notifications.dailyReports));
        }

        if (settings.security) {
            if (settings.security.twoFactorAuth !== undefined) await configService.set('TWO_FACTOR_AUTH', String(settings.security.twoFactorAuth));
            if (settings.security.sessionTimeout !== undefined) await configService.set('SESSION_TIMEOUT', String(settings.security.sessionTimeout));
            if (settings.security.passwordExpiry !== undefined) await configService.set('PASSWORD_EXPIRY', String(settings.security.passwordExpiry));
            if (settings.security.ipWhitelist !== undefined) await configService.set('IP_WHITELIST', settings.security.ipWhitelist);
        }

        if (settings.integrations && settings.integrations.zainpay) {
            const zp = settings.integrations.zainpay;
            if (zp.apiKey !== undefined) await configService.set('ZAINPAY_API_KEY', zp.apiKey);
            if (zp.secretKey !== undefined) await configService.set('ZAINPAY_SECRET_KEY', zp.secretKey);
            if (zp.baseUrl !== undefined) await configService.set('ZAINPAY_BASE_URL', zp.baseUrl);
            if (zp.isLive !== undefined) await configService.set('ZAINPAY_IS_LIVE', String(zp.isLive));
        }

        res.json({ success: true, message: 'System settings updated successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getLogs = async (req: Request, res: Response) => {
    try {
        const { type } = req.query;
        const { AuditLog } = await import('../models/audit_log.model.js');

        const query: any = {};
        if (type && type !== 'all') {
            query.type = type;
        }

        const logs = await AuditLog.find(query)
            .sort({ created_at: -1 })
            .limit(100);

        res.json({ success: true, data: { logs } });
    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAllTickets = async (req: Request, res: Response) => {
    try {
        const { SupportTicket } = await import('../models/support_ticket.model.js');
        const tickets = await SupportTicket.find()
            .populate('user_id', 'first_name last_name email')
            .sort({ created_at: -1 });

        res.json({ success: true, data: { tickets } });
    } catch (error) {
        console.error('Get tickets error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateTicketStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, priority } = req.body;
        const { SupportTicket } = await import('../models/support_ticket.model.js');

        const ticket = await SupportTicket.findByIdAndUpdate(
            id,
            { status, priority, updated_at: new Date() },
            { new: true }
        );

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        res.json({ success: true, message: 'Ticket updated', data: { ticket } });
    } catch (error) {
        console.error('Update ticket error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
