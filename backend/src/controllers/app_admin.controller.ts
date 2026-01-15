import { Request, Response } from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import AppAdmin from '../models/app_admin.model.js';
import CreatedApp from '../models/created_app.model.js';
import { User } from '../models/user.model.js';
import { Transaction } from '../models/transaction.model.js';

export const login = async (req: Request, res: Response) => {
    try {
        let { app_id, email, password } = req.body;

        // Sanitize inputs
        email = email?.trim().toLowerCase();
        app_id = app_id?.trim(); // Keep case sensitivity for app_id unless we decide otherwise, but definitely trim. 
        // Actually, let's try to find it case-insensitive if exact match fails, or just enforce lowercase if that's the convention.
        // Given the previous script created 'vtu_app_001', let's try to be flexible.
        // But for now, just trim is safe.

        console.log(`Login attempt for App: ${app_id}, Email: ${email}`);

        console.log(`Login attempt for App: ${app_id}, Email: ${email}`);
        console.log(`Connected to DB: ${mongoose.connection.name}`);

        // Find admin for specific app
        let admin = await AppAdmin.findOne({ app_id, email });

        // Fallback: Case-insensitive App ID check
        if (!admin) {
            console.log('Exact match not found, trying case-insensitive App ID...');
            // We can't easily do case-insensitive find on a non-regex field without regex, 
            // but since app_id is likely unique per app, we can try to find the app first?
            // Or just use regex for app_id.
            admin = await AppAdmin.findOne({
                app_id: { $regex: new RegExp(`^${app_id}$`, 'i') },
                email
            });
        }

        console.log('Admin query result:', admin ? 'Found' : 'Not Found');

        if (!admin) {
            console.log(`Login failed: Admin not found for email ${email} and app_id ${app_id}`);
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Check password
        console.log('Comparing passwords...');
        const isMatch = await bcrypt.compare(password, admin.password);
        console.log('Password match result:', isMatch);

        if (!isMatch) {
            console.log(`Login failed: Password mismatch for email ${email}`);
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Get App details
        const app = await CreatedApp.findOne({ app_id });

        // Generate token
        const token = jwt.sign(
            {
                id: admin._id,
                email: admin.email,
                app_id: admin.app_id,
                type: 'app_admin',
                role: admin.role
            },
            process.env.JWT_SECRET || 'your-secret-key',
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
            User.countDocuments({ app_id }),
            User.countDocuments({ app_id, status: 'active' }),
            Transaction.countDocuments({ app_id }),
            Transaction.countDocuments({ app_id, status: 'successful' }),
            Transaction.aggregate([
                { $match: { app_id, type: 'data_purchase', status: 'successful' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Transaction.aggregate([
                { $match: { app_id, type: 'airtime_topup', status: 'successful' } },
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

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const adminId = (req as any).user.id;
        const { first_name, last_name, email } = req.body;

        const admin = await AppAdmin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        if (first_name) admin.first_name = first_name;
        if (last_name) admin.last_name = last_name;
        if (email) admin.email = email.toLowerCase().trim();

        await admin.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                _id: admin._id,
                email: admin.email,
                first_name: admin.first_name,
                last_name: admin.last_name,
                role: admin.role,
                app_id: admin.app_id,
                status: admin.status,
                last_login: admin.last_login
            }
        });
    } catch (error: any) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    try {
        const adminId = (req as any).user.id;
        const { currentPassword, newPassword } = req.body;

        const admin = await AppAdmin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Incorrect current password' });
        }

        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(newPassword, salt);
        await admin.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error: any) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
