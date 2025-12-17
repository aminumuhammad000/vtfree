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
        // Fetch End Users instead of Admins
        const users = await User.find().sort({ created_at: -1 });
        res.json({ success: true, data: { users } });
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
                    total: { $sum: "$amount" }
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
