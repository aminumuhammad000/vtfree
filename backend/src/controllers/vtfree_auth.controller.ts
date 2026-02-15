import { config } from '../config/env.js';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import VTfreeUser from '../models/vtfree_user.model.js';
import { logger } from '../config/bootstrap.js';
import { VTStackService } from '../services/vtstack.service.js';

export const createVirtualAccount = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id; // Corrected to use req.user.id
        const user = await VTfreeUser.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.virtual_account && user.virtual_account.account_number) {
            return res.status(400).json({ success: false, message: 'Virtual account already exists' });
        }

        const { bvn } = req.body;
        // bankType is deprecated as VTStack uses PalmPay by default

        // Save BVN if provided (and not already saved)
        if (bvn && bvn.length === 11) {
            user.bvn = bvn;
            await user.save();
        }

        const vtstackData = {
            firstName: user.first_name,
            lastName: user.last_name || 'User',
            email: user.email,
            phone: user.phone_number,
            bvn: user.bvn || bvn, // Use stored BVN or provided BVN
            reference: `VTF_${user._id}_${Date.now()}`
        };

        const result = await VTStackService.createVirtualAccount(vtstackData);

        if (result.success) {
            user.virtual_account = {
                bank: result.data.bankName,
                account_number: result.data.accountNumber,
                account_name: result.data.accountName
            };
            await user.save();

            res.json({
                success: true,
                message: 'Virtual account created successfully',
                data: user.virtual_account
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message || 'Failed to create virtual account'
            });
        }
    } catch (error: any) {
        logger.error('Create virtual account error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};


export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, first_name, last_name, phone_number, company_name } = req.body;

        // Check if user exists
        const existingUser = await VTfreeUser.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = new VTfreeUser({
            email,
            password: hashedPassword,
            first_name,
            last_name,
            phone_number,
            company_name,
            status: 'active', // Auto-activate for now
            email_verified: false,
        });

        await user.save();

        // Generate token
        const token = jwt.sign(
            {
                user_id: user._id,
                email: user.email,
                type: 'vtfree_user',
                role: 'owner'
            },
            config.jwtSecret,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                user: {
                    _id: user._id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    status: user.status,
                    wallet_balance: user.wallet_balance,
                },
                token,
            },
        });
    } catch (error: any) {
        logger.error('Registration error:', error);

        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err: any) => err.message);
            return res.status(400).json({
                success: false,
                message: messages[0] || 'Validation error'
            });
        }

        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        let { email, password } = req.body;

        // Sanitize input
        email = email?.trim().toLowerCase();

        // Detailed Debug Logging
        console.log('=== LOGIN ATTEMPT ===');
        console.log(`Email: '${email}'`);
        console.log(`Password length: ${password?.length} `);

        // Find user
        const user = await VTfreeUser.findOne({ email });
        if (!user) {
            console.log(`[Login] User not found for email: '${email}'`);
            // Check if it exists in users collection just to be helpful
            const mongoose = require('mongoose');
            const otherUser = await mongoose.connection.collection('users').findOne({ email });
            if (otherUser) console.log(`Note: User found in 'users' collection but not 'vtfreeusers'`);

            return res.status(400).json({ success: false, message: 'Invalid credentials (User)' });
        }

        console.log(`[Login] User found: ${user._id} | Hash: ${user.password?.substring(0, 10)}...`);

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`[Login] Password match result: ${isMatch} `);

        if (!isMatch) {
            console.log(`[Login] Password mismatch!`);
            return res.status(400).json({ success: false, message: 'Invalid credentials (Password)' });
        }

        // Generate token
        const token = jwt.sign(
            {
                user_id: user._id,
                email: user.email,
                type: 'vtfree_user',
                role: 'owner'
            },
            config.jwtSecret,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    _id: user._id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    status: user.status,
                    wallet_balance: user.wallet_balance,
                },
                token,
            },
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getProfile = async (req: Request, res: Response) => {
    try {
        const user = await VTfreeUser.findById((req as any).user.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: { user },
        });
    } catch (error) {
        logger.error('Profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const { first_name, last_name, email, profile_picture } = req.body;
        const user_id = (req as any).user.id;

        const user = await VTfreeUser.findById(user_id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (first_name) user.first_name = first_name;
        if (last_name) user.last_name = last_name;
        if (profile_picture) user.profile_picture = profile_picture;
        // Email update might require verification in a real app, keeping it simple for now
        if (email) user.email = email;

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    _id: user._id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    status: user.status,
                    wallet_balance: user.wallet_balance,
                    profile_picture: user.profile_picture
                }
            }
        });
    } catch (error) {
        logger.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const user = await VTfreeUser.findOne({ email });

        if (!user) {
            // For security, return success even if user not found
            return res.json({ success: true, message: 'If your email is registered, you will receive a reset code.' });
        }

        // Generate 4-digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        user.reset_password_token = otp;
        user.reset_password_expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await user.save();

        // Send email
        const { EmailService } = await import('../services/email.service.js');
        await EmailService.sendOTP(email, otp);

        res.json({ success: true, message: 'Reset code sent to your email' });
    } catch (error) {
        logger.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { email, code, newPassword } = req.body;
        const user = await VTfreeUser.findOne({
            email,
            reset_password_token: code,
            reset_password_expires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset code' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.reset_password_token = undefined;
        user.reset_password_expires = undefined;

        await user.save();

        res.json({ success: true, message: 'Password reset successful. You can now login with your new password.' });
    } catch (error) {
        logger.error('Reset password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const uploadProfilePicture = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const userId = (req as any).user.id;
        const { cloudinaryService } = await import('../services/cloudinary.service.js');
        const fs = await import('fs');

        // Upload to Cloudinary
        const uploadResult = await cloudinaryService.uploadImage(req.file.path, `vtfree/profiles/${userId}`);

        // Clean up local file
        if (fs.default.existsSync(req.file.path)) {
            fs.default.unlinkSync(req.file.path);
        }

        // Update user record with new profile picture URL
        const user = await VTfreeUser.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.profile_picture = uploadResult.secure_url;
        await user.save();

        res.json({
            success: true,
            message: 'Profile picture updated successfully',
            url: uploadResult.secure_url,
            user: {
                _id: user._id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                profile_picture: user.profile_picture
            }
        });
    } catch (error: any) {
        logger.error('Upload profile picture error:', error);

        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};
