import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import SuperAdmin from '../models/super_admin.model.js';
import CreatedApp from '../models/created_app.model.js';
import VTfreeUser from '../models/vtfree_user.model.js';
import VTfreeTransaction from '../models/vtfree_transaction.model.js';
import { Transaction } from '../models/transaction.model.js';
import PlatformTransaction from '../models/platform_transaction.model.js';
import { User } from '../models/user.model.js';
import AppAdmin from '../models/app_admin.model.js';
import AirtimePlan from '../models/airtime_plan.model.js';
import Feature from '../models/Feature.js';
import { Plan } from '../models/plan.model.js';
import ibdataService from '../services/ibdata.service.js';
import logger from '../utils/logger.js';
import { normalizeNetwork, getNetworkName, NetworkId } from '../utils/network.js';
import { VTStackService } from '../services/vtstack.service.js';
import { configService } from '../services/config.service.js';

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
        const apps = await CreatedApp.find().sort({ created_at: -1 }).populate('owner_id', 'email first_name last_name phone');

        // Enrich with stats
        const enrichedApps = await Promise.all(apps.map(async (app: any) => {
            const stats = await PlatformTransaction.aggregate([
                { $match: { app_id: app.app_id, status: 'completed' } },
                { $group: { _id: null, total_revenue: { $sum: '$amount' }, total_transactions: { $sum: 1 } } }
            ]);

            const total_end_users = await User.countDocuments({ app_id: app.app_id });

            return {
                ...app.toObject(),
                total_revenue: stats[0]?.total_revenue || 0,
                total_transactions: stats[0]?.total_transactions || 0,
                total_end_users,
                download_url: `https://vtfree.com/download/${app.app_id}.apk`
            };
        }));

        res.json({ success: true, data: { apps: enrichedApps } });
    } catch (error) {
        logger.error('Error fetching all apps:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const createApp = async (req: Request, res: Response) => {
    try {
        const { owner_id, app_name, package_name, admin_email, admin_password } = req.body;

        if (!owner_id || !app_name || !package_name || !admin_email || !admin_password) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Check if package name exists
        const existingApp = await CreatedApp.findOne({ package_name });
        if (existingApp) {
            return res.status(400).json({ success: false, message: 'Package name already taken' });
        }

        // Generate app_id
        const app_id = `APP_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`;

        // Hash admin password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(admin_password, salt);

        const newApp = new CreatedApp({
            app_id,
            owner_id,
            app_name,
            package_name,
            admin_email,
            admin_password_hash: passwordHash,
            status: 'pending',
            platforms: { android: true, ios: false, web: false },
            version: '1.0.0'
        });

        await newApp.save();

        // Create the initial AppAdmin
        const newAdmin = new AppAdmin({
            app_id,
            email: admin_email,
            password: passwordHash,
            role: 'owner',
            status: 'active'
        });
        await newAdmin.save();

        res.status(201).json({
            success: true,
            message: 'App created successfully',
            data: { app: newApp }
        });
    } catch (error) {
        console.error('Create app error:', error);
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



export const getOwnerById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const owner = await VTfreeUser.findById(id).select('-password');
        if (!owner) return res.status(404).json({ success: false, message: 'Owner not found' });

        // Fetch apps owned by this user
        const apps = await CreatedApp.find({ owner_id: id }).sort({ created_at: -1 });

        res.json({
            success: true,
            data: {
                owner: {
                    ...owner.toObject(),
                    apps: apps || []
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



export const getAllAdmins = async (req: Request, res: Response) => {
    try {
        const admins = await AppAdmin.find().sort({ created_at: -1 }).select('-password');

        const enrichedAdmins = await Promise.all(admins.map(async (admin) => {
            const app = await CreatedApp.findOne({ app_id: admin.app_id });
            let ownerBalance = 0;
            let appName = 'Unknown App';
            let ownerId = null;

            if (app) {
                appName = app.app_name;
                const owner = await VTfreeUser.findById(app.owner_id);
                if (owner) {
                    ownerBalance = owner.wallet_balance;
                    ownerId = owner._id;
                }
            }

            return {
                ...admin.toObject(),
                app_name: appName,
                ibdata_balance: ownerBalance,
                owner_id: ownerId
            };
        }));

        res.json({ success: true, data: { admins: enrichedAdmins } });
    } catch (error) {
        console.error('Get all admins error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



export const getAdminById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const admin = await AppAdmin.findById(id).select('-password');
        if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
        res.json({ success: true, data: { admin } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



export const updateOwnerStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const owner = await VTfreeUser.findByIdAndUpdate(id, { status }, { new: true }).select('-password');
        if (!owner) return res.status(404).json({ success: false, message: 'Owner not found' });
        res.json({ success: true, data: { owner } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



export const creditOwnerWallet = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { amount, reason } = req.body;

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount' });
        }

        const owner = await VTfreeUser.findById(id);
        if (!owner) {
            return res.status(404).json({ success: false, message: 'Owner not found' });
        }

        owner.wallet_balance += Number(amount);
        await owner.save();

        // Create transaction record
        await VTfreeTransaction.create({
            user_id: owner._id,
            type: 'credit',
            amount: Number(amount),
            reference: `MANUAL_CREDIT_${Date.now()}`,
            description: reason || 'Wallet credited by Admin',
            status: 'success',
            metadata: {
                initiator: 'super_admin'
            },
            created_at: new Date()
        });

        // Log the transaction (optional but recommended)
        logger.info(`Super Admin credited wallet of ${owner.email} with ${amount}. Reason: ${reason || 'N/A'}`);

        res.json({
            success: true,
            message: `Successfully credited ₦${amount} to ${owner.first_name}'s wallet`,
            data: {
                wallet_balance: owner.wallet_balance
            }
        });
    } catch (error) {
        console.error('Credit owner wallet error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const createOwner = async (req: Request, res: Response) => {
    try {
        const { email, password, first_name, last_name, phone_number, company_name } = req.body;

        // Basic validation
        if (!email || !password || !first_name || !phone_number) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Check if user exists
        const existingUser = await VTfreeUser.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newOwner = new VTfreeUser({
            email,
            password: hashedPassword,
            first_name,
            last_name,
            phone_number,
            company_name,
            status: 'active', // Direct creation by super admin is active by default
            email_verified: true
        });

        await newOwner.save();

        res.status(201).json({
            success: true,
            message: 'Owner created successfully',
            data: { owner: { ...newOwner.toObject(), password: undefined } }
        });
    } catch (error) {
        console.error('Create owner error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateAdminStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const admin = await AppAdmin.findByIdAndUpdate(id, { status }, { new: true }).select('-password');
        if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
        res.json({ success: true, data: { admin } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const totalOwners = await VTfreeUser.countDocuments();
        const totalEndUsers = await User.countDocuments();
        const totalTransactions = await Transaction.countDocuments();
        const activeUsers = await User.countDocuments({ status: 'active' });
        const totalApps = await CreatedApp.countDocuments();
        const totalAppAdmins = await AppAdmin.countDocuments();
        const successfulTransactions = await Transaction.countDocuments({ status: 'successful' });

        const revenueResult = await PlatformTransaction.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const revenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        // Calculate Data and Airtime sales
        const salesStats = await Transaction.aggregate([
            { $match: { status: 'successful' } },
            {
                $group: {
                    _id: '$type',
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        const totalDataSales = salesStats.find(s => s._id === 'data_purchase')?.totalAmount || 0;
        const totalAirtimeSales = salesStats.find(s => s._id === 'airtime_topup')?.totalAmount || 0;

        // Recent Transactions (Last 5)
        const recent_transactions = await Transaction.find()
            .sort({ created_at: -1 })
            .limit(5)
            .populate('user_id', 'first_name last_name email');

        // Top Apps (Last 5 created for now, or could be by transaction volume)
        const recent_apps = await CreatedApp.find()
            .sort({ created_at: -1 })
            .limit(5)
            .populate('owner_id', 'first_name last_name');

        const top_apps = await Promise.all(recent_apps.map(async (app: any) => {
            const stats = await PlatformTransaction.aggregate([
                { $match: { app_id: app.app_id, status: 'completed' } },
                { $group: { _id: null, total_revenue: { $sum: '$amount' }, total_transactions: { $sum: 1 } } }
            ]);

            return {
                ...app.toObject(),
                total_revenue: stats[0]?.total_revenue || 0,
                total_transactions: stats[0]?.total_transactions || 0
            };
        }));

        // Daily Stats (Last 7 days revenue)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const daily_stats = await PlatformTransaction.aggregate([
            {
                $match: {
                    status: 'completed',
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
                // Snake case for super-admin frontend
                total_users: totalOwners,
                total_end_users: totalEndUsers,
                total_apps: totalApps,
                total_app_admins: totalAppAdmins,
                total_transactions: totalTransactions,
                active_users: activeUsers,
                revenue,
                recent_transactions,
                top_apps,
                daily_stats,

                // Camel case for app-admin frontend (if it ever calls this)
                totalUsers: totalOwners,
                totalEndUsers,
                totalTransactions,
                successfulTransactions,
                totalDataSales,
                totalAirtimeSales,
                activeUsers
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
        const { limit = 50, offset = 0, source = 'local' } = req.query;

        if (source === 'vtpay' || source === 'vtstack') {
            // @ts-ignore
            const result = await VTStackService.getAllTransactions(Number(limit), Number(offset));
            const normalized = result.data.transactions.map((tx: any) => ({
                _id: tx.id || tx._id,
                transaction_id: tx.reference,
                type: tx.type,
                amount: tx.amountNaira || (tx.amount / 100),
                status: tx.status,
                customer_phone: tx.userId?.phone || 'N/A',
                customer_name: tx.userId ? `${tx.userId.firstName} ${tx.userId.lastName}` : 'N/A',
                app_name: tx.userId?.businessName || 'VTPay Platform',
                user_name: tx.userId?.email || 'N/A',
                created_at: tx.createdAt,
                commission: tx.feeNaira || (tx.fee / 100) || 0
            }));
            return res.json({
                success: true,
                data: {
                    transactions: normalized,
                    pagination: result.data.pagination
                }
            });
        }

        const transactions = await Transaction.find().sort({ created_at: -1 }).limit(Number(limit)).skip(Number(offset));
        const total = await Transaction.countDocuments();

        res.json({
            success: true,
            data: {
                transactions,
                pagination: { total, limit: Number(limit), offset: Number(offset) }
            }
        });
    } catch (error) {
        logger.error('Error fetching transactions:', error);
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

export const createAdmin = async (req: Request, res: Response) => {
    try {
        const { app_id, email, password, first_name, last_name, role } = req.body;

        if (!app_id || !email || !password) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const existingAdmin = await AppAdmin.findOne({ email, app_id });
        if (existingAdmin) {
            return res.status(400).json({ success: false, message: 'Admin already exists for this app' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAdmin = new AppAdmin({
            app_id,
            email,
            password: hashedPassword,
            first_name,
            last_name,
            role: role || 'admin',
            status: 'active'
        });

        await newAdmin.save();

        res.status(201).json({
            success: true,
            message: 'Admin created successfully',
            data: { admin: { ...newAdmin.toObject(), password: undefined } }
        });
    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Plans Management
export const getAllPlans = async (req: Request, res: Response) => {
    try {
        const plans = await Plan.find().sort({ created_at: -1 });
        res.json({ success: true, data: { plans } });
    } catch (error) {
        logger.error('Error fetching all plans:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const createPlan = async (req: Request, res: Response) => {
    try {
        const { name, price, billing, features, status } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Plan name is required' });
        }

        const plan = new Plan({
            name,
            price: Number(price) || 0,
            billing: billing || 'monthly',
            features: features || [],
            status: status || 'active'
        });

        await plan.save();
        res.json({ success: true, data: { plan } });
    } catch (error) {
        logger.error('Error creating plan:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updatePlan = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (updateData.price !== undefined) {
            updateData.price = Number(updateData.price) || 0;
        }

        const plan = await Plan.findByIdAndUpdate(id, updateData, { new: true });
        if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

        res.json({ success: true, data: { plan } });
    } catch (error) {
        logger.error('Error updating plan:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deletePlan = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const plan = await Plan.findByIdAndDelete(id);
        if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

        res.json({ success: true, message: 'Plan deleted' });
    } catch (error) {
        logger.error('Error deleting plan:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Features Management
export const getAllFeatures = async (req: Request, res: Response) => {
    try {
        const features = await Feature.find().sort({ created_at: -1 });
        res.json({ success: true, data: { features } });
    } catch (error) {
        logger.error('Error fetching all features:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const createFeature = async (req: Request, res: Response) => {
    try {
        const { feature_id, name, slug, description, icon_name, base_price, category, is_active } = req.body;

        if (!feature_id || !name || !slug) {
            return res.status(400).json({ success: false, message: 'feature_id, name, and slug are required' });
        }

        const feature = new Feature({
            feature_id,
            name,
            slug,
            description,
            icon_name: icon_name || 'CheckSquare',
            base_price: Number(base_price) || 0,
            category: category || 'utility',
            is_active: is_active !== undefined ? is_active : true
        });

        await feature.save();
        res.json({ success: true, data: { feature } });
    } catch (error) {
        logger.error('Error creating feature:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateFeature = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (updateData.base_price !== undefined) {
            updateData.base_price = Number(updateData.base_price) || 0;
        }

        const feature = await Feature.findByIdAndUpdate(id, updateData, { new: true });
        if (!feature) return res.status(404).json({ success: false, message: 'Feature not found' });

        res.json({ success: true, data: { feature } });
    } catch (error) {
        logger.error('Error updating feature:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteFeature = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const feature = await Feature.findByIdAndDelete(id);
        if (!feature) return res.status(404).json({ success: false, message: 'Feature not found' });

        res.json({ success: true, message: 'Feature deleted' });
    } catch (error) {
        logger.error('Error deleting feature:', error);
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

export const getIBDataPlans = async (req: Request, res: Response) => {
    try {
        const { type } = req.query;
        let apiPlans: any[] = [];

        // Fetch from API based on type
        if (type === 'data' || !type) {
            const dataPlans = await ibdataService.getDataPlans();
            apiPlans = [...apiPlans, ...(Array.isArray(dataPlans) ? dataPlans.map((p: any) => ({ ...p, type: 'data' })) : [])];
        }

        if (type === 'airtime' || !type) {
            // IBData usually returns airtime as part of networks or separate, 
            // but for now let's assume we want to show it.
            // If IBData doesn't have a specific airtime plans endpoint, we might just show networks.
            const networks = await ibdataService.getNetworks();
            if (Array.isArray(networks)) {
                apiPlans = [...apiPlans, ...networks.map((n: any) => ({
                    plan_id: `airtime_${n.network_id || n.id}`,
                    plan_name: `${n.name} Airtime`,
                    price: 100, // Base price for 100 airtime
                    network: n.network_id || n.id,
                    type: 'airtime'
                }))];
            }
        }

        if (type === 'cable' || !type) {
            const cablePlans = await ibdataService.getCablePlans();
            apiPlans = [...apiPlans, ...(Array.isArray(cablePlans) ? cablePlans.map((p: any) => ({ ...p, type: 'cable' })) : [])];
        }

        if (type === 'utility' || !type) {
            const utilityPlans = await ibdataService.getUtilityPlans();
            apiPlans = [...apiPlans, ...(Array.isArray(utilityPlans) ? utilityPlans.map((p: any) => ({ ...p, type: 'utility' })) : [])];
        }

        // Fetch global profit settings
        const globalPlans = await AirtimePlan.find({ app_id: null });

        // Merge API plans with global settings
        const mergedPlans = apiPlans.map(apiPlan => {
            const planIdStr = String(apiPlan.plan_id);
            const globalPlan = globalPlans.find(gp => String(gp.externalPlanId) === planIdStr || gp.code === `IBDATA_${planIdStr}`);

            const profit_percentage = Math.ceil(globalPlan?.meta?.profit_percentage || 0);
            const base_price = Math.ceil(apiPlan.price || 0);
            const selling_price = globalPlan ? Math.ceil(globalPlan.price) : base_price;

            // Resolve network name
            let networkName = apiPlan.network_name || apiPlan.network || 'Unknown';
            const normalized = normalizeNetwork(networkName);
            if (normalized) {
                networkName = getNetworkName(normalized as NetworkId);
            }

            return {
                id: apiPlan.plan_id,
                network: networkName,
                type: apiPlan.type,
                plan_name: apiPlan.plan_name,
                base_price,
                profit_percentage,
                selling_price,
                status: globalPlan ? (globalPlan.active ? 'active' : 'inactive') : 'active'
            };
        });

        res.json({ success: true, data: mergedPlans });
    } catch (error) {
        console.error('Error fetching IBData plans:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updatePlanProfit = async (req: Request, res: Response) => {
    try {
        const { planId, profitPercentage, type, name, basePrice, network } = req.body;

        if (planId === undefined || profitPercentage === undefined || !type || !name || basePrice === undefined) {
            const missing = [];
            if (planId === undefined) missing.push('planId');
            if (profitPercentage === undefined) missing.push('profitPercentage');
            if (!type) missing.push('type');
            if (!name) missing.push('name');
            if (basePrice === undefined) missing.push('basePrice');

            logger.error('Missing fields in updatePlanProfit:', { missing, body: req.body });
            return res.status(400).json({ success: false, message: `Missing required fields: ${missing.join(', ')}` });
        }

        const sellingPrice = Math.ceil(Number(basePrice) * (1 + Number(profitPercentage) / 100));
        const planIdStr = String(planId);

        let plan = await AirtimePlan.findOne({ app_id: null, externalPlanId: planIdStr });

        if (plan) {
            plan.price = sellingPrice;
            plan.meta = { ...plan.meta, profit_percentage: Math.ceil(Number(profitPercentage)), base_price: Math.ceil(Number(basePrice)), network };
            await plan.save();
        } else {
            plan = await AirtimePlan.create({
                app_id: null,
                providerId: 1, // Default to 1 for IBData
                providerName: 'IBData',
                externalPlanId: planIdStr,
                code: `IBDATA_${planIdStr}`,
                name: name,
                price: sellingPrice,
                type: type.toUpperCase(),
                meta: { profit_percentage: Math.ceil(Number(profitPercentage)), base_price: Math.ceil(Number(basePrice)), network },
                active: true
            });
        }

        res.json({ success: true, message: 'Profit updated successfully', data: plan });
    } catch (error: any) {
        logger.error('Error updating plan profit:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export const syncIBDataPlans = async (req: Request, res: Response) => {
    try {
        // This could be a background job, but for now let's do it synchronously
        const dataPlans = await ibdataService.getDataPlans();
        const globalPlans = await AirtimePlan.find({ app_id: null });

        let syncedCount = 0;
        if (Array.isArray(dataPlans)) {
            for (const p of dataPlans) {
                const existing = globalPlans.find(gp => gp.externalPlanId === p.plan_id);
                if (!existing) {
                    await AirtimePlan.create({
                        app_id: null,
                        providerId: 1,
                        providerName: 'IBData',
                        externalPlanId: String(p.plan_id),
                        code: `IBDATA_${p.plan_id}`,
                        name: p.plan_name,
                        price: Math.ceil(p.price), // Default selling price = base price (0 profit)
                        type: 'DATA',
                        meta: { profit_percentage: 0, base_price: Math.ceil(p.price), network: p.network_name },
                        active: true
                    });
                    syncedCount++;
                }
            }
        }

        res.json({ success: true, message: `Synced ${syncedCount} new plans` });
    } catch (error) {
        logger.error('Error syncing IBData plans:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getIBDataBalance = async (req: Request, res: Response) => {
    try {
        const balance = await ibdataService.getWalletBalance();
        res.json({ success: true, data: balance });
    } catch (error) {
        logger.error('Error fetching IBData balance:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ============================================
// VTPAY MANAGEMENT
// ============================================

export const getVTPaySettings = async (req: Request, res: Response) => {
    try {
        const apiKey = await configService.get('VTPAY_API_KEY');
        const baseURL = await configService.get('VTPAY_BASE_URL');

        res.json({
            success: true,
            data: {
                apiKey: apiKey || '',
                baseURL: baseURL || 'https://api.vtpay.com/api'
            }
        });
    } catch (error: any) {
        logger.error('Error getting VTPay settings:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateVTPaySettings = async (req: Request, res: Response) => {
    try {
        const { apiKey, baseURL } = req.body;

        if (apiKey !== undefined) await configService.set('VTPAY_API_KEY', apiKey);
        if (baseURL !== undefined) await configService.set('VTPAY_BASE_URL', baseURL);

        res.json({ success: true, message: 'VTPay settings updated successfully' });
    } catch (error: any) {
        logger.error('Error updating VTPay settings:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getVTPayPlatformBalance = async (req: Request, res: Response) => {
    try {
        const result = await VTStackService.getPlatformBalance();
        res.json(result);
    } catch (error: any) {
        logger.error('Error getting VTPay platform balance:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getVTPayAccounts = async (req: Request, res: Response) => {
    try {
        const result = await VTStackService.getVirtualAccounts();
        res.json(result);
    } catch (error: any) {
        logger.error('Error fetching VTPay accounts:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createVTPayAccount = async (req: Request, res: Response) => {
    try {
        const result = await VTStackService.createVirtualAccount(req.body);
        res.status(201).json(result);
    } catch (error: any) {
        logger.error('Error creating VTPay account:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getVTPayAccountBalance = async (req: Request, res: Response) => {
    try {
        const { accountNumber } = req.params;
        const result = await VTStackService.getAccountBalance(accountNumber);
        res.json(result);
    } catch (error: any) {
        logger.error('Error fetching VTPay account balance:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getVTPayAccountTransactions = async (req: Request, res: Response) => {
    try {
        const { accountNumber } = req.params;
        const result = await VTStackService.getTransactions(accountNumber);
        res.json(result);
    } catch (error: any) {
        logger.error('Error fetching VTPay account transactions:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Build Option Prices Management
export const getBuildPrices = async (req: Request, res: Response) => {
    try {
        const priceKeys = [
            'PLATFORM_ANDROID',
            'PLATFORM_WEB',
            'PUBLISH_PRICE_PLAY_STORE',
            'PUBLISH_WEB'
        ];

        const prices: any = {};
        for (const key of priceKeys) {
            const value = await configService.get(key);
            prices[key] = value ? Number(value) : 0;
        }

        res.json({ success: true, data: prices });
    } catch (error: any) {
        logger.error('Error fetching build prices:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export const updateBuildPrice = async (req: Request, res: Response) => {
    try {
        const { key, value } = req.body;

        const validKeys = [
            'PLATFORM_ANDROID',
            'PLATFORM_WEB',
            'PUBLISH_PRICE_PLAY_STORE',
            'PUBLISH_WEB'
        ];

        if (!validKeys.includes(key)) {
            return res.status(400).json({ success: false, message: 'Invalid price key' });
        }

        const numValue = Number(value);
        if (isNaN(numValue) || numValue < 0) {
            return res.status(400).json({ success: false, message: 'Invalid price value' });
        }

        await configService.set(key, numValue.toString());

        res.json({ success: true, message: 'Build price updated successfully' });
    } catch (error: any) {
        logger.error('Error updating build price:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export const updateOwner = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, phone_number, company_name, email, status, password } = req.body;

        const updateData: any = {};
        if (first_name) updateData.first_name = first_name;
        if (last_name) updateData.last_name = last_name;
        if (phone_number) updateData.phone_number = phone_number;
        if (company_name) updateData.company_name = company_name;
        if (email) updateData.email = email;
        if (status) updateData.status = status;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        const owner = await VTfreeUser.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
        if (!owner) return res.status(404).json({ success: false, message: 'Owner not found' });

        res.json({ success: true, message: 'Owner updated successfully', data: { owner } });
    } catch (error) {
        console.error('Update owner error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteOwner = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const owner = await VTfreeUser.findByIdAndDelete(id);
        if (!owner) return res.status(404).json({ success: false, message: 'Owner not found' });

        res.json({ success: true, message: 'Owner deleted successfully' });
    } catch (error) {
        console.error('Delete owner error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateAdmin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, status, role, password } = req.body;

        const updateData: any = {};
        if (first_name) updateData.first_name = first_name;
        if (last_name) updateData.last_name = last_name;
        if (status) updateData.status = status;
        if (role) updateData.role = role;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        const admin = await AppAdmin.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
        if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

        res.json({ success: true, message: 'Admin updated successfully', data: { admin } });
    } catch (error) {
        console.error('Update admin error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteAdmin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const admin = await AppAdmin.findByIdAndDelete(id);
        if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

        res.json({ success: true, message: 'Admin deleted successfully' });
    } catch (error) {
        console.error('Delete admin error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
