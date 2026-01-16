import { config } from '../config/env.js';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import VTfreeUser from '../models/vtfree_user.model.js';

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
    } catch (error) {
        console.error('Registration error:', error);
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
        console.log(`📧 Email: '${email}'`);
        console.log(`🔑 Password length: ${password?.length}`);

        // Find user
        const user = await VTfreeUser.findOne({ email });
        if (!user) {
            console.log(`❌ [Login] User not found for email: '${email}'`);
            // Check if it exists in users collection just to be helpful
            const mongoose = require('mongoose');
            const otherUser = await mongoose.connection.collection('users').findOne({ email });
            if (otherUser) console.log(`⚠️ Note: User found in 'users' collection but not 'vtfreeusers'`);

            return res.status(400).json({ success: false, message: 'Invalid credentials (User)' });
        }

        console.log(`✅ [Login] User found: ${user._id} | Hash: ${user.password?.substring(0, 10)}...`);

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`🔐 [Login] Password match result: ${isMatch}`);

        if (!isMatch) {
            console.log(`❌ [Login] Password mismatch!`);
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
        console.error('Login error:', error);
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
        console.error('Profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const { first_name, last_name, email } = req.body;
        const user_id = (req as any).user.id;

        const user = await VTfreeUser.findById(user_id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (first_name) user.first_name = first_name;
        if (last_name) user.last_name = last_name;
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
                }
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
