import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import AppAdmin from '../models/app_admin.model.js';
import CreatedApp from '../models/created_app.model.js';
import { User } from '../models/user.model.js';
import { Transaction } from '../models/transaction.model.js';

export const login = async (req: Request, res: Response) => {
    try {
        const { app_id, email, password } = req.body;

        // Find admin for specific app
        const admin = await AppAdmin.findOne({ app_id, email });
        if (!admin) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Get App details
        const app = await CreatedApp.findOne({ app_id });

        // Generate token
        const token = jwt.sign(
            {
                user_id: admin._id,
                email: admin.email,
                app_id: admin.app_id,
                type: 'app_admin',
                role: admin.role
            },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );

        // Update last login
        admin.last_login = new Date();
        await admin.save();

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                admin: {
                    _id: admin._id,
                    email: admin.email,
                    role: admin.role,
                    app_id: admin.app_id,
                },
                app: {
                    name: app?.app_name,
                    logo: app?.branding.logo_url,
                },
                token,
            },
        });
    } catch (error) {
        console.error('App admin login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const app_id = (req as any).user.app_id;

        // Run aggregations in parallel
        const [
            totalUsers,
            activeUsers,
            totalTransactions,
            successfulTransactions,
            dataSales,
            airtimeSales
        ] = await Promise.all([
            User.countDocuments({}),
            User.countDocuments({ status: 'active' }),
            Transaction.countDocuments({}),
            Transaction.countDocuments({ status: 'successful' }),
            Transaction.aggregate([
                { $match: { type: 'data_purchase', status: 'successful' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Transaction.aggregate([
                { $match: { type: 'airtime_topup', status: 'successful' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ])
        ]);

        const stats = {
            totalUsers,
            activeUsers,
            totalTransactions,
            successfulTransactions,
            totalDataSales: dataSales[0]?.total || 0,
            totalAirtimeSales: airtimeSales[0]?.total || 0
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
