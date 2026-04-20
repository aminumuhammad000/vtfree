import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Transaction } from '../models/transaction.model.js';
import { User } from '../models/user.model.js';
import Feature from '../models/Feature.js';
import { Plan } from '../models/plan.model.js';
import logger from '../utils/logger.js';
import { VTStackService } from '../services/vtstack.service.js';
import { configService } from '../services/config.service.js';
import SuperAdmin from '../models/super_admin.model.js';
export const login = async (req, res) => {
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
        const token = jwt.sign({
            user_id: admin._id,
            email: admin.email,
            type: 'super_admin',
            role: admin.role
        }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
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
    }
    catch (error) {
        console.error('Super admin login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
;
;
;
;
export const getAllUsers = async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        if (search) {
            query.$or = [
                { first_name: { $regex: search, $options: 'i' } },
                { last_name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone_number: { $regex: search, $options: 'i' } }
            ];
        }
        const users = await User.find(query).sort({ created_at: -1 });
        res.json({ success: true, data: { users } });
    }
    catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
;
;
;
;
;
;
;
export const getDashboardStats = async (req, res) => {
    try {
        const totalEndUsers = await User.countDocuments();
        const totalTransactions = await Transaction.countDocuments();
        const activeUsers = await User.countDocuments({ status: 'active' });
        const successfulTransactions = await Transaction.countDocuments({ status: 'successful' });
        const revenueResult = await Transaction.aggregate([
            { $match: { status: 'successful' } },
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
        // Daily Stats (Last 7 days revenue)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const daily_stats = await Transaction.aggregate([
            {
                $match: {
                    status: 'successful',
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
                total_users: totalEndUsers,
                total_transactions: totalTransactions,
                active_users: activeUsers,
                revenue,
                recent_transactions,
                daily_stats,
                totalUsers: totalEndUsers,
                totalTransactions,
                successfulTransactions,
                totalDataSales,
                totalAirtimeSales,
                activeUsers
            }
        });
    }
    catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
export const getUserWallets = async (req, res) => {
    try {
        const { Wallet } = await import('../models/wallet.model.js');
        const wallets = await Wallet.find()
            .populate('user_id', 'first_name last_name email status')
            .sort({ balance: -1 });
        res.json({ success: true, data: { wallets } });
    }
    catch (error) {
        console.error('Get user wallets error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
export const getAllTransactions = async (req, res) => {
    try {
        const { limit = 50, offset = 0, source = 'local' } = req.query;
        if (source === 'vtstack') {
            // @ts-ignore
            const result = await VTStackService.getAllTransactions(Number(limit), Number(offset));
            const normalized = result.data.transactions.map((tx) => ({
                _id: tx.id || tx._id,
                transaction_id: tx.reference,
                type: tx.type,
                amount: tx.amountNaira || (tx.amount / 100),
                status: tx.status,
                customer_phone: tx.userId?.phone || 'N/A',
                customer_name: tx.userId ? `${tx.userId.firstName} ${tx.userId.lastName}` : 'N/A',
                app_name: tx.userId?.businessName || 'VTStack Platform',
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
    }
    catch (error) {
        logger.error('Error fetching transactions:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
export const getAllPayments = async (req, res) => {
    try {
        const payments = await Transaction.find().sort({ created_at: -1 }).populate('user_id', 'email first_name last_name');
        res.json({ success: true, data: { payments } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
;
// Plans Management
export const getAllPlans = async (req, res) => {
    try {
        const plans = await Plan.find().sort({ created_at: -1 });
        res.json({ success: true, data: { plans } });
    }
    catch (error) {
        logger.error('Error fetching all plans:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
export const createPlan = async (req, res) => {
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
    }
    catch (error) {
        logger.error('Error creating plan:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
export const updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        if (updateData.price !== undefined) {
            updateData.price = Number(updateData.price) || 0;
        }
        const plan = await Plan.findByIdAndUpdate(id, updateData, { new: true });
        if (!plan)
            return res.status(404).json({ success: false, message: 'Plan not found' });
        res.json({ success: true, data: { plan } });
    }
    catch (error) {
        logger.error('Error updating plan:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
export const deletePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const plan = await Plan.findByIdAndDelete(id);
        if (!plan)
            return res.status(404).json({ success: false, message: 'Plan not found' });
        res.json({ success: true, message: 'Plan deleted' });
    }
    catch (error) {
        logger.error('Error deleting plan:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
// Features Management
export const getAllFeatures = async (req, res) => {
    try {
        const features = await Feature.find().sort({ created_at: -1 });
        res.json({ success: true, data: { features } });
    }
    catch (error) {
        logger.error('Error fetching all features:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
export const createFeature = async (req, res) => {
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
    }
    catch (error) {
        logger.error('Error creating feature:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
export const updateFeature = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        if (updateData.base_price !== undefined) {
            updateData.base_price = Number(updateData.base_price) || 0;
        }
        const feature = await Feature.findByIdAndUpdate(id, updateData, { new: true });
        if (!feature)
            return res.status(404).json({ success: false, message: 'Feature not found' });
        res.json({ success: true, data: { feature } });
    }
    catch (error) {
        logger.error('Error updating feature:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
export const deleteFeature = async (req, res) => {
    try {
        const { id } = req.params;
        const feature = await Feature.findByIdAndDelete(id);
        if (!feature)
            return res.status(404).json({ success: false, message: 'Feature not found' });
        res.json({ success: true, message: 'Feature deleted' });
    }
    catch (error) {
        logger.error('Error deleting feature:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
// System Settings Management
export const getSystemSettings = async (req, res) => {
    try {
        const { configService } = await import('../services/config.service.js');
        const settings = {
            general: {
                companyName: await configService.get('COMPANY_NAME', 'VTStack Systems'),
                supportEmail: await configService.get('SUPPORT_EMAIL', 'support@vtstack.com'),
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
                vtstack: {
                    apiKey: await configService.get('VTSTACK_API_KEY', ''),
                    secretKey: await configService.get('VTSTACK_SECRET_KEY', ''),
                    baseUrl: await configService.get('VTSTACK_BASE_URL', 'https://api.vtstack.com.ng'),
                    isLive: (await configService.get('VTSTACK_IS_LIVE', 'false')) === 'true',
                }
            }
        };
        res.json({ success: true, data: settings });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const updateSystemSettings = async (req, res) => {
    try {
        const { configService } = await import('../services/config.service.js');
        const settings = req.body;
        if (settings.general) {
            if (settings.general.companyName !== undefined)
                await configService.set('COMPANY_NAME', settings.general.companyName);
            if (settings.general.supportEmail !== undefined)
                await configService.set('SUPPORT_EMAIL', settings.general.supportEmail);
            if (settings.general.timezone !== undefined)
                await configService.set('TIMEZONE', settings.general.timezone);
            if (settings.general.currency !== undefined)
                await configService.set('CURRENCY', settings.general.currency);
            if (settings.general.maintenanceMode !== undefined)
                await configService.set('MAINTENANCE_MODE', String(settings.general.maintenanceMode));
        }
        if (settings.notifications) {
            if (settings.notifications.emailAlerts !== undefined)
                await configService.set('EMAIL_ALERTS', String(settings.notifications.emailAlerts));
            if (settings.notifications.slackIntegration !== undefined)
                await configService.set('SLACK_INTEGRATION', String(settings.notifications.slackIntegration));
            if (settings.notifications.webhookRetries !== undefined)
                await configService.set('WEBHOOK_RETRIES', String(settings.notifications.webhookRetries));
            if (settings.notifications.dailyReports !== undefined)
                await configService.set('DAILY_REPORTS', String(settings.notifications.dailyReports));
        }
        if (settings.security) {
            if (settings.security.twoFactorAuth !== undefined)
                await configService.set('TWO_FACTOR_AUTH', String(settings.security.twoFactorAuth));
            if (settings.security.sessionTimeout !== undefined)
                await configService.set('SESSION_TIMEOUT', String(settings.security.sessionTimeout));
            if (settings.security.passwordExpiry !== undefined)
                await configService.set('PASSWORD_EXPIRY', String(settings.security.passwordExpiry));
            if (settings.security.ipWhitelist !== undefined)
                await configService.set('IP_WHITELIST', settings.security.ipWhitelist);
        }
        if (settings.integrations && settings.integrations.vtstack) {
            const vts = settings.integrations.vtstack;
            if (vts.apiKey !== undefined)
                await configService.set('VTSTACK_API_KEY', vts.apiKey);
            if (vts.secretKey !== undefined)
                await configService.set('VTSTACK_SECRET_KEY', vts.secretKey);
            if (vts.baseUrl !== undefined)
                await configService.set('VTSTACK_BASE_URL', vts.baseUrl);
            if (vts.isLive !== undefined)
                await configService.set('VTSTACK_IS_LIVE', String(vts.isLive));
        }
        res.json({ success: true, message: 'System settings updated successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const getLogs = async (req, res) => {
    try {
        const { type } = req.query;
        const { AuditLog } = await import('../models/audit_log.model.js');
        const query = {};
        if (type && type !== 'all') {
            query.type = type;
        }
        const logs = await AuditLog.find(query)
            .sort({ created_at: -1 })
            .limit(100);
        res.json({ success: true, data: { logs } });
    }
    catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
export const getAllTickets = async (req, res) => {
    try {
        const { SupportTicket } = await import('../models/support_ticket.model.js');
        const tickets = await SupportTicket.find()
            .populate('user_id', 'first_name last_name email')
            .sort({ created_at: -1 });
        res.json({ success: true, data: { tickets } });
    }
    catch (error) {
        console.error('Get tickets error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
export const updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, priority } = req.body;
        const { SupportTicket } = await import('../models/support_ticket.model.js');
        const ticket = await SupportTicket.findByIdAndUpdate(id, { status, priority, updated_at: new Date() }, { new: true });
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }
        res.json({ success: true, message: 'Ticket updated', data: { ticket } });
    }
    catch (error) {
        console.error('Update ticket error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
// ============================================
// VTSTACK MANAGEMENT
// ============================================
export const getVTStackSettings = async (req, res) => {
    try {
        const apiKey = await configService.get('VTSTACK_API_KEY');
        const baseURL = await configService.get('VTSTACK_BASE_URL');
        res.json({
            success: true,
            data: {
                apiKey: apiKey || '',
                baseURL: baseURL || 'https://api.vtstack.com.ng/api'
            }
        });
    }
    catch (error) {
        logger.error('Error getting VTStack settings:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
export const updateVTStackSettings = async (req, res) => {
    try {
        const { apiKey, baseURL } = req.body;
        if (apiKey !== undefined)
            await configService.set('VTSTACK_API_KEY', apiKey);
        if (baseURL !== undefined)
            await configService.set('VTSTACK_BASE_URL', baseURL);
        res.json({ success: true, message: 'VTStack settings updated successfully' });
    }
    catch (error) {
        logger.error('Error updating VTStack settings:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
export const getVTStackPlatformBalance = async (req, res) => {
    try {
        const result = await VTStackService.getPlatformBalance();
        res.json(result);
    }
    catch (error) {
        logger.error('Error getting VTStack platform balance:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
export const getVTStackAccounts = async (req, res) => {
    try {
        const result = await VTStackService.getVirtualAccounts();
        res.json(result);
    }
    catch (error) {
        logger.error('Error fetching VTStack accounts:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
export const createVTStackAccount = async (req, res) => {
    try {
        const result = await VTStackService.createVirtualAccount(req.body);
        res.status(201).json(result);
    }
    catch (error) {
        logger.error('Error creating VTStack account:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
export const getVTStackAccountBalance = async (req, res) => {
    try {
        const { accountNumber } = req.params;
        const result = await VTStackService.getAccountBalance(accountNumber);
        res.json(result);
    }
    catch (error) {
        logger.error('Error fetching VTStack account balance:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
export const getVTStackAccountTransactions = async (req, res) => {
    try {
        const { accountNumber } = req.params;
        const result = await VTStackService.getTransactions(accountNumber);
        res.json(result);
    }
    catch (error) {
        logger.error('Error fetching VTStack account transactions:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// Build Option Prices Management
;
;
;
;
;
;
