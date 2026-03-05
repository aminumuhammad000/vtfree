import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import AppAdmin from '../models/app_admin.model.js';
import CreatedApp from '../models/created_app.model.js';
export const login = async (req, res) => {
    try {
        let { app_id, email, password } = req.body;
        // Sanitize inputs
        email = email?.trim().toLowerCase();
        app_id = app_id?.trim();
        console.log(`Login attempt for App identifier: ${app_id}, Email: ${email}`);
        // Try to find the app by package_name OR app_id
        let app = await CreatedApp.findOne({
            $or: [
                { package_name: app_id },
                { app_id: app_id }
            ]
        });
        if (!app) {
            // Fallback: Try case-insensitive package name
            app = await CreatedApp.findOne({
                package_name: { $regex: new RegExp(`^${app_id}$`, 'i') }
            });
        }
        if (!app) {
            console.log(`Login failed: App not found for identifier ${app_id}`);
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }
        const actual_app_id = app.app_id;
        console.log(`Resolved app_id: ${actual_app_id}`);
        // Find admin for specific app
        let admin = await AppAdmin.findOne({ app_id: actual_app_id, email });
        if (!admin) {
            // Fallback: Admin might have been created with the provided identifier as app_id directly
            admin = await AppAdmin.findOne({ app_id, email });
        }
        console.log('Admin query result:', admin ? 'Found' : 'Not Found');
        if (!admin) {
            console.log(`Login failed: Admin not found for email ${email} and app identifier ${app_id}`);
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }
        // Check password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            console.log(`Login failed: Password mismatch for email ${email}`);
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }
        // Generate token
        const token = jwt.sign({
            id: admin._id,
            email: admin.email,
            app_id: admin.app_id,
            type: 'app_admin',
            role: admin.role
        }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1d' });
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
                    package_name: app?.package_name,
                },
                token,
            },
        });
    }
    catch (error) {
        console.error('App admin login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
export const getDashboardStats = async (req, res) => {
    try {
        const app_id = req.user.app_id;
        const userId = req.user.id;
        const { logger } = await import('../config/bootstrap.js');
        logger.info(`[DashboardStats] Request from User: ${userId}, App ID: ${app_id}`);
        if (!app_id) {
            logger.warn(`[DashboardStats] WARNING: No app_id found in token for user ${userId}`);
        }
        // Import models locally to avoid circular dependency issues if any, or just ensure imports are top-level
        const User = mongoose.model('User');
        const Transaction = mongoose.model('Transaction');
        // Run aggregations in parallel
        const [totalUsers, activeUsers, totalTransactions, successfulTransactions, dataSales, airtimeSales, pendingTransactions] = await Promise.all([
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
            ]),
            Transaction.countDocuments({ app_id, status: 'pending' })
        ]);
        console.log(`[DashboardStats] Results for ${app_id}:`, {
            totalUsers,
            activeUsers,
            totalTransactions,
            successfulTransactions,
            totalDataSales: dataSales[0]?.total || 0,
            totalAirtimeSales: airtimeSales[0]?.total || 0
        });
        const stats = {
            app_id, // For debugging
            totalUsers,
            activeUsers,
            totalTransactions,
            successfulTransactions,
            totalDataSales: dataSales[0]?.total || 0,
            totalAirtimeSales: airtimeSales[0]?.total || 0,
            pendingTransactions
        };
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
export const updateProfile = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { first_name, last_name, email } = req.body;
        const admin = await AppAdmin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        if (first_name)
            admin.first_name = first_name;
        if (last_name)
            admin.last_name = last_name;
        if (email)
            admin.email = email.toLowerCase().trim();
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
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
export const changePassword = async (req, res) => {
    try {
        const adminId = req.user.id;
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
    }
    catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
export const getAuditLogs = async (req, res) => {
    try {
        const app_id = req.user.app_id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { AuditLog } = await import('../models/audit_log.model.js');
        const { ApiResponse } = await import('../utils/response.js');
        const logs = await AuditLog.find({ app_id })
            .populate('admin_id', 'first_name last_name email')
            .populate('user_id', 'first_name last_name email')
            .skip(skip)
            .limit(limit)
            .sort({ timestamp: -1 });
        const total = await AuditLog.countDocuments({ app_id });
        return ApiResponse.paginated(res, logs, {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }, 'Audit logs retrieved successfully');
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const deleteAuditLog = async (req, res) => {
    try {
        const app_id = req.user.app_id;
        const { id } = req.params;
        const { AuditLog } = await import('../models/audit_log.model.js');
        const log = await AuditLog.findOneAndDelete({ _id: id, app_id });
        if (!log) {
            return res.status(404).json({ success: false, message: 'Audit log not found' });
        }
        res.json({ success: true, message: 'Audit log deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const createAdmin = async (req, res) => {
    try {
        const { email, first_name, last_name, password, role } = req.body;
        const app_id = req.user.app_id;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }
        const exists = await AppAdmin.findOne({ app_id, email: email.toLowerCase().trim() });
        if (exists) {
            return res.status(400).json({ success: false, message: 'Admin with this email already exists for this app' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const admin = await AppAdmin.create({
            app_id,
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            first_name,
            last_name,
            role: role || 'admin',
            status: 'active'
        });
        res.status(201).json({
            success: true,
            message: 'Admin created successfully',
            data: {
                _id: admin._id,
                email: admin.email,
                first_name: admin.first_name,
                last_name: admin.last_name,
                role: admin.role,
                app_id: admin.app_id
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const getAllAdmins = async (req, res) => {
    try {
        const app_id = req.user.app_id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const admins = await AppAdmin.find({ app_id })
            .select('-password')
            .skip(skip)
            .limit(limit)
            .sort({ created_at: -1 });
        const total = await AppAdmin.countDocuments({ app_id });
        res.json({
            success: true,
            data: admins,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
